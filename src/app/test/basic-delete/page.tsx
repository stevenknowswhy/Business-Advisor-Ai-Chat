'use client';

import { useState, useEffect } from 'react';

interface TestMessage {
  id: string;
  content: string;
  createdAt: string;
  conversationId: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export default function BasicDeleteTestPage() {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Load test messages from database
  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/basic-delete/messages');
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
        addTestResult(true, `Loaded ${data.messages?.length || 0} messages from database`);
      } else {
        addTestResult(false, `Failed to load messages: ${data.error}`, data);
      }
    } catch (error) {
      addTestResult(false, `Network error loading messages: ${error}`, error);
    }
    setLoading(false);
  };

  // Delete a specific message
  const deleteMessage = async (messageId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/basic-delete/messages/${messageId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(true, `Successfully deleted message ${messageId}`, data);
        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        addTestResult(false, `Failed to delete message ${messageId}: ${data.error}`, data);
      }
    } catch (error) {
      addTestResult(false, `Network error deleting message ${messageId}: ${error}`, error);
    }
    setLoading(false);
  };

  // Create test data
  const createTestData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/basic-delete/create-test-data', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(true, `Created test data: ${data.created} messages`, data);
        await loadMessages(); // Reload to show new data
      } else {
        addTestResult(false, `Failed to create test data: ${data.error}`, data);
      }
    } catch (error) {
      addTestResult(false, `Network error creating test data: ${error}`, error);
    }
    setLoading(false);
  };

  // Clear all test data
  const clearAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/basic-delete/clear-all', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(true, `Cleared all test data: ${data.deleted} messages deleted`, data);
        setMessages([]);
      } else {
        addTestResult(false, `Failed to clear test data: ${data.error}`, data);
      }
    } catch (error) {
      addTestResult(false, `Network error clearing test data: ${error}`, error);
    }
    setLoading(false);
  };

  const addTestResult = (success: boolean, message: string, details?: any) => {
    const result: TestResult = {
      success,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
    setTestResults(prev => [result, ...prev]);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Basic Database Deletion Test</h1>
        <p className="text-gray-600">
          Testing direct database deletion operations without authentication.
          This page tests the core database functionality in isolation.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={loadMessages}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Reload Messages'}
          </button>
          <button
            onClick={createTestData}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Create Test Data
          </button>
          <button
            onClick={clearAllData}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white border rounded-lg mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Test Messages ({messages.length})</h2>
        </div>
        <div className="p-4">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No messages found. Click "Create Test Data" to generate test messages.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{message.content}</p>
                    <p className="text-sm text-gray-500">
                      ID: {message.id} | Created: {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMessage(message.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Test Results ({testResults.length})</h2>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No test results yet.</p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                      {result.success ? '✅' : '❌'} {result.message}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer">Show Details</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
