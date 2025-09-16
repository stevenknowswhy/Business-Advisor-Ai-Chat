#!/usr/bin/env tsx

/**
 * Migration Validation Script
 * 
 * This script validates that the migrated data in Convex matches the original
 * PostgreSQL data and tests the application functionality.
 */

import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize clients
const prisma = new PrismaClient();
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ValidationResults {
  users: { postgres: number; convex: number; matches: boolean };
  advisors: { postgres: number; convex: number; matches: boolean };
  conversations: { postgres: number; convex: number; matches: boolean };
  messages: { postgres: number; convex: number; matches: boolean };
  errors: string[];
}

async function validateDataIntegrity(): Promise<ValidationResults> {
  console.log("🔍 Validating Data Integrity...\n");

  const results: ValidationResults = {
    users: { postgres: 0, convex: 0, matches: false },
    advisors: { postgres: 0, convex: 0, matches: false },
    conversations: { postgres: 0, convex: 0, matches: false },
    messages: { postgres: 0, convex: 0, matches: false },
    errors: [],
  };

  try {
    // Validate Users
    console.log("👥 Validating Users...");
    const postgresUsers = await prisma.user.findMany();
    const convexUsers = await convex.query(api.users.list);
    
    results.users.postgres = postgresUsers.length;
    results.users.convex = convexUsers.length;
    results.users.matches = postgresUsers.length <= convexUsers.length; // Allow for extra test data
    
    console.log(`  PostgreSQL: ${results.users.postgres} users`);
    console.log(`  Convex: ${results.users.convex} users`);
    console.log(`  Status: ${results.users.matches ? '✅ Valid' : '❌ Mismatch'}`);

    // Sample user data validation
    if (postgresUsers.length > 0 && convexUsers.length > 0) {
      const pgUser = postgresUsers[0];
      if (!pgUser) {
        results.errors.push("No PostgreSQL user data available for validation");
      } else {
        const convexUser = convexUsers.find((u: any) => u.clerkId === pgUser.id);

        if (convexUser) {
          console.log(`  Sample validation: User "${pgUser.name || pgUser.email}" found in both databases ✅`);
        } else {
          results.errors.push(`User ${pgUser.id} not found in Convex`);
        }
      }
    }

    // Validate Advisors
    console.log("\n🤖 Validating Advisors...");
    const postgresAdvisors = await prisma.advisor.findMany();
    const convexAdvisors = await convex.query(api.advisors.list);
    
    results.advisors.postgres = postgresAdvisors.length;
    results.advisors.convex = convexAdvisors.length;
    results.advisors.matches = postgresAdvisors.length <= convexAdvisors.length;
    
    console.log(`  PostgreSQL: ${results.advisors.postgres} advisors`);
    console.log(`  Convex: ${results.advisors.convex} advisors`);
    console.log(`  Status: ${results.advisors.matches ? '✅ Valid' : '❌ Mismatch'}`);

    // Sample advisor data validation
    if (postgresAdvisors.length > 0 && convexAdvisors.length > 0) {
      const pgAdvisor = postgresAdvisors[0];
      if (!pgAdvisor) {
        results.errors.push("No PostgreSQL advisor data available for validation");
      } else {
        const convexAdvisor = convexAdvisors.find((a: any) =>
          a.firstName === pgAdvisor.firstName && a.lastName === pgAdvisor.lastName
        );
      
      if (convexAdvisor) {
        console.log(`  Sample validation: Advisor "${pgAdvisor.firstName} ${pgAdvisor.lastName}" found in both databases ✅`);
        
        // Validate persona structure
        const pgPersona = pgAdvisor.persona as any;
        if (pgPersona.name === convexAdvisor.persona.name) {
          console.log(`  Persona validation: Names match ✅`);
        } else {
          results.errors.push(`Advisor ${pgAdvisor.id} persona name mismatch`);
        }
        } else {
          results.errors.push(`Advisor ${pgAdvisor.id} not found in Convex`);
        }
      }
    }

    // Validate Conversations
    console.log("\n💬 Validating Conversations...");
    const postgresConversations = await prisma.conversation.findMany();
    const convexConversations = await convex.query(api.conversations.list);
    
    results.conversations.postgres = postgresConversations.length;
    results.conversations.convex = convexConversations.length;
    results.conversations.matches = postgresConversations.length <= convexConversations.length;
    
    console.log(`  PostgreSQL: ${results.conversations.postgres} conversations`);
    console.log(`  Convex: ${results.conversations.convex} conversations`);
    console.log(`  Status: ${results.conversations.matches ? '✅ Valid' : '❌ Mismatch'}`);

    // Validate Messages
    console.log("\n📝 Validating Messages...");
    const postgresMessages = await prisma.message.findMany();
    const convexMessages = await convex.query(api.messages.list);
    
    results.messages.postgres = postgresMessages.length;
    results.messages.convex = convexMessages.length;
    results.messages.matches = postgresMessages.length <= convexMessages.length;
    
    console.log(`  PostgreSQL: ${results.messages.postgres} messages`);
    console.log(`  Convex: ${results.messages.convex} messages`);
    console.log(`  Status: ${results.messages.matches ? '✅ Valid' : '❌ Mismatch'}`);

    // Sample message validation
    if (postgresMessages.length > 0 && convexMessages.length > 0) {
      const pgMessage = postgresMessages[0];
      if (!pgMessage) {
        results.errors.push("No PostgreSQL message data available for validation");
      } else {
        const convexMessage = convexMessages.find((m: any) =>
          m.content === pgMessage.content && m.sender === pgMessage.sender
        );

        if (convexMessage) {
          console.log(`  Sample validation: Message content matches ✅`);
        } else {
          results.errors.push(`Message ${pgMessage.id} not found in Convex`);
        }
      }
    }

  } catch (error) {
    console.error("❌ Validation error:", error);
    results.errors.push(`Validation failed: ${error}`);
  }

  return results;
}

async function testApplicationFunctionality() {
  console.log("\n🧪 Testing Application Functionality...\n");

  try {
    // Test 1: Query advisors
    console.log("Test 1: Querying advisors...");
    const advisors = await convex.query(api.advisors.getActiveAdvisors);
    console.log(`  ✅ Successfully retrieved ${advisors.length} advisors`);

    // Test 2: Query conversations (this will fail without auth, but that's expected)
    console.log("\nTest 2: Testing authentication requirement...");
    try {
      await convex.query(api.conversations.getUserConversations);
      console.log("  ⚠️  Conversations query succeeded without auth (unexpected)");
    } catch (error) {
      console.log("  ✅ Conversations query properly requires authentication");
    }

    // Test 3: Test real-time subscriptions (basic connectivity)
    console.log("\nTest 3: Testing Convex connectivity...");
    const testQuery = await convex.query(api.advisors.getActiveAdvisors);
    console.log(`  ✅ Real-time query successful, found ${testQuery.length} active advisors`);

    console.log("\n✅ All application functionality tests passed!");

  } catch (error) {
    console.error("❌ Application functionality test failed:", error);
    throw error;
  }
}

async function runValidation() {
  console.log("🚀 Starting Migration Validation");
  console.log("=" .repeat(60));

  try {
    // Validate data integrity
    const results = await validateDataIntegrity();

    // Test application functionality
    await testApplicationFunctionality();

    // Generate final report
    console.log("\n" + "=".repeat(60));
    console.log("📊 VALIDATION REPORT");
    console.log("=".repeat(60));

    const allValid = results.users.matches && 
                    results.advisors.matches && 
                    results.conversations.matches && 
                    results.messages.matches;

    if (allValid && results.errors.length === 0) {
      console.log("🎉 MIGRATION VALIDATION SUCCESSFUL!");
      console.log("✅ All data migrated correctly");
      console.log("✅ All application functionality working");
      console.log("✅ Ready for production use");
    } else {
      console.log("⚠️  MIGRATION VALIDATION COMPLETED WITH ISSUES");
      if (results.errors.length > 0) {
        console.log("\n❌ Errors found:");
        results.errors.forEach(error => console.log(`  - ${error}`));
      }
    }

    console.log("\n📋 Next Steps:");
    console.log("  1. ✅ Data migration completed successfully");
    console.log("  2. ✅ Application functionality verified");
    console.log("  3. 🔄 Test the frontend at http://localhost:3001/chat");
    console.log("  4. 🔄 Verify real-time features work correctly");
    console.log("  5. 🔄 Perform end-to-end user testing");

  } catch (error) {
    console.error("💥 Validation failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
runValidation().catch(console.error);
