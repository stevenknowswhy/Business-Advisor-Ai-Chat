#!/usr/bin/env tsx

/**
 * Authentication State Debug Script
 * 
 * This script helps debug why authenticated Convex queries are still being called
 * when the user is not authenticated.
 */

import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment variables from .env.local
config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

async function debugAuthenticationState() {
  console.log('🔍 Debugging Authentication State Issues');
  console.log('=' .repeat(60));
  
  if (!CONVEX_URL) {
    console.log('❌ CONVEX_URL is missing');
    return;
  }
  
  const client = new ConvexHttpClient(CONVEX_URL);
  
  console.log('\n1. 📋 Testing Public Queries (should work):');
  try {
    const advisors = await client.query(api.advisors.getAllAdvisors, {});
    console.log(`   ✅ advisors:getAllAdvisors: ${advisors.length} advisors`);
  } catch (error) {
    console.log(`   ❌ advisors:getAllAdvisors failed: ${error}`);
  }
  
  console.log('\n2. 🔒 Testing Protected Queries (should fail without auth):');
  
  const protectedQueries = [
    "conversations:getUserConversations",
    "conversations:getConversations", // alias
    "realtime:getTypingUsers",
    "messages:getConversationMessages"
  ];
  
  for (const queryName of protectedQueries) {
    try {
      const result = await client.query(queryName as any, {});
      console.log(`   ⚠️  ${queryName}: UNEXPECTED SUCCESS - ${JSON.stringify(result).substring(0, 100)}...`);
    } catch (error) {
      const msg = error instanceof Error ? error.toString() : String(error);
      if (msg.includes("User not authenticated")) {
        console.log(`   ✅ ${queryName}: Correctly requires authentication`);
      } else if (msg.includes("Could not find public function")) {
        console.log(`   ⚠️  ${queryName}: Function not found (might be expected)`);
      } else if (msg.includes("ArgumentValidationError")) {
        console.log(`   ⚠️  ${queryName}: Validation error (might need proper args)`);
      } else {
        console.log(`   ❌ ${queryName}: Unexpected error - ${msg}`);
      }
    }
  }
  
  console.log('\n3. 🔒 Testing Protected Mutations (should fail without auth):');
  
  const protectedMutations = [
    "realtime:updateUserPresence",
    "realtime:setTypingStatus",
    "conversations:createConversation",
    "messages:sendMessage"
  ];
  
  for (const mutationName of protectedMutations) {
    try {
      const result = await client.mutation(mutationName as any, {});
      console.log(`   ⚠️  ${mutationName}: UNEXPECTED SUCCESS - ${JSON.stringify(result).substring(0, 100)}...`);
    } catch (error) {
      const msg = error instanceof Error ? error.toString() : String(error);
      if (msg.includes("User not authenticated")) {
        console.log(`   ✅ ${mutationName}: Correctly requires authentication`);
      } else if (msg.includes("Could not find public function")) {
        console.log(`   ⚠️  ${mutationName}: Function not found (might be expected)`);
      } else if (msg.includes("ArgumentValidationError")) {
        console.log(`   ⚠️  ${mutationName}: Validation error (might need proper args)`);
      } else {
        console.log(`   ❌ ${mutationName}: Unexpected error - ${msg}`);
      }
    }
  }
  
  console.log('\n4. 🧪 Testing Specific Problematic Calls:');
  
  // Test the exact calls that are failing in the logs
  try {
    await client.query(api.conversations.getUserConversations, {});
    console.log('   ⚠️  getUserConversations: UNEXPECTED SUCCESS');
  } catch (error) {
    const msg = error instanceof Error ? error.toString() : String(error);
    console.log(`   ✅ getUserConversations: ${msg.substring(0, 100)}...`);
  }
  
  try {
    await client.mutation(api.realtime.updateUserPresence, { isOnline: true });
    console.log('   ⚠️  updateUserPresence: UNEXPECTED SUCCESS');
  } catch (error) {
    const msg = error instanceof Error ? error.toString() : String(error);
    console.log(`   ✅ updateUserPresence: ${msg.substring(0, 100)}...`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUTHENTICATION DEBUG SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n🔍 Key Findings:');
  console.log('1. If protected queries/mutations show "UNEXPECTED SUCCESS", there\'s a security issue');
  console.log('2. If they show "User not authenticated", the backend is working correctly');
  console.log('3. The issue is likely in the frontend conditional logic');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Check that isAuthenticated = isLoaded && isSignedIn === true');
  console.log('2. Add console.log to ConvexChatInterface to debug auth state');
  console.log('3. Verify that conditional queries use "skip" when not authenticated');
  console.log('4. Check for race conditions in useEffect hooks');
  
  console.log('\n' + '='.repeat(60));
}

// Run the debug
debugAuthenticationState().catch(error => {
  console.error('💥 Authentication debug failed:', error);
  process.exit(1);
});
