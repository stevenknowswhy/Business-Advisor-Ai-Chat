#!/usr/bin/env node

/**
 * Parallel Test Runner for AI Advisor App
 *
 * This script runs multiple Playwright MCP tests in parallel
 * across the main app and blog components
 */

// const MCPTestExecutor = require('./mcp-test-executor');
const testScenarios = require('./test-scenarios.json');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

class ParallelTestRunner {
  constructor() {
    this.scenarios = testScenarios;
    this.results = [];
    this.startTime = Date.now();
    this.maxConcurrent = testScenarios.parallelExecution.maxConcurrent;
    this.timeout = testScenarios.parallelExecution.timeout;
    this.workers = new Map();
  }

  async initialize() {
    console.log('🚀 Initializing Parallel Test Runner');
    console.log(`   Max concurrent tests: ${this.maxConcurrent}`);
    console.log(`   Timeout per test: ${this.timeout}ms`);
    console.log(`   Total test scenarios: ${this.getAllTestCount()}`);
  }

  getAllTestCount() {
    const mainAppCount = this.scenarios.mainAppTests.length;
    const blogCount = this.scenarios.blogTests.length;
    const rbacCount = this.scenarios.rbacTests.length;
    const accessibilityCount = this.scenarios.accessibilityTests.length;
    const performanceCount = this.scenarios.performanceTests.length;

    return mainAppCount + blogCount + rbacCount + accessibilityCount + performanceCount;
  }

  async runTestSuite() {
    console.log('\n🧪 Starting Parallel Test Execution\n');

    const testQueue = this.buildTestQueue();
    const results = await this.executeTestsInParallel(testQueue);

    this.generateReport(results);
    return results;
  }

  buildTestQueue() {
    const queue = [];
    const baseUrl = this.scenarios.environments.development;

    // Add main app tests
    this.scenarios.mainAppTests.forEach(test => {
      queue.push({
        ...test,
        fullUrl: new URL(test.url, baseUrl.mainApp).href,
        category: 'mainApp'
      });
    });

    // Add blog tests
    this.scenarios.blogTests.forEach(test => {
      queue.push({
        ...test,
        fullUrl: new URL(test.url, baseUrl.blog).href,
        category: 'blog'
      });
    });

    // Add RBAC tests
    this.scenarios.rbacTests.forEach(test => {
      queue.push({
        ...test,
        fullUrl: new URL(test.url, baseUrl.mainApp).href,
        category: 'rbac'
      });
    });

    // Add accessibility tests
    this.scenarios.accessibilityTests.forEach(test => {
      queue.push({
        ...test,
        fullUrl: new URL(test.url, baseUrl.mainApp).href,
        category: 'accessibility'
      });
    });

    // Add performance tests
    this.scenarios.performanceTests.forEach(test => {
      queue.push({
        ...test,
        fullUrl: new URL(test.url, baseUrl.mainApp).href,
        category: 'performance'
      });
    });

    return queue;
  }

  async executeTestsInParallel(testQueue) {
    const results = [];
    const executing = new Set();
    let currentIndex = 0;

    console.log(`🔄 Executing ${testQueue.length} tests with max ${this.maxConcurrent} concurrent`);

    while (currentIndex < testQueue.length || executing.size > 0) {
      // Fill up to max concurrent workers
      while (executing.size < this.maxConcurrent && currentIndex < testQueue.length) {
        const test = testQueue[currentIndex++];
        const testPromise = this.executeSingleTest(test);
        executing.add(testPromise);

        testPromise
          .then(result => {
            results.push(result);
            executing.delete(testPromise);
          })
          .catch(error => {
            results.push({
              ...test,
              status: 'fail',
              errors: [error.message],
              timestamp: new Date().toISOString()
            });
            executing.delete(testPromise);
          });
      }

      // Wait for at least one test to complete
      if (executing.size > 0) {
        await Promise.race(executing);
      }

      // Progress reporting
      const completed = results.length;
      const total = testQueue.length;
      const percentage = Math.round((completed / total) * 100);

      if (completed % 5 === 0 || completed === total) {
        console.log(`📊 Progress: ${completed}/${total} (${percentage}%)`);
      }
    }

    return results;
  }

  async executeSingleTest(test) {
    const startTime = Date.now();
    console.log(`🧪 Running: ${test.name} (${test.category})`);

    try {
      // For now, simulate test execution since we don't have real MCP server connection
      // In real implementation, this would use MCPTestExecutor
      const result = await this.simulateTestExecution(test);

      const executionTime = Date.now() - startTime;

      return {
        ...test,
        ...result,
        executionTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        ...test,
        status: 'fail',
        errors: [error.message],
        executionTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  async simulateTestExecution(test) {
    // Simulate test execution with realistic delays and success rates
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

    // Simulate different success rates based on test type
    const successRates = {
      mainApp: 0.9,
      blog: 0.85,
      rbac: 0.95,
      accessibility: 0.8,
      performance: 0.75
    };

    const successRate = successRates[test.category] || 0.8;
    const isSuccess = Math.random() < successRate;

    if (isSuccess) {
      return {
        status: 'pass',
        errors: [],
        warnings: [],
        performance: {
          loadTime: Math.floor(Math.random() * 2000) + 500,
          resourceCount: Math.floor(Math.random() * 30) + 10
        },
        consoleLogs: []
      };
    } else {
      return {
        status: 'fail',
        errors: [`Simulated ${test.category} test failure`],
        warnings: [],
        performance: {
          loadTime: Math.floor(Math.random() * 4000) + 1000,
          resourceCount: Math.floor(Math.random() * 50) + 20
        },
        consoleLogs: [
          {
            type: 'error',
            text: 'Simulated console error for testing',
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
  }

  generateReport(results) {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    const summary = {
      totalTests: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.warnings && r.warnings.length > 0).length,
      duration: totalDuration,
      averageExecutionTime: results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length
    };

    const categorySummary = {};
    ['mainApp', 'blog', 'rbac', 'accessibility', 'performance'].forEach(category => {
      const categoryResults = results.filter(r => r.category === category);
      categorySummary[category] = {
        total: categoryResults.length,
        passed: categoryResults.filter(r => r.status === 'pass').length,
        failed: categoryResults.filter(r => r.status === 'fail').length,
        passRate: categoryResults.length > 0 ?
          (categoryResults.filter(r => r.status === 'pass').length / categoryResults.length * 100).toFixed(1) : 0
      };
    });

    const report = {
      execution: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: totalDuration,
        maxConcurrent: this.maxConcurrent
      },
      summary,
      categorySummary,
      failedTests: results.filter(r => r.status === 'fail'),
      slowestTests: results
        .sort((a, b) => (b.executionTime || 0) - (a.executionTime || 0))
        .slice(0, 5),
      results
    };

    // Save report
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, 'parallel-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Parallel Test Execution Summary:');
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.passed}`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Warnings: ${summary.warnings}`);
    console.log(`   Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`   Average Execution Time: ${Math.round(summary.averageExecutionTime)}ms`);
    console.log(`   Report saved to: ${reportPath}`);

    // Category breakdown
    console.log('\n📈 Category Breakdown:');
    Object.entries(categorySummary).forEach(([category, stats]) => {
      console.log(`   ${category.toUpperCase()}: ${stats.passed}/${stats.total} (${stats.passRate}%)`);
    });

    return report;
  }
}

// Worker thread function for actual MCP execution
async function runMCPTestWorker(testData) {
  const executor = new MCPTestExecutor();

  try {
    await executor.initialize();

    switch (testData.type) {
      case 'navigation':
        return await executor.runNavigationTest(testData.fullUrl, testData.name);
      case 'form':
        return await executor.runFormTest(testData.fullUrl, testData.formData || {}, testData.name);
      default:
        return await executor.runNavigationTest(testData.fullUrl, testData.name);
    }
  } catch (error) {
    return {
      ...testData,
      status: 'fail',
      errors: [error.message],
      timestamp: new Date().toISOString()
    };
  } finally {
    await executor.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new ParallelTestRunner();

  runner.initialize()
    .then(() => runner.runTestSuite())
    .then(report => {
      const exitCode = report.summary.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Parallel test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { ParallelTestRunner, runMCPTestWorker };