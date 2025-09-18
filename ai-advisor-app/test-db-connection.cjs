#!/usr/bin/env node

/**
 * Test script for Neon Database Connection
 * This script tests the connection to the Neon database
 */

const { Client } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🚀 Testing Neon Database Connection...\n');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log('❌ DATABASE_URL not found in environment variables');
    console.log('Please add your Neon database connection string to .env file\n');
    return;
  }
  
  console.log('🔗 Connection String Found');
  console.log('📍 Attempting to connect to Neon database...\n');
  
  const client = new Client({
    connectionString: connectionString,
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('✅ Successfully connected to Neon database!\n');
    
    // Test query
    console.log('🔍 Running test query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    
    console.log('📊 Database Information:');
    console.log(`- Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`- Database: ${result.rows[0].current_database}`);
    console.log(`- User: ${result.rows[0].current_user}\n`);
    
    // Test table creation (optional)
    console.log('🛠️  Testing table operations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS mcp_test (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      INSERT INTO mcp_test (message) VALUES ('MCP Server Test - ${new Date().toISOString()}')
    `);
    
    const testResult = await client.query('SELECT COUNT(*) as count FROM mcp_test');
    console.log(`✅ Test table operations successful! Records: ${testResult.rows[0].count}\n`);
    
    console.log('🎉 Database connectivity test completed successfully!');
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log(`Error: ${error.message}\n`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 This might be a network connectivity issue.');
    } else if (error.code === '28P01') {
      console.log('💡 This might be an authentication issue. Check your credentials.');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist. Check your database name.');
    }
    
  } finally {
    await client.end();
  }
}

// Install dotenv if not already installed
try {
  require('dotenv');
} catch (error) {
  console.log('Installing dotenv...');
  require('child_process').execSync('npm install dotenv', { stdio: 'inherit' });
}

testDatabaseConnection().catch(console.error);
