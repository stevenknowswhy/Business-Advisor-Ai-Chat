#!/usr/bin/env tsx

/**
 * Blank Screen Diagnosis Script
 * 
 * This script tests various aspects of the application to identify
 * why the chat interface is showing a blank screen.
 */

import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment variables from .env.local
config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function diagnoseBlankScreen() {
  console.log('🔍 Diagnosing Blank Screen Issue');
  console.log('=' .repeat(50));
  
  // 1. Check environment variables
  console.log('\n1. 🔧 Environment Variables Check:');
  console.log(`   CONVEX_URL: ${CONVEX_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   CLERK_KEY: ${CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (!CONVEX_URL) {
    console.log('   ❌ CRITICAL: NEXT_PUBLIC_CONVEX_URL is missing!');
    return;
  }
  
  // 2. Test Convex connectivity
  console.log('\n2. 🌐 Convex Connectivity Test:');
  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    console.log('   ✅ Convex client created successfully');
    
    // Test public advisor query
    try {
      const advisors = await client.query(api.advisors.getAllAdvisors, {});
      console.log(`   ✅ Advisors query successful: ${advisors.length} advisors found`);
      
      if (advisors.length > 0) {
        console.log(`   📋 Sample advisor: ${advisors[0]?.persona?.name ?? 'n/a'}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.toString() : String(error);
      console.log(`   ❌ Advisors query failed: ${msg}`);
    }
    
    // Test if the functions the frontend is calling exist
    const functionsToTest = [
      "advisors:getAdvisors",
      "conversations:getConversations"
    ];
    
    for (const func of functionsToTest) {
      try {
        await client.query(func as any);
        console.log(`   ✅ Function ${func} exists and callable`);
      } catch (error) {
        const msg = error instanceof Error ? error.toString() : String(error);
        if (msg.includes("Could not find public function")) {
          console.log(`   ❌ Function ${func} NOT FOUND - this could cause blank screen!`);
        } else if (msg.includes("User not authenticated")) {
          console.log(`   ⚠️  Function ${func} exists but requires auth`);
        } else {
          console.log(`   ❌ Function ${func} error: ${msg}`);
        }
      }
    }
    
  } catch (error) {
    const msg = error instanceof Error ? error.toString() : String(error);
    console.log(`   ❌ Convex connection failed: ${msg}`);
  }
  
  // 3. Check Next.js server
  console.log('\n3. 🖥️  Next.js Server Test:');
  try {
    const response = await fetch('http://localhost:3001/api/health').catch(() => null);
    if (response) {
      console.log(`   ✅ Next.js server responding: ${response.status}`);
    } else {
      console.log('   ⚠️  Health endpoint not available (this is normal)');
    }
    
    // Test if the chat page loads
    const chatResponse = await fetch('http://localhost:3001/chat').catch(() => null);
    if (chatResponse) {
      console.log(`   ✅ Chat page responding: ${chatResponse.status}`);
      const html = await chatResponse.text();
      
      // Check for common issues in the HTML
      if (html.includes('Error')) {
        console.log('   ⚠️  HTML contains error text');
      }
      if (html.includes('Loading')) {
        console.log('   ⚠️  HTML shows loading state');
      }
      if (html.length < 1000) {
        console.log(`   ⚠️  HTML is very short (${html.length} chars) - might be blank`);
      } else {
        console.log(`   ✅ HTML looks normal (${html.length} chars)`);
      }
    } else {
      console.log('   ❌ Chat page not responding');
    }
    
  } catch (error) {
    const msg = error instanceof Error ? error.toString() : String(error);
    console.log(`   ❌ Next.js server test failed: ${msg}`);
  }
  
  // 4. Summary and recommendations
  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSIS SUMMARY');
  console.log('='.repeat(50));
  
  console.log('\n🔧 Potential Causes of Blank Screen:');
  console.log('1. Missing Convex function exports (getAdvisors, getConversations)');
  console.log('2. Authentication blocking component rendering');
  console.log('3. JavaScript errors in React components');
  console.log('4. Convex connection failures');
  console.log('5. Missing environment variables');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Verify Convex functions are properly exported');
  console.log('3. Test with authentication disabled temporarily');
  console.log('4. Add debug logging to React components');
  console.log('5. Check if ConvexProvider is properly configured');
  
  console.log('\n' + '='.repeat(50));
}

// Run the diagnosis
diagnoseBlankScreen().catch(error => {
  console.error('💥 Diagnosis failed:', error);
  process.exit(1);
});
