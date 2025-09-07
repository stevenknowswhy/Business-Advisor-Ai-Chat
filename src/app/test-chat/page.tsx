'use client';

import { useState } from 'react';

export default function TestChatPage() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [messageText, setMessageText] = useState<string>('What are the key strategies for scaling a SaaS startup?');


  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testChatAPI = async () => {
    setLoading(true);
    setError('');
    setResponse('');
    setLogs([]);

    addLog('Starting OpenRouter API test via /api/chat-minimal...');

    try {
      const testPayload = {
        messages: [{
          id: Date.now().toString(),
          role: 'user',
          content: messageText
        }]
      };

      addLog(`Sending request to /api/chat-minimal with payload: ${JSON.stringify(testPayload)}`);

      const response = await fetch('/api/chat-minimal', {
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
        setError(errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // The /api/chat-minimal endpoint returns plain text, not streaming
      const responseText = await response.text();
      addLog(`Response received. Length: ${responseText.length} characters`);
      addLog(`Response preview: ${responseText.substring(0, 200)}...`);

      setResponse(responseText);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OpenRouter API Test Page</h1>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-bold text-blue-800 mb-2">🧪 Test Configuration</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Model:</strong> x-ai/grok-code-fast-1</li>
          <li>• <strong>Endpoint:</strong> /api/chat-minimal (no authentication required)</li>
          <li>• <strong>Purpose:</strong> Direct OpenRouter API testing</li>
        </ul>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex gap-3 items-center">
          <label className="w-32 font-medium">Test Message:</label>
          <input
            className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Enter your business question here..."
          />
        </div>
        <button
          type="button"
          onClick={testChatAPI}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? '🔄 Testing OpenRouter API...' : '🚀 Test OpenRouter API'}
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

      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-2">📋 What this test does:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Sends a direct POST request to <code className="bg-gray-200 px-1 rounded">/api/chat-minimal</code></li>
          <li>Tests OpenRouter API integration with x-ai/grok-code-fast-1 model</li>
          <li>Logs all request/response details for debugging</li>
          <li>Works without authentication (public endpoint)</li>
          <li>Bypasses the main chat UI to isolate API issues</li>
          <li>Provides comprehensive error reporting</li>
        </ul>
      </div>
    </div>
  );
}
