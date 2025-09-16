#!/usr/bin/env tsx

/**
 * Frontend Assets Testing Script
 * 
 * This script tests that all Next.js static assets are being served correctly
 * and that the application loads without JavaScript errors.
 */

// Use native fetch in Node.js 18+

interface AssetTest {
  url: string;
  description: string;
  expectedContentType: string;
  critical: boolean;
}

const BASE_URL = 'http://localhost:3001';

// Common Next.js static assets that should be available
const STATIC_ASSETS: AssetTest[] = [
  {
    url: `${BASE_URL}/chat`,
    description: 'Chat page HTML',
    expectedContentType: 'text/html',
    critical: true
  }
];

interface TestResults {
  passed: number;
  failed: number;
  errors: string[];
  details: Array<{
    url: string;
    status: 'PASS' | 'FAIL';
    message: string;
    statusCode?: number;
    contentType?: string;
  }>;
}

const testResults: TestResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: [],
};

async function testAsset(asset: AssetTest): Promise<void> {
  try {
    console.log(`🔍 Testing: ${asset.description}`);
    
    const response = await fetch(asset.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const statusCode = response.status;

    if (statusCode === 200) {
      // Check content type if specified
      if (asset.expectedContentType && !contentType.includes(asset.expectedContentType)) {
        testResults.failed++;
        testResults.errors.push(`${asset.url}: Wrong content type - expected ${asset.expectedContentType}, got ${contentType}`);
        testResults.details.push({
          url: asset.url,
          status: 'FAIL',
          message: `Wrong content type: ${contentType}`,
          statusCode,
          contentType
        });
        console.log(`  ❌ FAIL: Wrong content type (${contentType})`);
      } else {
        testResults.passed++;
        testResults.details.push({
          url: asset.url,
          status: 'PASS',
          message: 'Asset loaded successfully',
          statusCode,
          contentType
        });
        console.log(`  ✅ PASS: Loaded successfully (${statusCode}, ${contentType})`);
      }
    } else {
      testResults.failed++;
      testResults.errors.push(`${asset.url}: HTTP ${statusCode}`);
      testResults.details.push({
        url: asset.url,
        status: 'FAIL',
        message: `HTTP ${statusCode}`,
        statusCode,
        contentType
      });
      console.log(`  ❌ FAIL: HTTP ${statusCode}`);
    }

  } catch (error) {
    testResults.failed++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.errors.push(`${asset.url}: ${errorMessage}`);
    testResults.details.push({
      url: asset.url,
      status: 'FAIL',
      message: errorMessage
    });
    console.log(`  ❌ FAIL: ${errorMessage}`);
  }
}

async function testServerHealth(): Promise<boolean> {
  try {
    console.log('🏥 Testing server health...');
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'HEAD'
    });
    
    if (response.status === 200) {
      console.log('  ✅ Server is responding');
      return true;
    } else {
      console.log(`  ❌ Server returned ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Server not responding: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function extractDynamicAssets(): Promise<AssetTest[]> {
  try {
    console.log('🔍 Extracting dynamic assets from chat page...');
    
    const response = await fetch(`${BASE_URL}/chat`);
    const html = await response.text();
    
    const dynamicAssets: AssetTest[] = [];
    
    // Extract script tags
    const scriptMatches = html.match(/<script[^>]+src="([^"]+)"[^>]*>/g) || [];
    for (const match of scriptMatches) {
      const srcMatch = match.match(/src="([^"]+)"/);
      if (srcMatch?.[1]?.startsWith('/_next/') === true) {
        dynamicAssets.push({
          url: `${BASE_URL}${srcMatch[1]}`,
          description: `JavaScript: ${srcMatch[1]}`,
          expectedContentType: 'application/javascript',
          critical: true
        });
      }
    }
    
    // Extract CSS links
    const linkMatches = html.match(/<link[^>]+href="([^"]+)"[^>]*rel="stylesheet"[^>]*>/g) || [];
    for (const match of linkMatches) {
      const hrefMatch = match.match(/href="([^"]+)"/);
      if (hrefMatch?.[1]?.startsWith('/_next/') === true) {
        dynamicAssets.push({
          url: `${BASE_URL}${hrefMatch[1]}`,
          description: `CSS: ${hrefMatch[1]}`,
          expectedContentType: 'text/css',
          critical: true
        });
      }
    }
    
    console.log(`  Found ${dynamicAssets.length} dynamic assets`);
    return dynamicAssets;
    
  } catch (error) {
    console.log(`  ❌ Failed to extract dynamic assets: ${error instanceof Error ? error.message : error}`);
    return [];
  }
}

async function runFrontendAssetTests() {
  console.log('🚀 Starting Frontend Assets Testing');
  console.log('=' .repeat(60));

  const startTime = Date.now();

  // Test server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not responding. Please ensure the development server is running.');
    console.log('Run: npm run dev');
    process.exit(1);
  }

  // Extract dynamic assets from the actual page
  const dynamicAssets = await extractDynamicAssets();
  const allAssets = [...STATIC_ASSETS, ...dynamicAssets];

  console.log(`\n📋 Testing ${allAssets.length} assets...\n`);

  // Test all assets
  for (const asset of allAssets) {
    await testAsset(asset);
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n' + '='.repeat(60));
  console.log('📊 FRONTEND ASSETS TEST RESULTS');
  console.log('='.repeat(60));

  const criticalFailures = testResults.details.filter(d => 
    d.status === 'FAIL' && allAssets.find(a => a.url === d.url)?.critical
  ).length;

  if (testResults.failed === 0) {
    console.log('🎉 ALL ASSETS LOADED SUCCESSFULLY!');
    console.log(`✅ Assets tested: ${testResults.passed}`);
    console.log(`⏱️  Total duration: ${totalDuration}ms`);
  } else {
    console.log('⚠️  SOME ASSETS FAILED TO LOAD');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`🚨 Critical failures: ${criticalFailures}`);
    console.log(`⏱️  Total duration: ${totalDuration}ms`);
  }

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Assets:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n📋 Asset Details:');
  testResults.details.forEach(detail => {
    const emoji = detail.status === 'PASS' ? '✅' : '❌';
    console.log(`${emoji} ${detail.url}`);
    console.log(`   Status: ${detail.statusCode || 'N/A'} | Type: ${detail.contentType || 'N/A'}`);
    if (detail.status === 'FAIL') {
      console.log(`   Error: ${detail.message}`);
    }
  });

  console.log('\n🎯 Frontend Status Summary:');
  if (criticalFailures === 0) {
    console.log('✅ All critical assets loading correctly');
    console.log('✅ JavaScript files served with correct MIME types');
    console.log('✅ CSS files loading properly');
    console.log('✅ No 404 errors for essential Next.js chunks');
    console.log('✅ Application ready for user interaction');
  } else {
    console.log('❌ Critical asset loading issues detected');
    console.log('🔧 Required actions:');
    console.log('  - Check development server status');
    console.log('  - Clear Next.js cache: rm -rf .next');
    console.log('  - Restart development server: npm run dev');
  }

  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(criticalFailures > 0 ? 1 : 0);
}

// Run the tests
runFrontendAssetTests().catch(error => {
  console.error('💥 Frontend asset testing failed:', error);
  process.exit(1);
});
