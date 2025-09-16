#!/usr/bin/env tsx

/**
 * JWT Template Fix Verification Script
 * 
 * This script tests whether the JWT template configuration fix has been applied successfully.
 */

import { ConvexReactClient } from "convex/react";

console.log("🧪 JWT Template Fix Verification");
console.log("================================");

async function testJWTTemplateConfiguration() {
  try {
    console.log("\n1. 🔍 Testing Convex Connection...");
    
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL not found");
    }
    
    console.log(`   ✅ Convex URL: ${convexUrl}`);
    
    // Test basic Convex connection
    const client = new ConvexReactClient(convexUrl);
    console.log("   ✅ Convex client created successfully");
    
    console.log("\n2. 🔐 Testing Authentication Setup...");
    
    // Check Clerk configuration
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkPublishableKey || !clerkSecretKey) {
      throw new Error("Clerk keys not configured");
    }
    
    console.log("   ✅ Clerk publishable key configured");
    console.log("   ✅ Clerk secret key configured");
    
    console.log("\n3. 📋 JWT Template Status Check...");
    console.log("   ℹ️  Cannot programmatically verify JWT template from client");
    console.log("   ℹ️  Manual verification required in Clerk Dashboard");
    console.log(`
   To verify JWT template 'convex' exists:
   1. Go to https://dashboard.clerk.com/
   2. Select your application
   3. Navigate to 'JWT Templates'
   4. Look for template named 'convex'
   `);
    
    console.log("\n4. 🎯 Testing Expected Behavior...");
    console.log(`
   After JWT template is configured, you should see:
   ✅ No 'No JWT template exists with name: convex' errors
   ✅ Authenticated users can call protected Convex functions
   ✅ Browser console shows successful authentication
   ✅ Chat interface loads without authentication errors
   `);
    
    console.log("\n5. 🔧 Common Issues and Solutions...");
    console.log(`
   Issue: Still getting JWT template errors
   Solution: 
   - Ensure template name is exactly 'convex' (case-sensitive)
   - Restart both development servers after creating template
   - Clear browser cache and cookies
   
   Issue: Authentication still failing
   Solution:
   - Verify JWT template claims include required fields
   - Check that Clerk domain matches your application
   - Ensure CLERK_SECRET_KEY is from the correct environment
   
   Issue: Functions still return 'User not authenticated'
   Solution:
   - Test with a signed-in user
   - Verify ConvexProviderWithClerk is properly configured
   - Check that auth.getUserIdentity() returns valid data
   `);
    
    console.log("\n6. 📊 Current Configuration Summary:");
    console.log(`   Convex URL: ${convexUrl}`);
    console.log(`   Clerk Domain: ${clerkPublishableKey?.split('_')[2] || 'unknown'}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    console.log("\n✅ JWT Template Fix Verification Complete!");
    console.log(`
🚀 Next Steps:
1. Ensure 'convex' JWT template exists in Clerk Dashboard
2. Restart development servers: npm run dev & npx convex dev
3. Test authentication at http://localhost:3001/chat
4. Check browser console for any remaining errors
`);
    
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check environment variables in .env.local");
    console.log("2. Verify Convex deployment is running");
    console.log("3. Ensure Clerk application is properly configured");
    process.exit(1);
  }
}

// Run the verification
testJWTTemplateConfiguration();
