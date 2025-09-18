import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Advisor Chat - Your Personal AI Advisory Board",
  description: "Get expert advice from specialized AI advisors. From investment strategies to technical architecture, our AI advisory board provides professional insights tailored to your needs.",
  keywords: ["AI advisor", "business advice", "investment advice", "technical consulting", "AI chat"],
  authors: [{ name: "AI Advisor Team" }],
  openGraph: {
    title: "AI Advisor Chat - Your Personal AI Advisory Board",
    description: "Get expert advice from specialized AI advisors. Professional insights at your fingertips.",
    url: "https://ai-advisor-chat.com",
    siteName: "AI Advisor Chat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Advisor Chat",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Advisor Chat - Your Personal AI Advisory Board",
    description: "Get expert advice from specialized AI advisors. Professional insights at your fingertips.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-white">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
