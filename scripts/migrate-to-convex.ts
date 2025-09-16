#!/usr/bin/env tsx

/**
 * PostgreSQL to Convex Migration Script
 *
 * This script migrates all data from the PostgreSQL database to Convex,
 * maintaining data integrity and relationships.
 */

import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize clients
const prisma = new PrismaClient();
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Migration state tracking
interface MigrationState {
  userIdMap: Map<string, Id<"users">>;
  advisorIdMap: Map<string, Id<"advisors">>;
  conversationIdMap: Map<string, Id<"conversations">>;
  messageIdMap: Map<string, Id<"messages">>;
  errors: Array<{ entity: string; id: string; error: string }>;
  migrated: {
    users: number;
    advisors: number;
    conversations: number;
    messages: number;
    advisorMemories: number;
    threadSummaries: number;
  };
}

const migrationState: MigrationState = {
  userIdMap: new Map(),
  advisorIdMap: new Map(),
  conversationIdMap: new Map(),
  messageIdMap: new Map(),
  errors: [],
  migrated: {
    users: 0,
    advisors: 0,
    conversations: 0,
    messages: 0,
    advisorMemories: 0,
    threadSummaries: 0,
  },
};

// Utility functions
function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function logProgress(entity: string, current: number, total: number) {
  const percentage = Math.round((current / total) * 100);
  console.log(`  ${entity}: ${current}/${total} (${percentage}%)`);
}

function logError(entity: string, id: string, error: any) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  migrationState.errors.push({ entity, id, error: errorMessage });
  console.error(`  ❌ Error migrating ${entity} ${id}: ${errorMessage}`);
}

// Migration functions
async function migrateUsers() {
  console.log("\n👥 Migrating Users...");
  
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users to migrate`);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (!user) continue;

    try {
      const convexUserId = await convex.mutation(api.users.create, {
        clerkId: user.id!, // Use PostgreSQL ID as Clerk ID for migration
        email: user.email || undefined,
        name: user.name || undefined,
        image: user.image || undefined,
        plan: user.plan!,
        createdAt: toUnixTimestamp(user.createdAt),
        updatedAt: toUnixTimestamp(user.updatedAt),
      });

      migrationState.userIdMap.set(user.id, convexUserId);
      migrationState.migrated.users++;
      logProgress("Users", i + 1, users.length);
    } catch (error) {
      logError("User", user.id, error);
    }
  }
}

async function migrateAdvisors() {
  console.log("\n🤖 Migrating Advisors...");
  
  const advisors = await prisma.advisor.findMany();
  console.log(`Found ${advisors.length} advisors to migrate`);

  for (let i = 0; i < advisors.length; i++) {
    const advisor = advisors[i];
    if (!advisor) continue;

    try {
      // Transform persona JSON to match Convex schema
      const persona = advisor.persona as any;
      const transformedPersona = {
        name: persona.name || `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim(),
        title: persona.title || persona.role || "AI Advisor",
        description: persona.description,
        personality: Array.isArray(persona.personality) ? persona.personality : [],
        expertise: Array.isArray(persona.expertise) ? persona.expertise : [],
      };

      const convexAdvisorId = await convex.mutation(api.advisors.create, {
        firstName: advisor.firstName || undefined,
        lastName: advisor.lastName || undefined,
        imageUrl: advisor.imageUrl || undefined,
        schemaVersion: advisor.schemaVersion,
        status: advisor.status as "active" | "inactive" | "archived",
        persona: transformedPersona,
        roleDefinition: advisor.roleDefinition ? {
          role: (advisor.roleDefinition as any).role,
          responsibilities: (advisor.roleDefinition as any).responsibilities || [],
          constraints: (advisor.roleDefinition as any).constraints || [],
        } : undefined,
        components: Array.isArray(advisor.components) ? advisor.components : [],
        metadata: advisor.metadata ? {
          version: (advisor.metadata as any).version,
          author: (advisor.metadata as any).author,
          category: (advisor.metadata as any).category,
        } : undefined,
        localization: advisor.localization ? {
          language: (advisor.localization as any).language,
          region: (advisor.localization as any).region,
        } : undefined,
        modelHint: advisor.modelHint || undefined,
        tags: Array.isArray(advisor.tags) ? advisor.tags : [],
        createdAt: toUnixTimestamp(advisor.createdAt),
        updatedAt: toUnixTimestamp(advisor.updatedAt),
      });

      migrationState.advisorIdMap.set(advisor.id, convexAdvisorId);
      migrationState.migrated.advisors++;
      logProgress("Advisors", i + 1, advisors.length);
    } catch (error) {
      logError("Advisor", advisor.id, error);
    }
  }
}

async function migrateConversations() {
  console.log("\n💬 Migrating Conversations...");

  const conversations = await prisma.conversation.findMany();
  console.log(`Found ${conversations.length} conversations to migrate`);

  for (let i = 0; i < conversations.length; i++) {
    const conversation = conversations[i];
    if (!conversation) continue;

    try {
      const userId = migrationState.userIdMap.get(conversation.userId);
      if (!userId) {
        throw new Error(`User ${conversation.userId} not found in migration map`);
      }

      const activeAdvisorId = conversation.activeAdvisorId
        ? migrationState.advisorIdMap.get(conversation.activeAdvisorId)
        : undefined;

      const convexConversationId = await convex.mutation(api.conversations.create, {
        userId,
        title: conversation.title || undefined,
        activeAdvisorId,
        createdAt: toUnixTimestamp(conversation.createdAt),
        updatedAt: toUnixTimestamp(conversation.updatedAt),
      });

      migrationState.conversationIdMap.set(conversation.id, convexConversationId);
      migrationState.migrated.conversations++;
      logProgress("Conversations", i + 1, conversations.length);
    } catch (error) {
      logError("Conversation", conversation.id, error);
    }
  }
}

async function migrateMessages() {
  console.log("\n📝 Migrating Messages...");

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'asc' }, // Maintain chronological order
  });
  console.log(`Found ${messages.length} messages to migrate`);

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (!message) continue;

    try {
      const conversationId = migrationState.conversationIdMap.get(message.conversationId);
      if (!conversationId) {
        throw new Error(`Conversation ${message.conversationId} not found in migration map`);
      }

      const advisorId = message.advisorId
        ? migrationState.advisorIdMap.get(message.advisorId)
        : undefined;

      const convexMessageId = await convex.mutation(api.messages.create, {
        conversationId,
        sender: message.sender as "user" | "advisor" | "system",
        advisorId,
        content: message.content,
        contentJson: message.contentJson || undefined,
        mentions: Array.isArray(message.mentions) ? message.mentions : [],
        tokensUsed: message.tokensUsed || undefined,
        createdAt: toUnixTimestamp(message.createdAt),
      });

      migrationState.messageIdMap.set(message.id, convexMessageId);
      migrationState.migrated.messages++;
      logProgress("Messages", i + 1, messages.length);
    } catch (error) {
      logError("Message", message.id, error);
    }
  }
}

async function migrateAdvisorMemories() {
  console.log("\n🧠 Migrating Advisor Memories...");

  const memories = await prisma.advisorMemory.findMany();
  console.log(`Found ${memories.length} advisor memories to migrate`);

  for (let i = 0; i < memories.length; i++) {
    const memory = memories[i];
    if (!memory) continue;

    try {
      const conversationId = migrationState.conversationIdMap.get(memory.conversationId);
      const advisorId = migrationState.advisorIdMap.get(memory.advisorId);

      if (!conversationId || !advisorId) {
        throw new Error(`Missing conversation or advisor mapping for memory ${memory.id}`);
      }

      await convex.mutation(api.advisorMemories.create, {
        conversationId,
        advisorId,
        key: memory.key,
        value: memory.value,
        createdAt: toUnixTimestamp(memory.createdAt),
        updatedAt: toUnixTimestamp(memory.updatedAt),
      });

      migrationState.migrated.advisorMemories++;
      logProgress("Advisor Memories", i + 1, memories.length);
    } catch (error) {
      logError("AdvisorMemory", memory.id, error);
    }
  }
}

async function migrateThreadSummaries() {
  console.log("\n📋 Migrating Thread Summaries...");

  const summaries = await prisma.threadSummary.findMany();
  console.log(`Found ${summaries.length} thread summaries to migrate`);

  for (let i = 0; i < summaries.length; i++) {
    const summary = summaries[i];
    if (!summary) continue;

    try {
      const conversationId = migrationState.conversationIdMap.get(summary.conversationId);
      if (!conversationId) {
        throw new Error(`Conversation ${summary.conversationId} not found in migration map`);
      }

      await convex.mutation(api.threadSummaries.create, {
        conversationId,
        content: summary.content,
        startMessageId: summary.startMessageId || undefined,
        endMessageId: summary.endMessageId || undefined,
        createdAt: toUnixTimestamp(summary.createdAt),
      });

      migrationState.migrated.threadSummaries++;
      logProgress("Thread Summaries", i + 1, summaries.length);
    } catch (error) {
      logError("ThreadSummary", summary.id, error);
    }
  }
}

// Validation functions
async function validateMigration() {
  console.log("\n🔍 Validating Migration...");

  try {
    // Validate counts
    const convexUsers = await convex.query(api.users.list);
    const convexAdvisors = await convex.query(api.advisors.list);
    const convexConversations = await convex.query(api.conversations.list);
    const convexMessages = await convex.query(api.messages.list);

    console.log("📊 Migration Results:");
    console.log(`  Users: ${migrationState.migrated.users} migrated, ${convexUsers.length} in Convex`);
    console.log(`  Advisors: ${migrationState.migrated.advisors} migrated, ${convexAdvisors.length} in Convex`);
    console.log(`  Conversations: ${migrationState.migrated.conversations} migrated, ${convexConversations.length} in Convex`);
    console.log(`  Messages: ${migrationState.migrated.messages} migrated, ${convexMessages.length} in Convex`);

    // Check for data integrity
    let validationErrors = 0;

    // Validate user relationships
    for (const conversation of convexConversations) {
      const userExists = convexUsers.some((u: any) => u._id === conversation.userId);
      if (!userExists) {
        console.error(`❌ Conversation ${conversation._id} references non-existent user ${conversation.userId}`);
        validationErrors++;
      }
    }

    // Validate message relationships
    for (const message of convexMessages) {
      const conversationExists = convexConversations.some((c: any) => c._id === message.conversationId);
      if (!conversationExists) {
        console.error(`❌ Message ${message._id} references non-existent conversation ${message.conversationId}`);
        validationErrors++;
      }
    }

    if (validationErrors === 0) {
      console.log("✅ All data relationships validated successfully!");
    } else {
      console.log(`⚠️  Found ${validationErrors} validation errors`);
    }

  } catch (error) {
    console.error("❌ Validation failed:", error);
  }
}

// Main migration function
async function runMigration() {
  console.log("🚀 Starting PostgreSQL to Convex Migration");
  console.log("=" .repeat(60));

  const startTime = Date.now();

  try {
    // Run migrations in order (maintaining relationships)
    await migrateUsers();
    await migrateAdvisors();
    await migrateConversations();
    await migrateMessages();
    await migrateAdvisorMemories();
    await migrateThreadSummaries();

    // Validate the migration
    await validateMigration();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 MIGRATION COMPLETED!");
    console.log("=".repeat(60));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Successfully migrated: ${Object.values(migrationState.migrated).reduce((a, b) => a + b, 0)} records`);

    if (migrationState.errors.length > 0) {
      console.log(`❌ Errors encountered: ${migrationState.errors.length}`);
      console.log("\nError details:");
      migrationState.errors.forEach(error => {
        console.log(`  - ${error.entity} ${error.id}: ${error.error}`);
      });
    } else {
      console.log("🎯 No errors encountered!");
    }

    console.log("\n📋 Next Steps:");
    console.log("  1. Test the application with migrated data");
    console.log("  2. Verify all real-time features work correctly");
    console.log("  3. Perform end-to-end testing");
    console.log("  4. Update environment variables to use Convex exclusively");

  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runMigration().catch(console.error);
