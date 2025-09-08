"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function TestAuthPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testChatAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { id: "test-1", role: "user", content: "Hello, this is a test message" }
          ],
          conversationId: null,
          advisorId: "alex-reyes-v3"
        }),
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: response.ok ? await response.text() : await response.text()
      };

      setApiTestResult(result);
    } catch (error) {
      setApiTestResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Loading authentication status...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="space-y-6">
        {/* Clerk Authentication Status */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Clerk Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Is Signed In:</strong> {isSignedIn ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Is Loaded:</strong> {isLoaded ? "✅ Yes" : "❌ No"}</p>
            {user && (
              <>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress || "N/A"}</p>
                <p><strong>Full Name:</strong> {user.fullName || "N/A"}</p>
                <p><strong>Image URL:</strong> {user.imageUrl || "N/A"}</p>
              </>
            )}
          </div>
        </div>

        {/* API Test Section */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Chat API Test</h2>
          <button
            onClick={testChatAPI}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Testing..." : "Test Chat API"}
          </button>

          {!isSignedIn && (
            <p className="text-orange-600 mt-2">⚠️ Testing API while signed out - expect authentication error</p>
          )}
        </div>

        {/* API Test Results */}
        {apiTestResult && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">API Test Results</h2>

            {/* Show status indicator */}
            <div className="mb-3">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                apiTestResult.status === 200 ? 'bg-green-100 text-green-800' :
                apiTestResult.status === 401 ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                Status: {apiTestResult.status} {apiTestResult.statusText}
              </span>
            </div>

            {/* Show parsed error message if available */}
            {apiTestResult.status === 401 && apiTestResult.body && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                <h3 className="font-medium text-red-800 mb-2">Authentication Error:</h3>
                <p className="text-red-700">{
                  (() => {
                    try {
                      const errorData = JSON.parse(apiTestResult.body);
                      return errorData.message || errorData.error || 'Authentication failed';
                    } catch {
                      return apiTestResult.body;
                    }
                  })()
                }</p>
              </div>
            )}

            <pre className="bg-white p-3 rounded border overflow-auto text-sm">
              {JSON.stringify(apiTestResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Navigation */}
        <div className="pt-4 border-t">
          <a href="/chat" className="text-blue-600 hover:underline mr-4">
            Go to Chat
          </a>
          <a href="/sign-in" className="text-blue-600 hover:underline mr-4">
            Sign In
          </a>
          <a href="/" className="text-blue-600 hover:underline">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
