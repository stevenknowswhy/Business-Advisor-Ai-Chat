'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs';

interface AuthTestMessage {
  id: string;
  content: string;
  createdAt: string;
  conversationId: string;
  userId: string;
  sender: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export default function AuthDeleteTestPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [messages, setMessages] = useState<AuthTestMessage[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's messages from database
  const loadUserMessages = async () => {
    if (!isSignedIn) {
      addTestResult(false, "Cannot load messages: User not signed in");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test/auth-delete/messages');
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
        addTestResult(true, `Loaded ${data.messages?.length || 0} user messages from database`);
      } else {
        addTestResult(false, `Failed to load user messages: ${data.error}`, data);
      }
    } catch (error) {
      addTestResult(false, `Network error loading user messages: ${error}`, error);
    }
    setLoading(false);
  };

  // Delete a specific message (with authentication)
  const deleteUserMessage = async (messageId: string) => {
    if (!isSignedIn) {
      addTestResult(false, "Cannot delete message: User not signed in");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/test/auth-delete/messages/${messageId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(true, `Successfully deleted user message ${messageId}`, data);
        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        addTestResult(false, `Failed to delete user message ${messageId}: ${data.error}`, data);
      }
    } catch (error) {
      addTestResult(false, `Network error deleting user message ${messageId}: ${error}`, error);
    }
    setLoading(false);
  };

  // Create test data for the authenticated user
  const createUserTestData = async () => {
    if (!isSignedIn) {
      addTestResult(false, "Cannot create test data: User not signed in");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test/auth-delete/create-user-data', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(true, `Created user test data: ${data.created} messages`, data);
        await loadUserMessages(); // Reload to show new data
      } else {
        addTestResult(false, `Failed to create user test data: ${data.error}`, data);
      }
    } catch (error) {
      addTestResult(false, `Network error creating user test data: ${error}`, error);
    }
    setLoading(false);
  };

  // Clear user's test data
  const clearUserData = async () => {
    if (!isSignedIn) {
      addTestResult(false, "Cannot clear data: User not signed in");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test/auth-delete/clear-user-data', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(true, `Cleared user test data: ${data.deleted} messages deleted`, data);
        setMessages([]);
      } else {
        addTestResult(false, `Failed to clear user test data: ${data.error}`, data);
      }
    } catch (error) {
      addTestResult(false, `Network error clearing user test data: ${error}`, error);
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
    if (isSignedIn) {
      loadUserMessages();
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Authenticated Database Deletion Test</h1>
        <p className="text-gray-600">
          Testing authenticated database deletion operations with user authorization.
          This page tests the complete authentication → authorization → deletion flow.
        </p>
      </div>

      {/* Authentication Status */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        {isSignedIn ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 font-medium">✅ Signed In</p>
              <p className="text-sm text-gray-600">
                User: {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}
              </p>
              <p className="text-sm text-gray-600">ID: {user?.id}</p>
            </div>
            <SignOutButton>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 font-medium">❌ Not Signed In</p>
              <p className="text-sm text-gray-600">Please sign in to test authenticated deletion</p>
            </div>
            <SignInButton>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Sign In
              </button>
            </SignInButton>
          </div>
        )}
      </div>

      {isSignedIn && (
        <>
          {/* Control Panel */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={loadUserMessages}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Reload My Messages'}
              </button>
              <button
                onClick={createUserTestData}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Create My Test Data
              </button>
              <button
                onClick={clearUserData}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                Clear My Data
              </button>
            </div>
          </div>

          {/* User Messages List */}
          <div className="bg-white border rounded-lg mb-6">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">My Messages ({messages.length})</h2>
              <p className="text-sm text-gray-600">Only messages belonging to your user account</p>
            </div>
            <div className="p-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No messages found. Click "Create My Test Data" to generate test messages for your account.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{message.content}</p>
                        <p className="text-sm text-gray-500">
                          ID: {message.id} | Sender: {message.sender} | Created: {new Date(message.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          User ID: {message.userId} | Conversation: {message.conversationId}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteUserMessage(message.id)}
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
        </>
      )}

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
