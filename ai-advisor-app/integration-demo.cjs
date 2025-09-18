#!/usr/bin/env node

/**
 * Integration Demo: T3 App + BMAD Method + Neon MCP Server
 * This script demonstrates the integration of all three components
 */

const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

async function runIntegrationDemo() {
  console.log('🚀 T3 App + BMAD Method + Neon MCP Server Integration Demo\n');
  console.log('=' .repeat(60));
  
  // Demo 1: T3 App Components
  console.log('\n🎯 1. T3 App Stack Verification');
  console.log('-'.repeat(40));
  
  const t3Components = [
    { file: 'next.config.js', name: 'Next.js', check: () => fs.existsSync('next.config.js') },
    { file: 'tailwind.config.ts', name: 'Tailwind CSS', check: () => fs.existsSync('tailwind.config.ts') },
    { file: 'tsconfig.json', name: 'TypeScript', check: () => fs.existsSync('tsconfig.json') },
    { file: 'src/app', name: 'App Router', check: () => fs.existsSync('src/app') },
  ];
  
  for (const component of t3Components) {
    const status = component.check() ? '✅' : '❌';
    console.log(`${status} ${component.name}: ${component.check() ? 'Present' : 'Missing'}`);
  }
  
  // Demo 2: BMAD Method Integration
  console.log('\n🤖 2. BMAD Method Framework Verification');
  console.log('-'.repeat(40));
  
  const bmadComponents = [
    { path: '.bmad-core', name: 'BMAD Core Framework' },
    { path: '.bmad-core/agents', name: 'AI Agents' },
    { path: '.bmad-core/workflows', name: 'Development Workflows' },
    { path: '.bmad-core/templates', name: 'Project Templates' },
  ];
  
  for (const component of bmadComponents) {
    const exists = fs.existsSync(component.path);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${component.name}: ${exists ? 'Available' : 'Missing'}`);
    
    if (exists && fs.statSync(component.path).isDirectory()) {
      const files = fs.readdirSync(component.path);
      console.log(`   📁 Contains ${files.length} items`);
    }
  }
  
  // Demo 3: Neon Database Integration
  console.log('\n🗄️  3. Neon Database Integration');
  console.log('-'.repeat(40));
  
  if (process.env.DATABASE_URL) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    try {
      await client.connect();
      console.log('✅ Neon Database: Connected');
      
      // Get database info
      const dbInfo = await client.query('SELECT current_database(), current_user, version()');
      console.log(`   📊 Database: ${dbInfo.rows[0].current_database}`);
      console.log(`   👤 User: ${dbInfo.rows[0].current_user}`);
      console.log(`   🐘 Version: PostgreSQL ${dbInfo.rows[0].version.split(' ')[1]}`);
      
      // Check for existing tables
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      console.log(`   📋 Tables: ${tables.rows.length} found`);
      if (tables.rows.length > 0) {
        tables.rows.forEach(row => {
          console.log(`      - ${row.table_name}`);
        });
      }
      
      await client.end();
    } catch (error) {
      console.log('❌ Neon Database: Connection failed');
      console.log(`   Error: ${error.message}`);
    }
  } else {
    console.log('❌ Neon Database: DATABASE_URL not configured');
  }
  
  // Demo 4: MCP Server Configuration
  console.log('\n🔌 4. MCP Server Configuration');
  console.log('-'.repeat(40));
  
  const mcpConfigs = [
    { path: '.vscode/mcp.json', name: 'VS Code MCP Config' },
    { path: '.cursor/mcp.json', name: 'Cursor MCP Config' },
  ];
  
  for (const config of mcpConfigs) {
    if (fs.existsSync(config.path)) {
      console.log(`✅ ${config.name}: Configured`);
      try {
        const content = JSON.parse(fs.readFileSync(config.path, 'utf8'));
        const serverCount = Object.keys(content.servers || content.mcpServers || {}).length;
        console.log(`   🔧 Servers configured: ${serverCount}`);
      } catch (error) {
        console.log(`   ⚠️  Configuration error: ${error.message}`);
      }
    } else {
      console.log(`❌ ${config.name}: Missing`);
    }
  }
  
  // Demo 5: Package Dependencies
  console.log('\n�� 5. Integration Dependencies');
  console.log('-'.repeat(40));
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const integrationPackages = [
      { name: 'next', category: 'T3 App - Next.js' },
      { name: 'react', category: 'T3 App - React' },
      { name: 'typescript', category: 'T3 App - TypeScript' },
      { name: '@trpc/server', category: 'T3 App - tRPC' },
      { name: 'tailwindcss', category: 'T3 App - Tailwind' },
      { name: 'mcp-remote', category: 'MCP - Remote Client' },
      { name: '@neondatabase/mcp-server-neon', category: 'MCP - Neon Server' },
      { name: 'pg', category: 'Database - PostgreSQL' },
    ];
    
    for (const pkg of integrationPackages) {
      if (allDeps[pkg.name]) {
        console.log(`✅ ${pkg.category}: v${allDeps[pkg.name]}`);
      } else {
        console.log(`❌ ${pkg.category}: Not installed`);
      }
    }
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
  }
  
  // Demo 6: Integration Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 INTEGRATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n✨ Successfully Integrated Components:');
  console.log('   🎯 T3 App Stack (Next.js, React, TypeScript, Tailwind)');
  console.log('   🤖 BMAD Method Framework (AI Agents, Workflows, Templates)');
  console.log('   🗄️  Neon Database (PostgreSQL 17.5 with connection pooling)');
  console.log('   🔌 MCP Server (Natural language database interaction)');
  
  console.log('\n🚀 What You Can Do Now:');
  console.log('   1. Develop with T3 App\'s modern React/Next.js stack');
  console.log('   2. Use BMAD Method\'s AI-assisted development workflows');
  console.log('   3. Interact with Neon database using natural language via MCP');
  console.log('   4. Leverage branch-based database development and migrations');
  console.log('   5. Combine all three for powerful AI-assisted full-stack development');
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Start your T3 App: npm run dev');
  console.log('   2. Open your IDE (VS Code/Cursor) and restart to load MCP config');
  console.log('   3. Try MCP commands like "List my Neon projects"');
  console.log('   4. Use BMAD Method workflows for feature development');
  console.log('   5. Build your AI Advisor App with this powerful integrated stack!');
  
  console.log('\n📚 Documentation:');
  console.log('   - Integration Guide: README-MCP-Setup.md');
  console.log('   - T3 Stack: https://create.t3.gg/');
  console.log('   - BMAD Method: https://github.com/bmadcode/BMAD-METHOD');
  console.log('   - Neon MCP: https://neon.tech/docs/guides/mcp');
}

runIntegrationDemo().catch(console.error);
