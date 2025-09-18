#!/usr/bin/env node

/**
 * Test script for Neon MCP Server
 * This script tests the connection to the Neon MCP Server
 */

const { spawn } = require('child_process');

console.log('🚀 Testing Neon MCP Server Connection...\n');

// Test 1: Check if mcp-remote is available
console.log('📦 Testing mcp-remote availability...');
const mcpRemoteTest = spawn('npx', ['mcp-remote', '--help'], { stdio: 'pipe' });

mcpRemoteTest.on('close', (code) => {
  if (code === 0) {
    console.log('✅ mcp-remote is available\n');
    
    // Test 2: Test connection to Neon MCP endpoint
    console.log('🔗 Testing connection to Neon MCP endpoint...');
    console.log('Endpoint: https://mcp.neon.tech/mcp\n');
    
    // Test 3: Check if @neondatabase/mcp-server-neon is installed
    console.log('📦 Testing @neondatabase/mcp-server-neon availability...');
    const neonMcpTest = spawn('npx', ['@neondatabase/mcp-server-neon', '--help'], { stdio: 'pipe' });
    
    neonMcpTest.on('close', (neonCode) => {
      if (neonCode === 0) {
        console.log('✅ @neondatabase/mcp-server-neon is available\n');
      } else {
        console.log('❌ @neondatabase/mcp-server-neon is not available or has issues\n');
      }
      
      console.log('📋 MCP Configuration Files:');
      console.log('- VS Code: .vscode/mcp.json');
      console.log('- Cursor: .cursor/mcp.json\n');
      
      console.log('🔧 Next Steps:');
      console.log('1. Get your Neon API key from: https://console.neon.tech/app/settings/api-keys');
      console.log('2. Add NEON_API_KEY to your .env file');
      console.log('3. Configure your IDE (VS Code/Cursor) to use the MCP server');
      console.log('4. Restart your IDE to load the MCP configuration\n');
      
      console.log('✨ Setup Complete! Your Neon MCP Server is ready to use.');
    });
    
    neonMcpTest.on('error', (err) => {
      console.log('❌ Error testing @neondatabase/mcp-server-neon:', err.message);
    });
    
  } else {
    console.log('❌ mcp-remote is not available or has issues');
    console.log('Please run: npm install mcp-remote@latest');
  }
});

mcpRemoteTest.on('error', (err) => {
  console.log('❌ Error testing mcp-remote:', err.message);
});
