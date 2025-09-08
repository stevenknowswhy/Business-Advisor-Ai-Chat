"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function ClerkTestPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const [clerkStatus, setClerkStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check Clerk initialization status
    const checkClerkStatus = () => {
      try {
        const status = {
          clerkLoaded: !!clerk,
          userLoaded: isLoaded,
          userSignedIn: isSignedIn,
          publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          clerkVersion: clerk?.version || 'unknown',
          clerkReady: clerk?.loaded || false,
          userId: user?.id || null,
          userEmail: user?.emailAddresses?.[0]?.emailAddress || null,
          sessionId: clerk?.session?.id || null,
          instanceType: clerk?.instanceType || 'unknown'
        };
        setClerkStatus(status);
        console.log("Clerk Status:", status);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error("Clerk Status Error:", err);
      }
    };

    checkClerkStatus();
    
    // Check periodically for changes
    const interval = setInterval(checkClerkStatus, 2000);
    return () => clearInterval(interval);
  }, [clerk, isLoaded, isSignedIn, user]);

  const testSignIn = async () => {
    try {
      if (clerk) {
        await clerk.openSignIn();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const testSignUp = async () => {
    try {
      if (clerk) {
        await clerk.openSignUp();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clerk Integration Test</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-red-800 font-semibold mb-2">Error Detected:</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Clerk Status */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Clerk Status</h2>
          {clerkStatus ? (
            <pre className="bg-white p-3 rounded border overflow-auto text-sm">
              {JSON.stringify(clerkStatus, null, 2)}
            </pre>
          ) : (
            <p>Loading Clerk status...</p>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Test Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testSignIn}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Sign In Modal
            </button>
            <button
              onClick={testSignUp}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Sign Up Modal
            </button>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Publishable Key:</strong> {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20)}...</p>
            <p><strong>Node ENV:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="pt-4 border-t">
          <a href="/chat" className="text-blue-600 hover:underline mr-4">
            Go to Chat
          </a>
          <a href="/test-auth" className="text-blue-600 hover:underline mr-4">
            Test Auth
          </a>
          <a href="/" className="text-blue-600 hover:underline">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
