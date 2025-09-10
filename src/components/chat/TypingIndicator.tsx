"use client";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[70%] space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">AI</span>
          </div>
        </div>

        {/* Typing Animation */}
        <div className="flex flex-col items-start">
          <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Advisor is thinking...
          </div>
        </div>
      </div>
    </div>
  );
}
