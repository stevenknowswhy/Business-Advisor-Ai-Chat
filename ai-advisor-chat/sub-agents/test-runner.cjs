#!/usr/bin/env node

/**
 * Playwright MCP Test Runner
 *
 * This script orchestrates E2E tests using the Playwright MCP server
 * through the Tester/Debugger sub-agent configuration.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testerConfig = this.loadTesterConfig();
    this.results = [];
    this.startTime = Date.now();
  }

  loadTesterConfig() {
    try {
      const configPath = path.join(__dirname, 'tester-debugger.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error loading tester configuration:', error);
      process.exit(1);
    }
  }

  async runTest(testScenario, category) {
    const testName = `${category}: ${testScenario.name}`;
    console.log(`🧪 Running test: ${testName}`);

    try {
      // Prepare test command for Playwright MCP
      const testCommand = this.buildTestCommand(testScenario, category);

      // Execute test through MCP
      const result = await this.executeMCPTest(testCommand, testScenario);

      this.results.push({
        testName,
        category,
        ...result,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Test completed: ${testName} - Status: ${result.status}`);
      if (result.errors.length > 0) {
        console.log(`❌ Errors: ${result.errors.join(', ')}`);
      }

      return result;
    } catch (error) {
      const errorResult = {
        testName,
        category,
        status: 'fail',
        errors: [error.message],
        warnings: [],
        screenshot: null,
        performance: { loadTime: 0, resourceCount: 0 },
        consoleLogs: [],
        timestamp: new Date().toISOString()
      };

      this.results.push(errorResult);
      console.log(`❌ Test failed: ${testName} - Error: ${error.message}`);
      return errorResult;
    }
  }

  buildTestCommand(testScenario, category) {
    const baseCommand = {
      action: 'navigate',
      url: this.getFullUrl(testScenario.url),
      checks: testScenario.checks,
      config: this.testerConfig.configuration
    };

    // Add category-specific configurations
    if (category === 'rbac') {
      baseCommand.auth = {
        role: testScenario.userRole,
        credentials: testScenario.testCredentials || {}
      };
      baseCommand.expectedResult = testScenario.expectedResult;
    }

    if (testScenario.testMode) {
      baseCommand.testMode = true;
    }

    return baseCommand;
  }

  getFullUrl(relativeUrl) {
    // Default to localhost:3000 for main app
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    return new URL(relativeUrl, baseUrl).href;
  }

  async executeMCPTest(testCommand, testScenario) {
    return new Promise((resolve, reject) => {
      // This would typically make an HTTP request to the Playwright MCP server
      // For now, we'll simulate the MCP call structure

      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'playwright_navigate',
          arguments: {
            url: testCommand.url,
            timeout: testCommand.config.timeout || 30000,
            viewport: testCommand.config.viewport,
            headless: testCommand.config.headless
          }
        }
      };

      // Simulate MCP server response
      setTimeout(() => {
        // This is a mock response - in real implementation, this would come from MCP
        const mockResponse = {
          status: Math.random() > 0.2 ? 'pass' : 'fail', // 80% pass rate for demo
          errors: [],
          warnings: [],
          screenshot: null,
          performance: {
            loadTime: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
            resourceCount: Math.floor(Math.random() * 50) + 10 // 10-60 resources
          },
          consoleLogs: []
        };

        // Add some simulated errors occasionally
        if (mockResponse.status === 'fail') {
          mockResponse.errors.push('Simulated console error for testing');
        }

        resolve(mockResponse);
      }, 1000 + Math.random() * 2000); // 1-3 second delay
    });
  }

  async runParallelTests() {
    const testCategories = Object.keys(this.testerConfig.testScenarios);
    const promises = [];

    for (const category of testCategories) {
      const scenarios = this.testerConfig.testScenarios[category];

      for (const scenario of scenarios) {
        if (this.testerConfig.parallelTesting.enabled) {
          promises.push(this.runTest(scenario, category));
        } else {
          await this.runTest(scenario, category);
        }
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    const report = {
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'pass').length,
        failed: this.results.filter(r => r.status === 'fail').length,
        warnings: this.results.filter(r => r.status === 'warning').length,
        duration: totalDuration,
        timestamp: new Date().toISOString()
      },
      results: this.results,
      configuration: {
        parallelTesting: this.testerConfig.parallelTesting.enabled,
        maxConcurrent: this.testerConfig.parallelTesting.maxConcurrent,
        timeout: this.testerConfig.parallelTesting.timeout
      }
    };

    // Save report to file
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Test Report Summary:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Warnings: ${report.summary.warnings}`);
    console.log(`   Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`   Report saved to: ${reportPath}`);

    return report;
  }

  async run() {
    console.log('🚀 Starting Playwright MCP Test Suite');
    console.log(`   Parallel Testing: ${this.testerConfig.parallelTesting.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Max Concurrent: ${this.testerConfig.parallelTesting.maxConcurrent}`);
    console.log(`   Timeout: ${this.testerConfig.parallelTesting.timeout}ms\n`);

    try {
      await this.runParallelTests();
      const report = this.generateReport();

      // Exit with appropriate code
      process.exit(report.summary.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Run the test suite if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner;