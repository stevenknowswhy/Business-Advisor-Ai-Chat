import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { TRPCReactProvider } from "~/trpc/react";
import { ConvexClientProvider } from "~/providers/ConvexProvider";
import { ErrorBoundary } from "~/components/common/ErrorBoundary";

export const metadata: Metadata = {
  title: "AI Advisor Chat",
  description: "Your personal board of AI advisors",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable}`}>
        <body>
          <ConvexClientProvider>
            <TRPCReactProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </TRPCReactProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
