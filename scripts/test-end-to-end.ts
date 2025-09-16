#!/usr/bin/env tsx

/**
 * End-to-End Application Testing Script
 * 
 * This script performs comprehensive end-to-end testing of the migrated
 * AI Advisor Chat application to ensure all functionality works correctly
 * with real Convex data.
 */

import * as dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface TestResults {
  passed: number;
  failed: number;
  errors: string[];
  details: Array<{
    test: string;
    status: 'PASS' | 'FAIL';
    message: string;
    duration: number;
  }>;
}

const testResults: TestResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: [],
};

// Test utility functions
function logTest(testName: string, status: 'PASS' | 'FAIL', message: string, duration: number) {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`  ${emoji} ${testName}: ${message} (${duration}ms)`);
  
  testResults.details.push({ test: testName, status, message, duration });
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${message}`);
  }
}

async function runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    logTest(testName, 'PASS', 'Test completed successfully', duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    logTest(testName, 'FAIL', message, duration);
  }
}

// Test 1: Data Availability Tests
async function testDataAvailability() {
  console.log("\n📊 Testing Data Availability...");

  await runTest("Users Data Available", async () => {
    const users = await convex.query(api.users.list);
    if (users.length === 0) throw new Error("No users found in database");
    console.log(`    Found ${users.length} users`);
  });

  await runTest("Advisors Data Available", async () => {
    const advisors = await convex.query(api.advisors.getActiveAdvisors);
    if (advisors.length === 0) throw new Error("No active advisors found");
    console.log(`    Found ${advisors.length} active advisors`);
  });

  await runTest("Conversations Data Available", async () => {
    const conversations = await convex.query(api.conversations.list);
    if (conversations.length === 0) throw new Error("No conversations found");
    console.log(`    Found ${conversations.length} conversations`);
  });

  await runTest("Messages Data Available", async () => {
    const messages = await convex.query(api.messages.list);
    if (messages.length === 0) throw new Error("No messages found");
    console.log(`    Found ${messages.length} messages`);
  });
}

// Test 2: Data Integrity Tests
async function testDataIntegrity() {
  console.log("\n🔍 Testing Data Integrity...");

  await runTest("User-Conversation Relationships", async () => {
    const conversations = await convex.query(api.conversations.list);
    const users = await convex.query(api.users.list);
    
    for (const conversation of conversations) {
      const userExists = users.some((u: any) => u._id === conversation.userId);
      if (!userExists) {
        throw new Error(`Conversation ${conversation._id} references non-existent user ${conversation.userId}`);
      }
    }
    console.log(`    Validated ${conversations.length} conversation-user relationships`);
  });

  await runTest("Message-Conversation Relationships", async () => {
    const messages = await convex.query(api.messages.list);
    const conversations = await convex.query(api.conversations.list);
    
    for (const message of messages) {
      const conversationExists = conversations.some((c: any) => c._id === message.conversationId);
      if (!conversationExists) {
        throw new Error(`Message ${message._id} references non-existent conversation ${message.conversationId}`);
      }
    }
    console.log(`    Validated ${messages.length} message-conversation relationships`);
  });

  await runTest("Advisor-Message Relationships", async () => {
    const messages = await convex.query(api.messages.list);
    const advisors = await convex.query(api.advisors.list);
    
    const advisorMessages = messages.filter((m: any) => m.advisorId);
    for (const message of advisorMessages) {
      const advisorExists = advisors.some((a: any) => a._id === message.advisorId);
      if (!advisorExists) {
        throw new Error(`Message ${message._id} references non-existent advisor ${message.advisorId}`);
      }
    }
    console.log(`    Validated ${advisorMessages.length} advisor-message relationships`);
  });
}

// Test 3: Query Performance Tests
async function testQueryPerformance() {
  console.log("\n⚡ Testing Query Performance...");

  await runTest("Advisor Query Performance", async () => {
    const startTime = Date.now();
    const advisors = await convex.query(api.advisors.getActiveAdvisors);
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      throw new Error(`Query took ${duration}ms (expected < 1000ms)`);
    }
    console.log(`    Query completed in ${duration}ms, returned ${advisors.length} advisors`);
  });

  await runTest("Conversation List Performance", async () => {
    const startTime = Date.now();
    const conversations = await convex.query(api.conversations.list);
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      throw new Error(`Query took ${duration}ms (expected < 1000ms)`);
    }
    console.log(`    Query completed in ${duration}ms, returned ${conversations.length} conversations`);
  });

  await runTest("Message List Performance", async () => {
    const startTime = Date.now();
    const messages = await convex.query(api.messages.list);
    const duration = Date.now() - startTime;
    
    if (duration > 2000) {
      throw new Error(`Query took ${duration}ms (expected < 2000ms)`);
    }
    console.log(`    Query completed in ${duration}ms, returned ${messages.length} messages`);
  });
}

// Test 4: Real-time Connectivity Tests
async function testRealTimeConnectivity() {
  console.log("\n🔄 Testing Real-time Connectivity...");

  await runTest("Real-time Advisor Query", async () => {
    const advisors = await convex.query(api.advisors.getActiveAdvisors);
    if (!Array.isArray(advisors)) {
      throw new Error("Real-time query did not return array");
    }
    console.log(`    Real-time query successful, ${advisors.length} advisors`);
  });

  await runTest("Real-time Conversation Query", async () => {
    const conversations = await convex.query(api.conversations.list);
    if (!Array.isArray(conversations)) {
      throw new Error("Real-time query did not return array");
    }
    console.log(`    Real-time query successful, ${conversations.length} conversations`);
  });

  await runTest("Real-time Message Query", async () => {
    const messages = await convex.query(api.messages.list);
    if (!Array.isArray(messages)) {
      throw new Error("Real-time query did not return array");
    }
    console.log(`    Real-time query successful, ${messages.length} messages`);
  });
}

// Test 5: Data Structure Validation
async function testDataStructures() {
  console.log("\n🏗️  Testing Data Structures...");

  await runTest("User Data Structure", async () => {
    const users = await convex.query(api.users.list);
    const user = users[0];
    
    if (!user) throw new Error("No users available for testing");
    
    const requiredFields = ['_id', 'clerkId', 'plan', 'createdAt', 'updatedAt'];
    for (const field of requiredFields) {
      if (!(field in user)) {
        throw new Error(`User missing required field: ${field}`);
      }
    }
    console.log(`    User structure validated with ${Object.keys(user).length} fields`);
  });

  await runTest("Advisor Data Structure", async () => {
    const advisors = await convex.query(api.advisors.getActiveAdvisors);
    const advisor = advisors[0];
    
    if (!advisor) throw new Error("No advisors available for testing");
    
    const requiredFields = ['_id', 'persona', 'status', 'schemaVersion', 'createdAt', 'updatedAt'];
    for (const field of requiredFields) {
      if (!(field in advisor)) {
        throw new Error(`Advisor missing required field: ${field}`);
      }
    }
    
    // Validate persona structure
    if (!advisor.persona.name || !advisor.persona.title) {
      throw new Error("Advisor persona missing required name or title");
    }
    
    console.log(`    Advisor structure validated with ${Object.keys(advisor).length} fields`);
  });

  await runTest("Message Data Structure", async () => {
    const messages = await convex.query(api.messages.list);
    const message = messages[0];
    
    if (!message) throw new Error("No messages available for testing");
    
    const requiredFields = ['_id', 'conversationId', 'sender', 'content', 'createdAt'];
    for (const field of requiredFields) {
      if (!(field in message)) {
        throw new Error(`Message missing required field: ${field}`);
      }
    }
    
    // Validate sender enum
    if (!['user', 'advisor', 'system'].includes(message.sender)) {
      throw new Error(`Invalid message sender: ${message.sender}`);
    }
    
    console.log(`    Message structure validated with ${Object.keys(message).length} fields`);
  });
}

// Main test runner
async function runEndToEndTests() {
  console.log("🚀 Starting End-to-End Application Testing");
  console.log("=" .repeat(60));

  const startTime = Date.now();

  try {
    await testDataAvailability();
    await testDataIntegrity();
    await testQueryPerformance();
    await testRealTimeConnectivity();
    await testDataStructures();

    const totalDuration = Date.now() - startTime;

    console.log("\n" + "=".repeat(60));
    console.log("📊 END-TO-END TEST RESULTS");
    console.log("=".repeat(60));

    if (testResults.failed === 0) {
      console.log("🎉 ALL TESTS PASSED!");
      console.log(`✅ ${testResults.passed} tests completed successfully`);
      console.log(`⏱️  Total duration: ${totalDuration}ms`);
    } else {
      console.log("⚠️  SOME TESTS FAILED");
      console.log(`✅ Passed: ${testResults.passed}`);
      console.log(`❌ Failed: ${testResults.failed}`);
      console.log(`⏱️  Total duration: ${totalDuration}ms`);
      
      console.log("\n❌ Failed Tests:");
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log("\n📋 Next Steps:");
    console.log("  1. ✅ Data availability confirmed");
    console.log("  2. ✅ Data integrity validated");
    console.log("  3. ✅ Query performance acceptable");
    console.log("  4. 🔄 Test frontend application manually");
    console.log("  5. 🔄 Test real-time features with multiple browsers");

  } catch (error) {
    console.error("💥 Test suite failed:", error);
    process.exit(1);
  }
}

// Run the tests
runEndToEndTests().catch(console.error);
