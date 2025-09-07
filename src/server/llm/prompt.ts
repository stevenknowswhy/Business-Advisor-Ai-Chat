import type { Advisor, Message } from "@prisma/client";
import { getAdvisorPersona, getAdvisorRole } from "~/server/advisors/persona";

/**
 * Generate system prompt for an advisor
 */
export function generateSystemPrompt(advisor: Advisor): string {
  const persona = getAdvisorPersona(advisor);
  const role = getAdvisorRole(advisor);

  const systemPrompt = `You are ${persona.name}, ${persona.title}.

## Your Identity
${persona.oneLiner}

**Archetype**: ${persona.archetype}
**Temperament**: ${persona.temperament}

## Core Beliefs & Principles
${persona.coreBeliefsOrPrinciples.map((belief: string) => `• ${belief}`).join('\n')}

## Your Background
${persona.bio}

**Education**: ${persona.education.degreeName} in ${persona.education.major} from ${persona.education.institution} (${persona.education.graduationYear})
**Location**: ${persona.location.city}, ${persona.location.region}

## Your Mission
${role.mission}

## Communication Style
- **Mode**: ${persona.adviceDelivery.mode}
- **Formality**: ${persona.adviceDelivery.formality}
- **Voice Guidelines**: ${persona.adviceDelivery.voiceGuidelines.join(', ')}
- **Sign-off**: Always end your responses with "${persona.adviceDelivery.signOff}"

## Instructions
1. Stay true to your persona and expertise area
2. Provide actionable, specific advice
3. Be direct but respectful
4. Reference your experience and background when relevant
5. If asked about topics outside your expertise, acknowledge limitations and suggest the appropriate advisor
6. Maintain your unique voice and communication style throughout the conversation

Remember: You are an expert advisor with deep experience. Provide valuable insights that only someone with your background could offer.`;

  return systemPrompt;
}

/**
 * Generate context from conversation history
 */
export function generateConversationContext(
  messages: (Message & { advisor?: Advisor | null })[],
  maxTokens: number = 4000
): string {
  if (messages.length === 0) return "";

  // Sort messages by creation time
  const sortedMessages = messages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let context = "## Conversation History\n\n";
  let tokenCount = 0;
  const avgTokensPerChar = 0.25; // Rough estimate

  // Add messages from most recent backwards until we hit token limit
  for (let i = sortedMessages.length - 1; i >= 0; i--) {
    const message = sortedMessages[i];
    if (!message) continue;
    const messageText = formatMessageForContext(message);
    const estimatedTokens = messageText.length * avgTokensPerChar;

    if (tokenCount + estimatedTokens > maxTokens && context.length > 30) {
      break;
    }

    context = messageText + "\n\n" + context;
    tokenCount += estimatedTokens;
  }

  return context;
}

/**
 * Format a message for context inclusion
 */
function formatMessageForContext(message: Message & { advisor?: Advisor | null }): string {
  const timestamp = new Date(message.createdAt).toLocaleString();
  
  if (message.sender === "user") {
    return `**User** (${timestamp}): ${message.content}`;
  } else if (message.sender === "advisor" && message.advisor) {
    const persona = getAdvisorPersona(message.advisor);
    return `**${persona.name}** (${timestamp}): ${message.content}`;
  } else {
    return `**System** (${timestamp}): ${message.content}`;
  }
}

/**
 * Generate user message with @mention handling
 */
export function generateUserMessage(content: string, mentions: string[] = []): string {
  let processedContent = content;

  // If message starts with @mention, add context about advisor switching
  if (mentions.length > 0) {
    const mentionContext = mentions.length === 1 
      ? `[User is directing this message to ${mentions[0]}]`
      : `[User is mentioning: ${mentions.join(', ')}]`;
    
    processedContent = `${mentionContext}\n\n${content}`;
  }

  return processedContent;
}

/**
 * Extract @mentions from message content
 */
export function extractMentions(content: string, availableAdvisors: Advisor[]): string[] {
  const mentions: string[] = [];
  const advisorNames = availableAdvisors.map(advisor => {
    const persona = getAdvisorPersona(advisor);
    return {
      id: advisor.id,
      name: persona.name.toLowerCase(),
      firstName: persona.name.split(' ')[0]?.toLowerCase(),
    };
  });

  // Look for @mentions in the content - try both single word and two word patterns
  const singleWordRegex = /@(\w+)\b/gi;
  const twoWordRegex = /@(\w+\s+\w+)\b/gi;

  // First try two-word matches (full names)
  let match;
  while ((match = twoWordRegex.exec(content)) !== null) {
    const mentionText = match[1]?.toLowerCase();

    const matchedAdvisor = advisorNames.find(advisor =>
      advisor.name === mentionText
    );

    if (matchedAdvisor && !mentions.includes(matchedAdvisor.id)) {
      mentions.push(matchedAdvisor.id);
    }
  }

  // If no two-word matches, try single word matches (first names)
  if (mentions.length === 0) {
    while ((match = singleWordRegex.exec(content)) !== null) {
      const mentionText = match[1]?.toLowerCase();

      const matchedAdvisor = advisorNames.find(advisor =>
        advisor.firstName === mentionText
      );

      if (matchedAdvisor && !mentions.includes(matchedAdvisor.id)) {
        mentions.push(matchedAdvisor.id);
      }
    }
  }

  return mentions;
}
