/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

// Mock Clerk useUser/useAuth for auth transitions + token readiness
jest.mock("@clerk/nextjs", () => {
  let userState = { isLoaded: true, isSignedIn: true, user: { id: "u_1" } } as any;
  const useUser = () => userState;
  (useUser as any).__setState = (s: any) => (userState = { ...userState, ...s });
  const useAuth = () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: async () => "test-token",
  });
  const SignOutButton = ({ children }: any) => <div data-testid="signout">{children}</div>;
  return { useUser, useAuth, SignOutButton };
});

// Mock Convex hooks used by the authenticated component so rendering doesn't hit Convex
jest.mock("~/lib/convex-api", () => ({
  useAdvisors: () => [],
  useConversations: () => [],
  useConversation: () => null,
  useTypingUsers: () => [],
  useCreateConversation: () => jest.fn(),
  useSetTypingStatus: () => jest.fn(),
  useUpdateUserPresence: () => jest.fn(),
  useCurrentUser: () => ({ _id: 'u_convex_1' }),
  transformAdvisorForClient: (a: any) => a,
  transformConversationForClient: (c: any) => c,
}));

import { ConvexChatInterface } from "~/components/chat/ConvexChatInterface";

describe("ConvexChatInterface wrapper", () => {
  it("renders the authenticated chat UI without hook order violations when signed in", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = createRoot(container);

    // Render should not throw
    await act(async () => {
      root.render(<ConvexChatInterface />);
    });

    // Allow effects (auth transition -> hasBeenAuthenticated) to flush
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(container.textContent || "").toContain("Chat Interface Ready!");
  });
});

