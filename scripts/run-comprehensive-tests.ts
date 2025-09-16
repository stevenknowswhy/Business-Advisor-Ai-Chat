#!/usr/bin/env tsx

/**
 * Comprehensive Testing Suite Runner
 * 
 * This script runs all testing suites for Phase 8: Testing & Validation
 * to provide a complete assessment of the application's production readiness.
 */

import { execSync } from "child_process";

interface TestSuite {
  name: string;
  script: string;
  description: string;
  critical: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: "End-to-End Application Testing",
    script: "npx tsx scripts/test-end-to-end.ts",
    description: "Tests data availability, integrity, performance, and structure",
    critical: true
  },
  {
    name: "Real-time Features Testing", 
    script: "npx tsx scripts/test-realtime-features.ts",
    description: "Tests real-time subscriptions, performance under load, and error handling",
    critical: true
  },
  {
    name: "Migration Validation",
    script: "npx tsx scripts/validate-migration.ts", 
    description: "Validates data migration integrity and application functionality",
    critical: true
  }
];

interface TestResults {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

async function runTestSuite(suite: TestSuite): Promise<TestResults> {
  console.log(`\n🧪 Running ${suite.name}...`);
  console.log(`📝 ${suite.description}`);
  console.log("─".repeat(60));

  const startTime = Date.now();
  
  try {
    const output = execSync(suite.script, { 
      encoding: 'utf8',
      timeout: 300000, // 5 minutes timeout
      cwd: process.cwd()
    });
    
    const duration = Date.now() - startTime;
    
    // Check if the output indicates success
    const passed = output.includes("ALL TESTS PASSED") || 
                   output.includes("VALIDATION COMPLETED") ||
                   output.includes("✅");
    
    return {
      suite: suite.name,
      passed,
      duration,
      output
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      suite: suite.name,
      passed: false,
      duration,
      output: "",
      error: errorMessage
    };
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function extractTestStats(output: string): { passed: number; failed: number; total: number } {
  // Try to extract test statistics from output
  const passedMatch = output.match(/✅\s*(\d+)\s*tests?\s*(?:completed\s*successfully|passed)/i);
  const failedMatch = output.match(/❌\s*(?:Failed:\s*)?(\d+)/i);
  
  const passed = parseInt(passedMatch?.[1] ?? "0", 10);
  const failed = parseInt(failedMatch?.[1] ?? "0", 10);
  const total = passed + failed;
  
  return { passed, failed, total };
}

async function runComprehensiveTests() {
  console.log("🚀 Starting Comprehensive Testing Suite");
  console.log("Phase 8: Testing & Validation - PostgreSQL to Convex Migration");
  console.log("=".repeat(80));
  
  const overallStartTime = Date.now();
  const results: TestResults[] = [];
  
  // Run all test suites
  for (const suite of testSuites) {
    const result = await runTestSuite(suite);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${suite.name} - PASSED (${formatDuration(result.duration)})`);
    } else {
      console.log(`❌ ${suite.name} - FAILED (${formatDuration(result.duration)})`);
      if (result.error) {
        console.log(`   Error: ${result.error.split('\n')[0]}`);
      }
    }
  }
  
  const overallDuration = Date.now() - overallStartTime;
  
  // Generate comprehensive report
  console.log("\n" + "=".repeat(80));
  console.log("📊 COMPREHENSIVE TESTING RESULTS");
  console.log("=".repeat(80));
  
  const passedSuites = results.filter(r => r.passed).length;
  const failedSuites = results.filter(r => !r.passed).length;
  const criticalFailures = results.filter(r => !r.passed && testSuites.find(s => s.name === r.suite)?.critical).length;
  
  if (criticalFailures === 0) {
    console.log("🎉 ALL CRITICAL TESTS PASSED!");
    console.log(`✅ Test Suites Passed: ${passedSuites}/${testSuites.length}`);
    console.log(`⏱️  Total Duration: ${formatDuration(overallDuration)}`);
  } else {
    console.log("⚠️  CRITICAL TEST FAILURES DETECTED");
    console.log(`✅ Passed: ${passedSuites}`);
    console.log(`❌ Failed: ${failedSuites}`);
    console.log(`🚨 Critical Failures: ${criticalFailures}`);
    console.log(`⏱️  Total Duration: ${formatDuration(overallDuration)}`);
  }
  
  console.log("\n📋 Detailed Results:");
  
  let totalTestsPassed = 0;
  let totalTestsFailed = 0;
  
  for (const result of results) {
    const suite = testSuites.find(s => s.name === result.suite);
    const criticalBadge = suite?.critical ? "🚨" : "ℹ️";
    const statusBadge = result.passed ? "✅" : "❌";
    
    console.log(`\n${criticalBadge} ${statusBadge} ${result.suite}`);
    console.log(`   Duration: ${formatDuration(result.duration)}`);
    
    if (result.passed && result.output) {
      const stats = extractTestStats(result.output);
      if (stats.total > 0) {
        console.log(`   Tests: ${stats.passed} passed, ${stats.failed} failed (${stats.total} total)`);
        totalTestsPassed += stats.passed;
        totalTestsFailed += stats.failed;
      }
    }
    
    if (!result.passed) {
      console.log(`   Status: FAILED`);
      if (result.error) {
        const errorLines = result.error.split('\n').slice(0, 3);
        errorLines.forEach(line => console.log(`   Error: ${line}`));
      }
    }
  }
  
  if (totalTestsPassed > 0 || totalTestsFailed > 0) {
    console.log(`\n📈 Overall Test Statistics:`);
    console.log(`   Individual Tests Passed: ${totalTestsPassed}`);
    console.log(`   Individual Tests Failed: ${totalTestsFailed}`);
    console.log(`   Total Individual Tests: ${totalTestsPassed + totalTestsFailed}`);
  }
  
  console.log("\n🎯 Phase 8: Testing & Validation Summary:");
  
  if (criticalFailures === 0) {
    console.log("✅ End-to-End Application Testing: All data operations working correctly");
    console.log("✅ Real-time Features: Subscriptions and live updates functioning");
    console.log("✅ Migration Validation: Data integrity confirmed");
    console.log("✅ Production Readiness: Application ready for deployment");
    
    console.log("\n🚀 Next Steps:");
    console.log("  1. ✅ All automated tests passed");
    console.log("  2. 🔄 Manual testing in browser at http://localhost:3001/chat");
    console.log("  3. 🔄 Cross-browser compatibility testing");
    console.log("  4. 🔄 Mobile responsiveness testing");
    console.log("  5. 🔄 User acceptance testing");
    console.log("  6. 🔄 Performance testing under load");
    console.log("  7. 🔄 Proceed to Phase 9: Deployment & Cleanup");
    
  } else {
    console.log("❌ Critical test failures detected - address before proceeding");
    console.log("\n🔧 Required Actions:");
    
    for (const result of results) {
      const suite = testSuites.find(s => s.name === result.suite);
      if (!result.passed && suite?.critical) {
        console.log(`  - Fix issues in: ${result.suite}`);
      }
    }
  }
  
  console.log("\n" + "=".repeat(80));
  
  // Exit with appropriate code
  process.exit(criticalFailures > 0 ? 1 : 0);
}

// Run the comprehensive tests
runComprehensiveTests().catch(error => {
  console.error("💥 Comprehensive testing suite failed:", error);
  process.exit(1);
});
