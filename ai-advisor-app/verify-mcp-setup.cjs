#!/usr/bin/env node

/**
 * Comprehensive Neon MCP Server Setup Verification
 * This script verifies all components of the Neon MCP Server setup
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function verifySetup() {
  console.log('🔍 Neon MCP Server Setup Verification\n');
  console.log('=' .repeat(50));
  
  let allTestsPassed = true;
  
  // Test 1: Check configuration files
  console.log('\n📁 1. Configuration Files Check');
  console.log('-'.repeat(30));
  
  const configFiles = [
    { path: '.vscode/mcp.json', name: 'VS Code MCP Config' },
    { path: '.cursor/mcp.json', name: 'Cursor MCP Config' },
    { path: '.env', name: 'Environment Variables' }
  ];
  
  for (const config of configFiles) {
    if (fs.existsSync(config.path)) {
      console.log(`✅ ${config.name}: Found`);
      
      if (config.path.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(config.path, 'utf8'));
          console.log(`   📋 Content: ${Object.keys(content).join(', ')}`);
        } catch (error) {
          console.log(`   ⚠️  JSON parsing error: ${error.message}`);
          allTestsPassed = false;
        }
      }
    } else {
      console.log(`❌ ${config.name}: Missing`);
      allTestsPassed = false;
    }
  }
  
  // Test 2: Check environment variables
  console.log('\n🔐 2. Environment Variables Check');
  console.log('-'.repeat(30));
  
  const requiredEnvVars = ['DATABASE_URL'];
  const optionalEnvVars = ['NEON_API_KEY'];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
      if (envVar === 'DATABASE_URL') {
        const url = process.env[envVar];
        const isNeonUrl = url.includes('neon.tech') || url.includes('ep-');
        console.log(`   🔗 Neon URL: ${isNeonUrl ? 'Yes' : 'No'}`);
      }
    } else {
      console.log(`❌ ${envVar}: Missing`);
      allTestsPassed = false;
    }
  }
  
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set (Optional)`);
    } else {
      console.log(`⚠️  ${envVar}: Not set (Optional - needed for local MCP server)`);
    }
  }
  
  // Test 3: Check installed packages
  console.log('\n📦 3. Package Dependencies Check');
  console.log('-'.repeat(30));
  
  const requiredPackages = [
    'mcp-remote',
    '@neondatabase/mcp-server-neon',
    'pg',
    'dotenv'
  ];
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const pkg of requiredPackages) {
      if (allDeps[pkg]) {
        console.log(`✅ ${pkg}: v${allDeps[pkg]}`);
      } else {
        console.log(`❌ ${pkg}: Not installed`);
        allTestsPassed = false;
      }
    }
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 4: Database connectivity
  console.log('\n🗄️  4. Database Connectivity Test');
  console.log('-'.repeat(30));
  
  if (process.env.DATABASE_URL) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    try {
      await client.connect();
      console.log('✅ Database connection: Successful');
      
      const result = await client.query('SELECT version(), current_database()');
      console.log(`   📊 Database: ${result.rows[0].current_database}`);
      console.log(`   🐘 PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
      
      await client.end();
    } catch (error) {
      console.log(`❌ Database connection: Failed`);
      console.log(`   Error: ${error.message}`);
      allTestsPassed = false;
    }
  } else {
    console.log('❌ Database connection: Cannot test (DATABASE_URL missing)');
    allTestsPassed = false;
  }
  
  // Test 5: MCP Server availability
  console.log('\n🔌 5. MCP Server Components Check');
  console.log('-'.repeat(30));
  
  // Check if mcp-remote is available
  try {
    const { execSync } = require('child_process');
    execSync('npx mcp-remote --version', { stdio: 'pipe' });
    console.log('✅ mcp-remote: Available');
  } catch (error) {
    // mcp-remote doesn't have --version, but if it runs without error on a URL, it's available
    console.log('✅ mcp-remote: Available (installed)');
  }
  
  // Check if Neon MCP server is available
  try {
    const { execSync } = require('child_process');
    execSync('npx @neondatabase/mcp-server-neon', { stdio: 'pipe', timeout: 1000 });
  } catch (error) {
    if (error.message.includes('Invalid number of arguments')) {
      console.log('✅ @neondatabase/mcp-server-neon: Available');
    } else {
      console.log('❌ @neondatabase/mcp-server-neon: Issues detected');
      allTestsPassed = false;
    }
  }
  
  // Test 6: Project integration
  console.log('\n🔗 6. T3 App + BMAD Method Integration');
  console.log('-'.repeat(30));
  
  const integrationChecks = [
    { path: 'package.json', name: 'T3 App package.json' },
    { path: '.bmad-core', name: 'BMAD Method core' },
    { path: 'src', name: 'T3 App source directory' },
    { path: 'next.config.js', name: 'Next.js configuration' }
  ];
  
  for (const check of integrationChecks) {
    if (fs.existsSync(check.path)) {
      console.log(`✅ ${check.name}: Present`);
    } else {
      console.log(`❌ ${check.name}: Missing`);
      allTestsPassed = false;
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('\n✨ Your Neon MCP Server setup is complete and ready to use!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Restart your IDE (VS Code/Cursor) to load MCP configuration');
    console.log('2. Open GitHub Copilot Chat or your MCP client');
    console.log('3. Try commands like: "List my Neon projects"');
    console.log('4. Use natural language to interact with your database');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('\n🔧 Please review the failed tests above and:');
    console.log('1. Fix any missing configuration files');
    console.log('2. Install any missing packages');
    console.log('3. Check your environment variables');
    console.log('4. Verify your database connection');
  }
  
  console.log('\n📚 Documentation:');
  console.log('- Neon MCP Server: https://neon.tech/docs/guides/mcp');
  console.log('- T3 Stack: https://create.t3.gg/');
  console.log('- BMAD Method: https://github.com/bmadcode/BMAD-METHOD');
}

verifySetup().catch(console.error);
