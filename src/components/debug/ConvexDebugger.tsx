"use client";

import { useAdvisors, useConversations } from "~/lib/convex-api";

export function ConvexDebugger() {
  const advisorsData = useAdvisors();
  const conversationsData = useConversations();

  console.log("🔍 ConvexDebugger - Advisors data:", advisorsData);
  console.log("🔍 ConvexDebugger - Conversations data:", conversationsData);

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-yellow-800 mb-2">Convex Debug Info</h3>
      <div className="text-sm text-yellow-700">
        <div className="mb-2">
          <strong>Advisors:</strong> {advisorsData === undefined ? "Loading..." : `${advisorsData?.length || 0} found`}
        </div>
        <div className="mb-2">
          <strong>Conversations:</strong> {conversationsData === undefined ? "Loading..." : `${conversationsData?.length || 0} found`}
        </div>
        {advisorsData && advisorsData.length > 0 && (
          <div className="mb-2">
            <strong>Advisor Names:</strong>
            <ul className="list-disc list-inside ml-2">
              {advisorsData.map((advisor: any, index: number) => (
                <li key={index}>{advisor.persona?.name || 'Unnamed'}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
