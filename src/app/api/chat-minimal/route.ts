import { streamText, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
  advisorId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    console.log("=== MINIMAL CHAT API START ===");
    console.log("Step 1: Parsing request...");
    
    const body = await req.json();
    const { messages } = requestSchema.parse(body);
    console.log("Step 1 SUCCESS: Request parsed, messages:", messages.length);

    console.log("Step 2: Environment check...");
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("Step 2 FAILED: Missing OPENROUTER_API_KEY");
      return new Response("Missing API key", { status: 500 });
    }
    console.log("Step 2 SUCCESS: API key present, length:", apiKey.length);

    console.log("Step 3: Creating OpenRouter client...");
    const openrouterClient = createOpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "AI Advisor Chat Minimal Test",
      },
    });
    console.log("Step 3 SUCCESS: OpenRouter client created");

    console.log("Step 4: Preparing AI messages...");
    const aiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    console.log("Step 4 SUCCESS: AI messages prepared:", aiMessages.length);

    console.log("Step 5: Calling generateText...");
    const result = await generateText({
      model: openrouterClient.languageModel("x-ai/grok-code-fast-1"),
      messages: aiMessages,
      temperature: 0.7,
    });
    console.log("Step 5 SUCCESS: AI response received");
    console.log("- Text length:", result.text?.length || 0);
    console.log("- Text preview:", result.text?.substring(0, 100) || '(empty)');
    console.log("- Finish reason:", result.finishReason);
    console.log("- Usage:", JSON.stringify(result.usage));

    if (!result.text || result.text.length === 0) {
      console.error("Step 5 FAILED: Empty AI response");
      return new Response("Empty AI response", { status: 500 });
    }

    console.log("Step 6: Returning response...");
    return new Response(result.text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "X-Test": "minimal-chat-success",
        "X-Text-Length": result.text.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("MINIMAL CHAT ERROR:", error.message);
    console.error("Error stack:", error.stack);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: {
        "X-Error": "minimal-chat-failed",
        "X-Error-Message": error.message,
      }
    });
  }
}
