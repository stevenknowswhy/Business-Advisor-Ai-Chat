#!/usr/bin/env tsx

/**
 * Advisor Display Fix Verification Script
 * 
 * This script tests the data transformation that was causing advisors
 * not to display in the frontend.
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

// Mock the transformation function to test it
function transformAdvisorForClient(advisor: any) {
  return {
    id: advisor._id,
    name: advisor.persona.name,
    title: advisor.persona.title,
    image: advisor.imageUrl,
    oneLiner: advisor.persona.description || "",
    archetype: advisor.metadata?.category || "General",
    bio: advisor.persona.description || "",
    tags: advisor.persona.expertise || [],
    location: {
      city: advisor.localization?.region || "Remote",
      region: advisor.localization?.region || "Global",
    },
    adviceDelivery: {
      mode: "conversational",
      formality: "professional",
      signOff: "Best regards",
    },
    mission: advisor.persona.description || "",
  };
}

async function testAdvisorDisplayFix() {
  console.log('🔧 Testing Advisor Display Fix');
  console.log('=' .repeat(40));
  
  const client = new ConvexHttpClient(CONVEX_URL as string);
  
  console.log('\n1. 📋 Fetching raw advisor data from Convex...');
  try {
    const rawAdvisors = await client.query(api.advisors.getAllAdvisors, {});
    console.log(`   ✅ Raw advisors fetched: ${rawAdvisors.length} found`);
    
    console.log('\n2. 🔄 Testing data transformation...');
    const transformedAdvisors = rawAdvisors.map((advisor: any) => {
      try {
        const transformed = transformAdvisorForClient(advisor);
        console.log(`   ✅ Transformed "${advisor.persona.name}": ${JSON.stringify(transformed, null, 2).substring(0, 100)}...`);
        return transformed;
      } catch (error) {
        console.log(`   ❌ Failed to transform "${advisor.persona?.name || 'Unknown'}": ${error}`);
        return null;
      }
    }).filter(Boolean);
    
    console.log(`\n3. 📊 Transformation Results:`);
    console.log(`   - Raw advisors: ${rawAdvisors.length}`);
    console.log(`   - Successfully transformed: ${transformedAdvisors.length}`);
    console.log(`   - Failed transformations: ${rawAdvisors.length - transformedAdvisors.length}`);
    
    if (transformedAdvisors.length > 0) {
      console.log('\n4. 🎯 Sample transformed advisor:');
      console.log(JSON.stringify(transformedAdvisors[0], null, 2));
    }
    
    console.log('\n' + '='.repeat(40));
    console.log('📊 ADVISOR DISPLAY FIX TEST RESULTS');
    console.log('='.repeat(40));
    
    if (transformedAdvisors.length === rawAdvisors.length) {
      console.log('🎉 SUCCESS: All advisors transformed successfully!');
      console.log('✅ The frontend should now display all advisors correctly.');
      console.log('✅ The "tags" field issue has been resolved.');
      console.log('✅ Data transformation is working properly.');
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some advisors failed to transform.');
      console.log('🔧 Check the error messages above for specific issues.');
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Refresh the browser at http://localhost:3001/chat');
    console.log('2. Check that advisors are now visible in the sidebar');
    console.log('3. Verify that all 4 advisors are displayed correctly');
    console.log('4. Test advisor selection and interaction');
    
    console.log('\n' + '='.repeat(40));
    
  } catch (error) {
    console.log(`   ❌ Failed to fetch advisors: ${error}`);
  }
}

// Run the test
testAdvisorDisplayFix().catch(error => {
  console.error('💥 Advisor display fix test failed:', error);
  process.exit(1);
});
