"use client";

import type { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

// Create the Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  // With ConvexProviderWithClerk, token handling is automatic using Clerk's getToken({ template: "convex" })
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
