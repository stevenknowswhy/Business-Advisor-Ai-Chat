'use client';

import { useEffect, useState } from 'react';
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

interface TestConversation {
  id: string;
  title?: string | null;
  createdAt: string;
}

export default function ConversationDeleteTestPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConv, setCurrentConv] = useState<TestConversation | null>(null);
  const [myConversations, setMyConversations] = useState<TestConversation[]>([]);

  const addResult = (success: boolean, message: string, details?: any) => {
    setResults(prev => [
      { success, message, details, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  };

  const createTestConversation = async () => {
    if (!isSignedIn) {
      addResult(false, 'Must be signed in to create test data');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/test/conversation-delete/create-data', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCurrentConv({ id: data.conversation.id, title: data.conversation.title, createdAt: data.conversation.createdAt });
        addResult(true, `Created test conversation ${data.conversation.id}`, data);
      } else {
        addResult(false, `Failed to create test conversation: ${data.error}`, data);
      }
    } catch (e) {
      addResult(false, 'Network error creating test conversation', e);
    } finally {
      setLoading(false);
    }
  };


  const deleteConversationCascade = async () => {
    if (!isSignedIn) {
      addResult(false, 'Must be signed in to delete (cascade)');
      return;
    }
    if (!currentConv?.id) {
      addResult(false, 'No current test conversation to delete (cascade)');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/test/conversation-delete/cascade/${currentConv.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        addResult(true, `Cascade-deleted conversation ${currentConv.id}`, data);
        setCurrentConv(null);
        await listMyTests();
      } else {
        addResult(false, `Cascade deletion failed: ${data.error}`, data);
      }
    } catch (e) {
      addResult(false, 'Network error deleting conversation (cascade)', e);
    } finally {
      setLoading(false);
    }
  };

    if (!isSignedIn) {
      addResult(false, 'Must be signed in to delete');
      return;
    }
    if (!currentConv?.id) {
      addResult(false, 'No current test conversation to delete');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/test/conversation-delete/conversations/${currentConv.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        addResult(true, `Deleted conversation ${currentConv.id} with transaction`, data);
        // Clear current selection to avoid repeated delete attempts on same ID
        setCurrentConv(null);
        // Refresh list after deletion
        await listMyTests();
      } else {
        addResult(false, `Deletion failed: ${data.error}`, data);
      }
    } catch (e) {
      addResult(false, 'Network error deleting conversation', e);
    } finally {
      setLoading(false);
    }
  };

  const verifyDeletion = async () => {
    if (!currentConv?.id) {
      addResult(false, 'No conversation ID to verify');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/test/conversation-delete/verify/${currentConv.id}`);
      const data = await res.json();
      if (res.ok) {
        const { exists, counts } = data;
        const ok = !exists && counts.messages === 0 && counts.summaries === 0 && counts.memories === 0;
        addResult(ok, ok ? 'Verification passed: No orphaned records remain' : 'Verification failed: Records still exist', data);
      } else {
        addResult(false, `Verification failed: ${data.error}`, data);
      }
    } catch (e) {
      addResult(false, 'Network error during verification', e);
    } finally {
      setLoading(false);
    }
  };

  const listMyTests = async () => {
    if (!isSignedIn) {
      addResult(false, 'Must be signed in to list test data');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/test/conversation-delete/list');
      const data = await res.json();
      if (res.ok) {
        setMyConversations(data.conversations || []);
        addResult(true, `Loaded ${data.conversations?.length || 0} test conversation(s)`, data);
      } else {
        addResult(false, `Failed to load test conversations: ${data.error}`, data);
      }
    } catch (e) {
      addResult(false, 'Network error loading test conversations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      listMyTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Conversation Deletion Test (Transactional)</h1>
        <p className="text-gray-600">Validate full deletion of conversations with dependent records using a transaction.</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        {isSignedIn ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 font-medium">✅ Signed In</p>
              <p className="text-sm text-gray-600">User: {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}</p>
              <p className="text-sm text-gray-600">ID: {user?.id}</p>
            </div>
            <SignOutButton>
              <button type="button" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Sign Out</button>
            </SignOutButton>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 font-medium">❌ Not Signed In</p>
              <p className="text-sm text-gray-600">Please sign in to run the test</p>
            </div>
            <SignInButton>
              <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Sign In</button>
            </SignInButton>
          </div>
        )}
      </div>

      {isSignedIn && (
        <div className="bg-white border rounded-lg mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Controls</h2>
            <p className="text-sm text-gray-600">Current Test Conversation: {currentConv?.id || 'None'}</p>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            <button type="button" onClick={createTestConversation} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Create Test Conversation</button>
            <button type="button" onClick={deleteConversationTransaction} disabled={loading || !currentConv} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">Delete Conversation (Transactional)</button>
            <button type="button" onClick={deleteConversationCascade} disabled={loading || !currentConv} className="px-4 py-2 bg-orange-600 text-white rounded disabled:opacity-50">Delete via Cascade (Single)</button>
            <button type="button" onClick={verifyDeletion} disabled={loading || !currentConv} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Verify Deletion</button>
            <button type="button" onClick={listMyTests} disabled={loading} className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50">List My Test Conversations</button>
          </div>

          <div className="p-4">
            {myConversations.length === 0 ? (
              <p className="text-gray-500">No test conversations found for your account.</p>
            ) : (
              <div className="space-y-2">
                {myConversations.map(c => (
                  <div key={c.id} className="border rounded p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.title || '(untitled)'} <span className="text-xs text-gray-400">{c.id}</span></p>
                      <p className="text-xs text-gray-500">Created: {new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentConv(c)} className="px-3 py-1 bg-blue-600 text-white rounded">Use</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Test Results ({results.length})</h2>
        </div>
        <div className="p-4 max-h-[28rem] overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">No test results yet.</p>
          ) : (
            <div className="space-y-2">
              {results.map((r, idx) => (
                <div key={idx} className={`p-3 rounded border-l-4 ${r.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={r.success ? 'text-green-800' : 'text-red-800'}>
                      {r.success ? '✅' : '❌'} {r.message}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {r.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer">Details</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(r.details, null, 2)}</pre>
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
