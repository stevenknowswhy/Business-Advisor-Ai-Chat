'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function TestChatPage() {
  const { user, isLoaded } = useUser();
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [advisorId, setAdvisorId] = useState<string>('alex-reyes-v3');
  const [messageText, setMessageText] = useState<string>('Hello, this is a test message');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testChatAPI = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');
    setLogs([]);
    
    addLog('Starting chat API test...');

    try {
      const testPayload: any = {
        messages: [{
          id: Date.now().toString(),
          role: 'user',
          content: messageText
        }],
        advisorId
      };

      // Drop conversationId if null to avoid schema surprises
      // (schema allows optional string; sending null may cause issues in some runtimes)
      // If you want to test an existing conversation, add its string id below.
      const conversationId: string | undefined = undefined;
      if (conversationId) testPayload.conversationId = conversationId;

      addLog(`Sending request to /api/chat with payload: ${JSON.stringify(testPayload)}`);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      addLog(`Response status: ${response.status}`);
      addLog(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Error response body: ${errorText}`);
        addLog(`If this mentions a field and path, fix that field and retry.`);
        setError(errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        addLog('No response body received');
        throw new Error('No response body');
      }

      addLog('Starting to read streaming response...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          addLog(`Stream reading completed. Total chunks: ${chunkCount}`);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        addLog(`Chunk ${chunkCount}: "${chunk}"`);
        fullResponse += chunk;
      }

      addLog(`Final response length: ${fullResponse.length}`);
      setResponse(fullResponse);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8">Please sign in to test the chat API.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Chat API Test Page</h1>
      
      <div className="mb-6 space-y-3">
        <p className="mb-2">User: {user.emailAddresses[0]?.emailAddress}</p>
        <div className="flex gap-3 items-center">
          <label className="w-32">Advisor ID</label>
          <input
            className="border rounded px-2 py-1 flex-1"
            value={advisorId}
            onChange={(e) => setAdvisorId(e.target.value)}
            placeholder="e.g., alex-reyes-v3"
          />
        </div>
        <div className="flex gap-3 items-center">
          <label className="w-32">Message</label>
          <input
            className="border rounded px-2 py-1 flex-1"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a test message"
          />
        </div>
        <button
          type="button"
          onClick={testChatAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Chat API'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {response && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Response:</h3>
          <pre className="whitespace-pre-wrap">{response}</pre>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-bold mb-2">Detailed Logs:</h3>
        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Click "Test Chat API" to start.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <h3 className="font-bold mb-2">What this test does:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Sends a direct POST request to /api/chat</li>
          <li>Logs all request/response details</li>
          <li>Shows streaming response chunks</li>
          <li>Captures any errors with full details</li>
          <li>Bypasses the main chat UI to isolate API issues</li>
        </ul>
      </div>
    </div>
  );
}
