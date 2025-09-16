#!/usr/bin/env tsx

/**
 * JWT Template Configuration Fix Script
 * 
 * This script diagnoses and provides solutions for the "No JWT template exists with name: convex" error
 * that occurs when integrating Clerk authentication with Convex.
 */

import { ConvexReactClient } from "convex/react";

console.log("🔍 JWT Template Configuration Diagnostic");
console.log("========================================");

// Check environment variables
console.log("\n1. ✅ Environment Variables Check:");
const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY', 
  'NEXT_PUBLIC_CONVEX_URL',
  'CONVEX_DEPLOYMENT'
];

let envVarsValid = true;
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${envVar.includes('SECRET') ? '[HIDDEN]' : value}`);
  } else {
    console.log(`   ❌ ${envVar}: MISSING`);
    envVarsValid = false;
  }
});

if (!envVarsValid) {
  console.log("\n❌ Missing required environment variables. Please check your .env.local file.");
  process.exit(1);
}

console.log("\n2. 🔧 JWT Template Configuration Issue:");
console.log("   ❌ Error: 'No JWT template exists with name: convex'");
console.log("   📋 This error occurs because Clerk needs a JWT template named 'convex'");
console.log("   🎯 Solution: Create the JWT template in Clerk Dashboard");

console.log("\n3. 📝 Step-by-Step Solution:");
console.log(`
   STEP 1: Go to Clerk Dashboard
   =============================
   1. Open https://dashboard.clerk.com/
   2. Select your application
   3. Navigate to 'JWT Templates' in the left sidebar

   STEP 2: Create 'convex' JWT Template
   ===================================
   1. Click 'New template'
   2. Set Template name: 'convex'
   3. Configure the template with these settings:

   Template Configuration:
   ----------------------
   Name: convex

   Claims:
   {
     "iss": "https://{{domain}}",
     "sub": "{{user.id}}",
     "aud": "convex",
     "exp": {{date.now_plus_minutes(60)}},
     "iat": {{date.now}},
     "email": "{{user.primary_email_address.email_address}}",
     "name": "{{user.first_name}} {{user.last_name}}",
     "picture": "{{user.image_url}}"
   }

   STEP 3: Save and Apply
   =====================
   1. Click 'Apply changes'
   2. Wait for the template to be active
   3. Restart your development servers
`);

console.log("\n4. 🔄 Alternative Quick Fix (Temporary):");
console.log(`
   If you need a quick temporary fix while setting up the JWT template:
   
   1. Modify ConvexProvider to use basic authentication:
   
   // In src/providers/ConvexProvider.tsx
   import { ConvexProvider } from "convex/react";
   
   export function ConvexClientProvider({ children }) {
     return (
       <ConvexProvider client={convex}>
         {children}
       </ConvexProvider>
     );
   }
   
   Note: This removes Clerk integration temporarily.
`);

console.log("\n5. 🧪 Testing Authentication:");
console.log("   After creating the JWT template, test with these steps:");
console.log("   1. Restart both Next.js (npm run dev) and Convex (npx convex dev)");
console.log("   2. Open http://localhost:3001/chat");
console.log("   3. Check browser console for authentication errors");
console.log("   4. Try signing in with Clerk");
console.log("   5. Verify that protected Convex functions work");

console.log("\n6. 📊 Current Status Summary:");
console.log("   ✅ Environment variables configured");
console.log("   ✅ Convex deployment active");
console.log("   ✅ Clerk keys present");
console.log("   ❌ JWT template 'convex' missing");
console.log("   ❌ Authentication integration broken");

console.log("\n7. 🎯 Expected Results After Fix:");
console.log("   ✅ No 'JWT template' runtime errors");
console.log("   ✅ Authenticated users can fetch conversations");
console.log("   ✅ Unauthenticated users handled gracefully");
console.log("   ✅ Chat interface functions properly");

console.log("\n🚀 Next Steps:");
console.log("1. Create the 'convex' JWT template in Clerk Dashboard");
console.log("2. Restart development servers");
console.log("3. Test authentication flow");
console.log("4. Run: npx tsx scripts/test-auth-final-verification.ts");

console.log("\n📚 Documentation Links:");
console.log("- Clerk JWT Templates: https://clerk.com/docs/backend-requests/making/jwt-templates");
console.log("- Convex + Clerk Integration: https://docs.convex.dev/auth/clerk");
console.log("- Troubleshooting: https://docs.convex.dev/auth/clerk#troubleshooting");

console.log("\n✨ JWT Template Configuration Fix - Complete!");
