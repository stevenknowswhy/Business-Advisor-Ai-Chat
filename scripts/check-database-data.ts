#!/usr/bin/env tsx

/**
 * Database Data Assessment Script
 * 
 * This script checks the current PostgreSQL database to assess what data exists
 * and needs to be migrated to Convex.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assessDatabaseData() {
  console.log("🔍 Assessing PostgreSQL Database Data...\n");

  try {
    // Check Users
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    console.log(`👥 Users: ${userCount} total`);
    if (users.length > 0) {
      console.log("Sample users:");
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.name || user.email || user.id} (${user.plan}) - ${user._count.conversations} conversations`);
      });
    }
    console.log();

    // Check Advisors
    const advisorCount = await prisma.advisor.count();
    const advisors = await prisma.advisor.findMany({
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        schemaVersion: true,
        createdAt: true,
        _count: {
          select: {
            conversations: true,
            messages: true,
          },
        },
      },
    });

    console.log(`🤖 Advisors: ${advisorCount} total`);
    if (advisors.length > 0) {
      console.log("Sample advisors:");
      advisors.forEach((advisor, i) => {
        const name = `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim() || advisor.id;
        console.log(`  ${i + 1}. ${name} (${advisor.status}) - ${advisor._count.conversations} conversations, ${advisor._count.messages} messages`);
      });
    }
    console.log();

    // Check Conversations
    const conversationCount = await prisma.conversation.count();
    const conversations = await prisma.conversation.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        userId: true,
        activeAdvisorId: true,
        createdAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    console.log(`💬 Conversations: ${conversationCount} total`);
    if (conversations.length > 0) {
      console.log("Sample conversations:");
      conversations.forEach((conv, i) => {
        console.log(`  ${i + 1}. "${conv.title || 'Untitled'}" - ${conv._count.messages} messages`);
      });
    }
    console.log();

    // Check Messages
    const messageCount = await prisma.message.count();
    const messages = await prisma.message.findMany({
      take: 5,
      select: {
        id: true,
        sender: true,
        content: true,
        conversationId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📝 Messages: ${messageCount} total`);
    if (messages.length > 0) {
      console.log("Recent messages:");
      messages.forEach((msg, i) => {
        const preview = msg.content.length > 50 ? msg.content.substring(0, 50) + "..." : msg.content;
        console.log(`  ${i + 1}. [${msg.sender}] "${preview}"`);
      });
    }
    console.log();

    // Check AdvisorMemories
    const memoryCount = await prisma.advisorMemory.count();
    console.log(`🧠 Advisor Memories: ${memoryCount} total`);

    // Check ThreadSummaries
    const summaryCount = await prisma.threadSummary.count();
    console.log(`📋 Thread Summaries: ${summaryCount} total`);

    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION ASSESSMENT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total records to migrate: ${userCount + advisorCount + conversationCount + messageCount + memoryCount + summaryCount}`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Advisors: ${advisorCount}`);
    console.log(`- Conversations: ${conversationCount}`);
    console.log(`- Messages: ${messageCount}`);
    console.log(`- Advisor Memories: ${memoryCount}`);
    console.log(`- Thread Summaries: ${summaryCount}`);

    if (userCount + advisorCount + conversationCount + messageCount + memoryCount + summaryCount === 0) {
      console.log("\n✅ Database is empty - no data migration needed!");
      console.log("The application can proceed with Convex as the primary database.");
    } else {
      console.log("\n⚠️  Data migration required!");
      console.log("Proceeding with migration script development...");
    }

  } catch (error) {
    console.error("❌ Error assessing database:", error);
    
    if (error instanceof Error && error.message.includes("connect")) {
      console.log("\n💡 Database connection failed. This might mean:");
      console.log("  1. The Neon database is unreachable (as mentioned)");
      console.log("  2. No data migration is needed");
      console.log("  3. The application can proceed with Convex exclusively");
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the assessment
assessDatabaseData().catch(console.error);
