#!/usr/bin/env node

// Test script for the chat API

async function testChatAPI() {
  const url = process.argv[2] || 'http://localhost:3001';
  const apiUrl = `${url}/api/chat`;
  
  console.log(`Testing chat API at: ${apiUrl}`);
  
  const testMessage = {
    messages: [
      {
        role: "user",
        content: "Hello, can you help me with business strategy?",
        id: "test-1"
      }
    ],
    conversationId: "test-conversation",
    advisorId: "alex-reyes"
  };
  
  try {
    console.log('Sending request:', JSON.stringify(testMessage, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper authentication
      },
      body: JSON.stringify(testMessage)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('Response body:', responseText);
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testChatAPI();
