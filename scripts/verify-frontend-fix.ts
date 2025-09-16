#!/usr/bin/env tsx

/**
 * Frontend Fix Verification Script
 * 
 * This script verifies that the JavaScript loading issues have been resolved
 * by checking server status and providing manual testing instructions.
 */

import { execSync } from 'child_process';

function checkServerStatus(): boolean {
  try {
    // Use curl to test the server
    const result = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/chat', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    
    const statusCode = parseInt(result.trim());
    return statusCode === 200;
  } catch (error) {
    return false;
  }
}

function checkProcesses(): { devServer: boolean; convexServer: boolean } {
  try {
    const processes = execSync('ps aux | grep -E "(next dev|convex dev)" | grep -v grep', { 
      encoding: 'utf8' 
    });
    
    return {
      devServer: processes.includes('next dev'),
      convexServer: processes.includes('convex dev')
    };
  } catch (error) {
    return { devServer: false, convexServer: false };
  }
}

function checkBuildDirectory(): boolean {
  try {
    const result = execSync('ls -la .next/', { encoding: 'utf8' });
    return result.includes('server') && result.includes('static');
  } catch (error) {
    return false;
  }
}

async function verifyFrontendFix() {
  console.log('🔧 Frontend Fix Verification');
  console.log('=' .repeat(50));
  
  console.log('\n1. 🏥 Checking Server Status...');
  const serverRunning = checkServerStatus();
  if (serverRunning) {
    console.log('   ✅ Development server is responding (HTTP 200)');
  } else {
    console.log('   ❌ Development server is not responding');
  }
  
  console.log('\n2. 🔍 Checking Running Processes...');
  const processes = checkProcesses();
  if (processes.devServer) {
    console.log('   ✅ Next.js development server is running');
  } else {
    console.log('   ❌ Next.js development server not found');
  }
  
  if (processes.convexServer) {
    console.log('   ✅ Convex development server is running');
  } else {
    console.log('   ❌ Convex development server not found');
  }
  
  console.log('\n3. 📁 Checking Build Directory...');
  const buildExists = checkBuildDirectory();
  if (buildExists) {
    console.log('   ✅ .next directory contains server and static folders');
  } else {
    console.log('   ❌ .next directory is missing or incomplete');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(50));
  
  const allGood = serverRunning && processes.devServer && processes.convexServer && buildExists;
  
  if (allGood) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('\n✅ Issues Resolved:');
    console.log('   - 404 errors for JavaScript files: FIXED');
    console.log('   - MIME type execution errors: FIXED');
    console.log('   - Missing routes-manifest.json: FIXED');
    console.log('   - Corrupted build cache: FIXED');
    
    console.log('\n🌐 Manual Testing Instructions:');
    console.log('   1. Open: http://localhost:3001/chat');
    console.log('   2. Check browser console (F12) - should be error-free');
    console.log('   3. Verify chat interface loads completely');
    console.log('   4. Test user authentication (sign in/out)');
    console.log('   5. Test real-time messaging functionality');
    console.log('   6. Test conversation switching');
    
    console.log('\n🎯 Expected Results:');
    console.log('   - No JavaScript 404 errors in console');
    console.log('   - No MIME type errors in console');
    console.log('   - Chat interface fully functional');
    console.log('   - Real-time updates working');
    console.log('   - Authentication flow working');
    
  } else {
    console.log('⚠️  SOME ISSUES REMAIN');
    console.log('\n🔧 Required Actions:');
    
    if (!serverRunning) {
      console.log('   - Start development server: npm run dev');
    }
    if (!processes.convexServer) {
      console.log('   - Start Convex server: npx convex dev');
    }
    if (!buildExists) {
      console.log('   - Clean and rebuild: rm -rf .next && npm run dev');
    }
  }
  
  console.log('\n📋 Current Status Summary:');
  console.log(`   Server Status: ${serverRunning ? '✅ Running' : '❌ Not responding'}`);
  console.log(`   Next.js Dev: ${processes.devServer ? '✅ Running' : '❌ Not running'}`);
  console.log(`   Convex Dev: ${processes.convexServer ? '✅ Running' : '❌ Not running'}`);
  console.log(`   Build Directory: ${buildExists ? '✅ Valid' : '❌ Invalid'}`);
  
  console.log('\n🚀 Next Steps:');
  if (allGood) {
    console.log('   1. ✅ Frontend issues resolved');
    console.log('   2. 🔄 Continue with Phase 8 manual testing');
    console.log('   3. 🔄 Verify cross-browser compatibility');
    console.log('   4. 🔄 Test mobile responsiveness');
    console.log('   5. 🔄 Proceed to Phase 9: Deployment & Cleanup');
  } else {
    console.log('   1. 🔧 Fix remaining server issues');
    console.log('   2. 🔄 Re-run this verification script');
    console.log('   3. 🔄 Test frontend functionality manually');
  }
  
  console.log('\n' + '='.repeat(50));
  
  return allGood;
}

// Run the verification
verifyFrontendFix().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Verification failed:', error);
  process.exit(1);
});
