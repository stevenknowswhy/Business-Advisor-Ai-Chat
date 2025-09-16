#!/usr/bin/env tsx

/**
 * Authentication Integration Test Script
 *
 * This script tests the Clerk-Convex authentication integration
 * and provides diagnostic information for troubleshooting.
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

async function testAuthIntegration() {
  console.log('🔐 Testing Clerk-Convex Authentication Integration');
  console.log('=' .repeat(60));
  
  const client = new ConvexHttpClient(CONVEX_URL as string);
  
  console.log('\n1. 🌐 Testing Convex Connection...');
  try {
    // Test basic connection to Convex
    console.log(`   Convex URL: ${CONVEX_URL}`);
    console.log('   ✅ Convex client created successfully');
  } catch (error) {
    console.log(`   ❌ Failed to create Convex client: ${error}`);
    return;
  }
  
  console.log('\n2. 📋 Testing Public Functions...');
  try {
    // Test calling a public function (should work without auth)
    const advisors = await client.query(api.advisors.list, {});
    console.log(`   ✅ Public advisors query successful: ${advisors.length} advisors found`);
  } catch (error) {
    console.log(`   ❌ Public advisors query failed: ${error}`);
  }
  
  console.log('\n3. 🔒 Testing Protected Functions...');
  try {
    // Test calling a protected function (should fail without auth)
    const conversations = await client.query(api.conversations.getUserConversations, {});
    console.log(`   ⚠️  Protected query succeeded without auth (unexpected): ${conversations.length} conversations`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("User not authenticated")) {
      console.log('   ✅ Protected query properly requires authentication');
    } else {
      console.log(`   ❌ Protected query failed with unexpected error: ${errorMessage}`);
    }
  }
  
  console.log('\n4. 🔧 Environment Configuration Check...');
  const requiredEnvVars = [
    'NEXT_PUBLIC_CONVEX_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  let envIssues = 0;
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`   ✅ ${envVar}: ${envVar.includes('SECRET') ? '[HIDDEN]' : value}`);
    } else {
      console.log(`   ❌ ${envVar}: Not set`);
      envIssues++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUTHENTICATION INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));
  
  if (envIssues === 0) {
    console.log('🎉 Environment Configuration: All required variables present');
  } else {
    console.log(`⚠️  Environment Configuration: ${envIssues} missing variables`);
  }
  
  console.log('\n🔧 Next Steps for Authentication Setup:');
  console.log('');
  console.log('1. **Set up Clerk JWT Template**:');
  console.log('   - Go to https://dashboard.clerk.com/');
  console.log('   - Navigate to your application');
  console.log('   - Go to "JWT Templates" in the sidebar');
  console.log('   - Click "New template"');
  console.log('   - Name: "convex"');
  console.log('   - Add these claims:');
  console.log('     ```json');
  console.log('     {');
  console.log('       "iss": "https://above-ferret-50.clerk.accounts.dev",');
  console.log('       "sub": "{{user.id}}",');
  console.log('       "aud": "convex",');
  console.log('       "name": "{{user.first_name}} {{user.last_name}}",');
  console.log('       "email": "{{user.primary_email_address}}",');
  console.log('       "picture": "{{user.profile_image_url}}"');
  console.log('     }');
  console.log('     ```');
  console.log('');
  console.log('2. **Configure Convex Authentication**:');
  console.log('   - The JWT template name must be "convex"');
  console.log('   - The issuer must match your Clerk domain');
  console.log('   - The audience should be "convex"');
  console.log('');
  console.log('3. **Test Authentication Flow**:');
  console.log('   - Sign in to the application at http://localhost:3001/chat');
  console.log('   - Check browser console for authentication errors');
  console.log('   - Verify that advisors and conversations load correctly');
  console.log('');
  console.log('4. **Sync User Data**:');
  console.log('   - After signing in, the app should automatically sync user data');
  console.log('   - Check Convex dashboard for user records');
  console.log('   - Verify that conversations and messages are accessible');
  
  console.log('\n🚨 Common Issues:');
  console.log('');
  console.log('- **"No JWT template exists with name: convex"**');
  console.log('  → Create the JWT template in Clerk dashboard');
  console.log('');
  console.log('- **"User not authenticated"**');
  console.log('  → Ensure JWT template is properly configured');
  console.log('  → Check that user is signed in to Clerk');
  console.log('');
  console.log('- **"User not found. Please sync your account first."**');
  console.log('  → Call the syncUserFromClerk mutation after sign-in');
  console.log('  → Check that user data is being created in Convex');
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testAuthIntegration().catch(error => {
  console.error('💥 Authentication integration test failed:', error);
  process.exit(1);
});
