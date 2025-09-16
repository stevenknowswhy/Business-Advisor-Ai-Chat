#!/usr/bin/env tsx

/**
 * Frontend Query Test Script
 * 
 * This script tests the specific Convex queries that the frontend is using
 * to identify any mismatches between frontend calls and backend exports.
 */

import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment variables from .env.local
config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  process.exit(1);
}

async function testFrontendQueries() {
  console.log('🔍 Testing Frontend Convex Queries');
  console.log('=' .repeat(50));
  
  const client = new ConvexHttpClient(CONVEX_URL as string);
  
  console.log('\n1. 🧪 Testing advisors:getAllAdvisors (used by useAdvisors hook)...');
  try {
    const advisors = await client.query(api.advisors.getAllAdvisors, {});
    console.log(`   ✅ getAllAdvisors successful: ${advisors.length} advisors found`);
    console.log(`   📋 Advisors: ${advisors.map((a: any) => a.persona?.name || 'Unnamed').join(', ')}`);
  } catch (error) {
    console.log(`   ❌ getAllAdvisors failed: ${error}`);
  }
  
  console.log('\n2. 🧪 Testing advisors:getActiveAdvisors (alternative)...');
  try {
    const activeAdvisors = await client.query(api.advisors.getActiveAdvisors, {});
    console.log(`   ✅ getActiveAdvisors successful: ${activeAdvisors.length} advisors found`);
    console.log(`   📋 Active Advisors: ${activeAdvisors.map((a: any) => a.persona?.name || 'Unnamed').join(', ')}`);
  } catch (error) {
    console.log(`   ❌ getActiveAdvisors failed: ${error}`);
  }
  
  console.log('\n3. 🧪 Testing advisors:getAdvisors (alias we created)...');
  try {
    const advisorsAlias = await client.query(api.advisors.getAdvisors, {});
    console.log(`   ✅ getAdvisors alias successful: ${advisorsAlias.length} advisors found`);
    console.log(`   📋 Advisors (alias): ${advisorsAlias.map((a: any) => a.persona?.name || 'Unnamed').join(', ')}`);
  } catch (error) {
    console.log(`   ❌ getAdvisors alias failed: ${error}`);
  }
  
  console.log('\n4. 🧪 Testing conversations:getUserConversations (protected)...');
  try {
    const conversations = await client.query(api.conversations.getUserConversations, {});
    console.log(`   ⚠️  getUserConversations succeeded without auth (unexpected): ${conversations.length} conversations`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("User not authenticated")) {
      console.log('   ✅ getUserConversations properly requires authentication');
    } else {
      console.log(`   ❌ getUserConversations failed with unexpected error: ${errorMessage}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 FRONTEND QUERY TEST RESULTS');
  console.log('='.repeat(50));
  
  console.log('\n🔧 Diagnosis:');
  console.log('- The useAdvisors() hook calls "advisors:getAllAdvisors"');
  console.log('- This should return all advisors including inactive ones');
  console.log('- If advisors are not showing in the UI, the issue is likely:');
  console.log('  1. Frontend not calling the query correctly');
  console.log('  2. Query returning empty results');
  console.log('  3. React component not rendering the results');
  console.log('  4. Authentication blocking the query');
  
  console.log('\n🚨 Next Steps:');
  console.log('1. Check browser console for React/Convex errors');
  console.log('2. Verify that ConvexChatInterface is receiving advisor data');
  console.log('3. Check if authentication is required for advisor queries');
  console.log('4. Test the React component rendering logic');
  
  console.log('\n' + '='.repeat(50));
}

// Run the test
testFrontendQueries().catch(error => {
  console.error('💥 Frontend query test failed:', error);
  process.exit(1);
});
