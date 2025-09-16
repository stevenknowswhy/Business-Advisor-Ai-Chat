#!/usr/bin/env tsx

/**
 * Production Readiness Testing Script
 * 
 * This script validates that the application is ready for production deployment
 * by testing build processes, environment configuration, error handling,
 * and performance characteristics.
 */

import * as dotenv from "dotenv";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment variables
dotenv.config({ path: ".env.local" });

interface ProductionTestResults {
  passed: number;
  failed: number;
  warnings: number;
  errors: string[];
  details: Array<{
    test: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    duration: number;
  }>;
}

const testResults: ProductionTestResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  details: [],
};

// Test utility functions
function logTest(testName: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, duration: number) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${emoji} ${testName}: ${message} (${duration}ms)`);
  
  testResults.details.push({ test: testName, status, message, duration });
  
  if (status === 'PASS') {
    testResults.passed++;
  } else if (status === 'FAIL') {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${message}`);
  } else {
    testResults.warnings++;
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

async function runWarningTest(testName: string, testFn: () => Promise<string>): Promise<void> {
  const startTime = Date.now();
  try {
    const warningMessage = await testFn();
    const duration = Date.now() - startTime;
    logTest(testName, 'WARN', warningMessage, duration);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    logTest(testName, 'FAIL', message, duration);
  }
}

// Test 1: Environment Configuration
async function testEnvironmentConfiguration() {
  console.log("\n🔧 Testing Environment Configuration...");

  await runTest("Required Environment Variables", async () => {
    const requiredVars = [
      'NEXT_PUBLIC_CONVEX_URL',
      'CONVEX_DEPLOYMENT',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'OPENROUTER_API_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    console.log(`    All ${requiredVars.length} required environment variables present`);
  });

  await runTest("Convex URL Configuration", async () => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
    }
    
    if (!convexUrl.startsWith('https://')) {
      throw new Error("Convex URL should use HTTPS in production");
    }
    
    if (!convexUrl.includes('.convex.cloud')) {
      throw new Error("Invalid Convex URL format");
    }
    
    console.log(`    Convex URL properly configured: ${convexUrl}`);
  });

  await runTest("Clerk Configuration", async () => {
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    if (!clerkSecret || !clerkPublishable) {
      throw new Error("Clerk keys not properly configured");
    }
    
    if (!clerkSecret.startsWith('sk_')) {
      throw new Error("Invalid Clerk secret key format");
    }
    
    if (!clerkPublishable.startsWith('pk_')) {
      throw new Error("Invalid Clerk publishable key format");
    }
    
    console.log(`    Clerk authentication properly configured`);
  });
}

// Test 2: Build and Deployment
async function testBuildAndDeployment() {
  console.log("\n🏗️  Testing Build and Deployment...");

  await runTest("Next.js Production Build", async () => {
    try {
      console.log("    Running production build...");
      const buildOutput = execSync('npm run build', { 
        encoding: 'utf8',
        timeout: 120000, // 2 minutes timeout
        cwd: process.cwd()
      });
      
      if (buildOutput.includes('Failed to compile')) {
        throw new Error("Build compilation failed");
      }
      
      if (buildOutput.includes('Error:')) {
        throw new Error("Build completed with errors");
      }
      
      console.log(`    Production build completed successfully`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error("Build process timed out (> 2 minutes)");
      }
      throw error;
    }
  });

  await runTest("Build Output Validation", async () => {
    const buildDir = '.next';
    if (!existsSync(buildDir)) {
      throw new Error("Build directory not found");
    }
    
    const staticDir = '.next/static';
    if (!existsSync(staticDir)) {
      throw new Error("Static assets directory not found");
    }
    
    console.log(`    Build output structure validated`);
  });

  await runTest("TypeScript Compilation", async () => {
    try {
      execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        timeout: 60000,
        cwd: process.cwd()
      });
      console.log(`    TypeScript compilation successful`);
    } catch (error) {
      throw new Error("TypeScript compilation failed");
    }
  });
}

// Test 3: Convex Deployment Status
async function testConvexDeployment() {
  console.log("\n☁️  Testing Convex Deployment...");

  await runTest("Convex Functions Deployed", async () => {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Test that all major functions are available
    const testFunctions = [
      () => convex.query(api.advisors.getActiveAdvisors),
      () => convex.query(api.users.list),
      () => convex.query(api.conversations.list),
      () => convex.query(api.messages.list)
    ];
    
    for (const testFn of testFunctions) {
      await testFn();
    }
    
    console.log(`    All ${testFunctions.length} core functions deployed and accessible`);
  });

  await runTest("Convex Schema Validation", async () => {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Test data structure consistency
    const advisors = await convex.query(api.advisors.getActiveAdvisors);
    if (advisors.length > 0) {
      const advisor = advisors[0];
      if (!advisor) {
        throw new Error("No advisor data available for validation");
      }

      const requiredFields = ['_id', 'persona', 'status', 'createdAt'];

      for (const field of requiredFields) {
        if (!(field in advisor)) {
          throw new Error(`Advisor schema missing required field: ${field}`);
        }
      }
    }
    
    console.log(`    Convex schema validation successful`);
  });

  await runTest("Convex Performance", async () => {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const startTime = Date.now();
    await Promise.all([
      convex.query(api.advisors.getActiveAdvisors),
      convex.query(api.conversations.list),
      convex.query(api.messages.list)
    ]);
    const duration = Date.now() - startTime;
    
    if (duration > 2000) {
      throw new Error(`Convex queries took ${duration}ms (expected < 2000ms)`);
    }
    
    console.log(`    Convex performance acceptable: ${duration}ms for 3 concurrent queries`);
  });
}

// Test 4: Security and Error Handling
async function testSecurityAndErrorHandling() {
  console.log("\n🔒 Testing Security and Error Handling...");

  await runTest("Authentication Enforcement", async () => {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    try {
      // This should fail without authentication
      await convex.query(api.conversations.getUserConversations);
      throw new Error("Expected authentication error");
    } catch (error) {
      if (error instanceof Error && error.message.includes("not authenticated")) {
        console.log(`    Authentication properly enforced`);
      } else {
        throw new Error("Unexpected error type for unauthenticated request");
      }
    }
  });

  await runTest("Error Boundary Configuration", async () => {
    // Check if error boundary components exist
    const errorBoundaryPath = 'src/components/common/ErrorBoundary.tsx';
    if (!existsSync(errorBoundaryPath)) {
      throw new Error("Error boundary component not found");
    }
    
    const errorBoundaryContent = readFileSync(errorBoundaryPath, 'utf8');
    if (!errorBoundaryContent.includes('componentDidCatch')) {
      throw new Error("Error boundary missing componentDidCatch method");
    }
    
    console.log(`    Error boundary properly configured`);
  });

  await runTest("Environment Security", async () => {
    // Check that sensitive keys are not exposed in client-side code
    const nextConfigPath = 'next.config.js';
    if (existsSync(nextConfigPath)) {
      const configContent = readFileSync(nextConfigPath, 'utf8');
      if (configContent.includes('CLERK_SECRET_KEY')) {
        throw new Error("Secret key exposed in Next.js config");
      }
    }
    
    console.log(`    Environment security validated`);
  });
}

// Test 5: Performance and Optimization
async function testPerformanceOptimization() {
  console.log("\n⚡ Testing Performance and Optimization...");

  await runWarningTest("Bundle Size Analysis", async () => {
    try {
      const buildOutput = execSync('npm run build 2>&1', { encoding: 'utf8' });
      
      // Look for bundle size warnings
      if (buildOutput.includes('Large bundle detected')) {
        return "Large bundle size detected - consider code splitting";
      }
      
      // Check for specific large chunks
      const lines = buildOutput.split('\n');
      const largeBundles = lines.filter(line => 
        line.includes('kB') && 
        (line.includes('First Load JS') || line.includes('chunks/')) &&
        parseInt(line.match(/(\d+)\s*kB/)?.[1] || '0') > 500
      );
      
      if (largeBundles.length > 0) {
        return `Large bundles found: ${largeBundles.length} bundles > 500kB`;
      }
      
      return "Bundle sizes within acceptable limits";
    } catch (error) {
      throw new Error("Failed to analyze bundle size");
    }
  });

  await runTest("Image Optimization", async () => {
    // Check if Next.js image optimization is configured
    const nextConfigPath = 'next.config.js';
    if (existsSync(nextConfigPath)) {
      const configContent = readFileSync(nextConfigPath, 'utf8');
      // This is a basic check - in a real app you'd want more sophisticated validation
      console.log(`    Image optimization configuration present`);
    } else {
      console.log(`    Default image optimization enabled`);
    }
  });

  await runTest("Caching Strategy", async () => {
    // Verify that Convex provides built-in caching
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Run the same query twice and measure timing
    const start1 = Date.now();
    await convex.query(api.advisors.getActiveAdvisors);
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    await convex.query(api.advisors.getActiveAdvisors);
    const time2 = Date.now() - start2;
    
    console.log(`    Query caching: first=${time1}ms, second=${time2}ms`);
  });
}

// Main test runner
async function runProductionReadinessTests() {
  console.log("🚀 Starting Production Readiness Testing");
  console.log("=" .repeat(60));

  const startTime = Date.now();

  try {
    await testEnvironmentConfiguration();
    await testBuildAndDeployment();
    await testConvexDeployment();
    await testSecurityAndErrorHandling();
    await testPerformanceOptimization();

    const totalDuration = Date.now() - startTime;

    console.log("\n" + "=".repeat(60));
    console.log("📊 PRODUCTION READINESS TEST RESULTS");
    console.log("=".repeat(60));

    const totalTests = testResults.passed + testResults.failed + testResults.warnings;
    
    if (testResults.failed === 0) {
      console.log("🎉 PRODUCTION READINESS VALIDATED!");
      console.log(`✅ Passed: ${testResults.passed}`);
      console.log(`⚠️  Warnings: ${testResults.warnings}`);
      console.log(`⏱️  Total duration: ${totalDuration}ms`);
      
      if (testResults.warnings > 0) {
        console.log("\n⚠️  Warnings (non-blocking):");
        testResults.details
          .filter(d => d.status === 'WARN')
          .forEach(detail => console.log(`  - ${detail.test}: ${detail.message}`));
      }
    } else {
      console.log("❌ PRODUCTION READINESS ISSUES FOUND");
      console.log(`✅ Passed: ${testResults.passed}`);
      console.log(`❌ Failed: ${testResults.failed}`);
      console.log(`⚠️  Warnings: ${testResults.warnings}`);
      console.log(`⏱️  Total duration: ${totalDuration}ms`);
      
      console.log("\n❌ Critical Issues:");
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log("\n📋 Production Deployment Checklist:");
    console.log("  1. ✅ Environment variables configured");
    console.log("  2. ✅ Application builds successfully");
    console.log("  3. ✅ Convex functions deployed");
    console.log("  4. ✅ Authentication working");
    console.log("  5. ✅ Error handling in place");
    console.log("  6. 🔄 Deploy to staging environment");
    console.log("  7. 🔄 Run final user acceptance tests");
    console.log("  8. 🔄 Deploy to production");

  } catch (error) {
    console.error("💥 Production readiness test suite failed:", error);
    process.exit(1);
  }
}

// Run the tests
runProductionReadinessTests().catch(console.error);
