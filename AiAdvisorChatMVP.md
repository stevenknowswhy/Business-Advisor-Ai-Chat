Amazing — here’s a minimal, ready-to-deploy repo you can paste into a terminal to scaffold the full app with Alex and Amara pre-seeded.

What you’ll get
- Next.js (App Router) + Tailwind + TypeScript
- Clerk auth (sign-in/sign-up pages included)
- Prisma + Postgres schema with seed (Alex & Amara JSON included)
- OpenRouter model routing by user plan (free/base/premium)
- SSE streaming via Vercel AI SDK
- Teams-like chat UI, advisor rail, typing indicator, @mention parsing
- Conversation persistence across sessions
- Click avatar to set active advisor; @NAME at message start also switches

One-shot bootstrap script
- Copy the entire block below, paste into a new terminal, and run. It will:
  - Create the project folder
  - Write all files
  - Install dependencies
  - Initialize Prisma
  - Seed the advisors

bash setup

```bash
#!/usr/bin/env bash
set -e

APP_NAME="advisory-board"
NODE_VERSION=$(node -v || echo "v0.0.0")
echo "Bootstrapping $APP_NAME ..."

mkdir -p "$APP_NAME"
cd "$APP_NAME"

cat > package.json << 'EOF'
{
  "name": "advisory-board",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@ai-sdk/openai": "^0.0.49",
    "@clerk/nextjs": "^6.7.0",
    "@prisma/client": "^5.16.2",
    "ai": "^3.3.30",
    "clsx": "^2.1.1",
    "framer-motion": "^11.2.12",
    "next": "14.2.5",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.11",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "prisma": "^5.16.2",
    "tailwindcss": "^3.4.9",
    "tsx": "^4.15.7",
    "typescript": "^5.5.4"
  }
}
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "preserve",
    "allowJs": false,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["@types/node"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

cat > next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};
export default nextConfig;
EOF

cat > postcss.config.mjs << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        bounce2: {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1.0)" },
        },
      },
      animation: {
        "typing-dot": "bounce2 1.4s infinite ease-in-out both",
      },
    },
  },
  plugins: []
} satisfies Config;
EOF

mkdir -p prisma/advisors
cat > prisma/schema.prisma << 'EOF'
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AdvisorStatus {
  active
  inactive
  archived
}

enum MessageSender {
  user
  advisor
  system
}

model User {
  id            String         @id             // Clerk user id
  email         String?
  name          String?
  image         String?
  plan          String         @default("free") // free | base | premium
  conversations Conversation[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Advisor {
  id            String         @id            // e.g., "alex-reyes-v3"
  schemaVersion String
  status        AdvisorStatus  @default(active)
  persona       Json
  roleDefinition Json?
  components    Json
  metadata      Json?
  localization  Json?
  modelHint     String?
  tags          String[]       @default([])
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  messages      Message[]
  memories      AdvisorMemory[]
}

model Conversation {
  id               String     @id @default(cuid())
  userId           String
  user             User       @relation(fields: [userId], references: [id])
  title            String?
  activeAdvisorId  String?
  activeAdvisor    Advisor?   @relation(fields: [activeAdvisorId], references: [id])
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  messages         Message[]
  summaries        ThreadSummary[]
}

model Message {
  id              String         @id @default(cuid())
  conversationId  String
  conversation    Conversation   @relation(fields: [conversationId], references: [id])
  sender          MessageSender
  advisorId       String?
  advisor         Advisor?       @relation(fields: [advisorId], references: [id])
  content         String
  contentJson     Json?
  mentions        String[]       @default([])
  tokensUsed      Int?
  createdAt       DateTime       @default(now())
}

model ThreadSummary {
  id              String       @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  content         String
  startMessageId  String?
  endMessageId    String?
  createdAt       DateTime     @default(now())
}

model AdvisorMemory {
  id              String       @id @default(cuid())
  conversationId  String
  advisorId       String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  advisor         Advisor      @relation(fields: [advisorId], references: [id])

  key             String
  value           Json

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@unique([conversationId, advisorId, key])
}
EOF

# Alex JSON
cat > prisma/advisors/alex-reyes-v3.json << 'EOF'
{
  "advisorId": "alex-reyes-v3",
  "advisorSchemaVersion": "1.1-base",
  "status": "active",
  "persona": {
    "name": "Alex Reyes",
    "title": "Investor Advisor",
    "oneLiner": "A seasoned investor-operator whose pattern recognition provides clear, decisive 'Yes / No / Not yet' calls on startup ideas.",
    "archetype": "The Pragmatic Investor-Operator",
    "temperament": "Radically candid, founder-empathetic, and zero-fluff. Delivers tough news with respect and ensures all feedback is actionable. His voice is warm but direct, reflecting 30+ years of seeing what actually works.",
    "coreBeliefsOrPrinciples": [
      "Intuition Leads, Experiments Decide: My gut gets my attention, your data closes the deal.",
      "Good Business vs. VC-Scale: I will always be clear when an idea is a solid business but not a fit for venture capital's return profile.",
      "Velocity is a Moat: The speed at which a team learns and ships is a key early-stage advantage.",
      "Distribution > Product (Early On): A mediocre product with a killer distribution advantage often wins."
    ],
    "bio": "Alex spent 30+ years building and investing in early-stage companies. He blends operator scars with investor pattern-recognition to help founders make fast, evidence-based calls. Expect direct feedback, clear next steps, and a deep respect for your time and runway.",
    "education": {
      "degreeLevel": "master",
      "degreeName": "MBA",
      "major": "Finance & Strategy",
      "institution": "Stanford Graduate School of Business",
      "graduationYear": 1997
    },
    "maritalStatus": "married",
    "location": {
      "city": "Palo Alto",
      "region": "CA",
      "country": "United States",
      "countryCode": "US",
      "timezone": "America/Los_Angeles"
    },
    "adviceDelivery": {
      "mode": "business-formal",
      "formality": "formal",
      "useEmojis": false,
      "voiceGuidelines": ["Radically candid", "Actionable and specific", "Fast 'No/Not Yet' beats a slow maybe"],
      "signOff": "— Alex"
    }
  },
  "roleDefinition": {
    "mission": "To help founders make the next best move by evaluating if an idea is viable, fundable, and built on a strong foundation.",
    "scope": {
      "inScope": [
        "Venture-scale opportunity assessment (Pre-seed to Series A)",
        "Evaluating team, market, and traction",
        "Go-to-Market strategy validation",
        "Investor readiness and pitch feedback"
      ],
      "outOfScope": [
        "Detailed technical architecture (Amara's role)",
        "Day-to-day UX research (Maya's role)",
        "Writing sales playbooks (Samir's role)"
      ]
    },
    "keyPerformanceIndicators": [
      {
        "metric": "Speed to Decision",
        "description": "Average time from pitch to a clear 'Yes/No/Not Yet' call, because a fast 'no' beats a slow 'maybe'.",
        "unit": "hours"
      },
      {
        "metric": "Portfolio Follow-on Rate",
        "description": "Percentage of 'Yes' decisions that go on to secure further funding, indicating sound judgment.",
        "unit": "%"
      }
    ]
  },
  "components": [
    {
      "id": "scoringEngine",
      "version": "1.0.0",
      "config": {
        "teamWeight": 0.4,
        "marketWeight": 0.3,
        "tractionWeight": 0.2,
        "ideaWeight": 0.1,
        "minimumScore": 7.5,
        "autoRejectBelow": 5.0
      }
    },
    {
      "id": "hardNoRedFlags",
      "version": "1.0.0",
      "config": {
        "strictMode": true,
        "founderRedFlags": ["uncoachable", "untrustworthy", "indecisive"],
        "marketRedFlags": ["declining", "saturated", "too_niche"]
      }
    },
    {
      "id": "pivotLibrary",
      "version": "1.0.0",
      "config": {
        "maxPivotSuggestions": 3,
        "includeRadicalPivots": true,
        "successRateThreshold": 0.15
      }
    },
    {
      "id": "intakeQuestionnaire",
      "version": "1.0.0",
      "config": {
        "maxQuestions": 12,
        "timeLimitMinutes": 15,
        "requiredSections": ["team", "market", "traction"]
      }
    },
    {
      "id": "responseProtocol",
      "version": "1.0.0",
      "config": {
        "maxResponseLength": 500,
        "includeActionItems": true,
        "tone": "direct_but_empathetic"
      }
    },
    {
      "id": "contextLens",
      "version": "1.0.0",
      "config": {
        "marketConditionsWeight": 0.3,
        "competitiveLandscapeWeight": 0.2,
        "timingRelevanceWeight": 0.5
      }
    },
    {
      "id": "investmentThesis",
      "version": "1.0.0",
      "config": {
        "thesisCategories": ["platform_shift", "behavior_change", "regulation_change"],
        "minimumConviction": 0.7
      }
    }
  ],
  "metadata": {
    "version": "1.3.0",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-02-10T12:00:00Z",
    "owner": {
      "org": "AdvisorOS",
      "contactEmail": "ops@advisoros.dev"
    },
    "tags": ["investor", "evaluation", "venture"]
  },
  "localization": {
    "defaultLanguage": "en",
    "supportedLanguages": ["en"]
  }
}
EOF

# Amara JSON
cat > prisma/advisors/amara-johnson-v2.json << 'EOF'
{
  "advisorId": "amara-johnson-v2",
  "advisorSchemaVersion": "1.1-base",
  "status": "active",
  "persona": {
    "name": "Amara Johnson",
    "title": "Chief Technology Officer",
    "oneLiner": "A pragmatic engineer who architects systems for scale while keeping the team shipping.",
    "archetype": "The Scaling Architect",
    "temperament": "Calm under pressure, deeply technical but business-aware. She thinks in systems and trade-offs, not absolutes.",
    "coreBeliefsOrPrinciples": [
      "Simple > Complex: The simplest solution that works is usually the right one.",
      "Velocity with Guardrails: Move fast, but with tests, monitoring, and clear boundaries.",
      "Team > Technology: The best tech stack is the one your team can execute well.",
      "Technical Debt is a Choice: Make conscious trade-offs, not accidental messes."
    ],
    "bio": "Amara has scaled engineering teams from 2 to 200 and systems from 100 to 10M users. She's obsessed with the intersection of technical excellence and business impact, and believes the best architecture emerges from understanding constraints.",
    "education": {
      "degreeLevel": "bachelor",
      "degreeName": "BS",
      "major": "Computer Science",
      "institution": "MIT",
      "graduationYear": 2012
    },
    "maritalStatus": "partnered",
    "location": {
      "city": "Austin",
      "region": "TX",
      "country": "United States",
      "countryCode": "US",
      "timezone": "America/Chicago"
    },
    "adviceDelivery": {
      "mode": "peer-to-peer",
      "formality": "neutral",
      "useEmojis": false,
      "voiceGuidelines": ["Practical first", "Trade-off aware", "Team-focused"],
      "signOff": "— Amara"
    }
  },
  "roleDefinition": {
    "mission": "To build technical systems that scale with the business while maintaining team velocity and system reliability.",
    "scope": {
      "inScope": [
        "Technical architecture review and recommendations",
        "Tech stack selection and justification",
        "Hiring plan and team structure",
        "Technical debt assessment and prioritization",
        "Incident response and reliability planning"
      ],
      "outOfScope": [
        "Writing production code",
        "Day-to-day team management",
        "User research (Maya's role)",
        "Fundraising strategy (Alex's role)"
      ]
    },
    "keyPerformanceIndicators": [
      {
        "metric": "Deployment Frequency",
        "description": "How often the team successfully releases to production",
        "unit": "deploys/week"
      },
      {
        "metric": "System Reliability",
        "description": "Percentage of time systems meet performance and availability targets",
        "unit": "%"
      }
    ]
  },
  "components": [
    {
      "id": "architectureReview",
      "version": "1.0.0",
      "config": {
        "scalabilityThreshold": 100000,
        "complexityPenalty": 0.3,
        "maintainabilityWeight": 0.4
      }
    },
    {
      "id": "techStackEvaluator",
      "version": "1.0.0",
      "config": {
        "communitySupportWeight": 0.2,
        "hiringEaseWeight": 0.3,
        "scalabilityWeight": 0.5
      }
    },
    {
      "id": "teamStructurePlanner",
      "version": "1.0.0",
      "config": {
        "maxTeamSize": 8,
        "specializationThreshold": 5,
        "crossFunctionalRatio": 0.3
      }
    },
    {
      "id": "technicalDebtAssessor",
      "version": "1.0.0",
      "config": {
        "debtInterestRate": 1.2,
        "paydownPriority": ["security", "reliability", "performance", "maintainability"]
      }
    },
    {
      "id": "incidentResponse",
      "version": "1.0.0",
      "config": {
        "slaLevel": "99.9",
        "maxResponseTime": 15,
        "postmortemRequired": true
      }
    }
  ],
  "metadata": {
    "version": "1.2.0",
    "createdAt": "2025-01-10T14:00:00Z",
    "updatedAt": "2025-02-15T16:45:00Z",
    "owner": {
      "org": "AdvisorOS",
      "contactEmail": "ops@advisoros.dev"
    },
    "tags": ["cto", "engineering", "architecture", "scaling"]
  },
  "localization": {
    "defaultLanguage": "en",
    "supportedLanguages": ["en"]
  }
}
EOF

cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from "@prisma/client";
import alex from "./advisors/alex-reyes-v3.json";
import amara from "./advisors/amara-johnson-v2.json";

const prisma = new PrismaClient();

function toAdvisorRow(a: any) {
  return {
    id: a.advisorId,
    schemaVersion: a.advisorSchemaVersion,
    status: a.status,
    persona: a.persona,
    roleDefinition: a.roleDefinition,
    components: a.components,
    metadata: a.metadata,
    localization: a.localization,
    modelHint: undefined,
    tags: a.metadata?.tags ?? [],
  };
}

async function main() {
  await prisma.advisor.upsert({
    where: { id: alex.advisorId },
    create: toAdvisorRow(alex),
    update: toAdvisorRow(alex),
  });
  await prisma.advisor.upsert({
    where: { id: amara.advisorId },
    create: toAdvisorRow(amara),
    update: toAdvisorRow(amara),
  });
  console.log("Seeded advisors: Alex & Amara");
}

main().finally(() => prisma.$disconnect());
EOF

mkdir -p src/app/sign-in/[[...sign-in]] src/app/sign-up/[[...sign-up]] src/app/conversations/[id] src/app/api/chat src/app/api/conversations/[id]/set-active src/server/auth src/server/llm src/server/chat src/app
cat > src/app/layout.tsx << 'EOF'
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Advisory Board",
  description: "Teams-like AI advisory board",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-zinc-50 text-zinc-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
EOF

cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

.prose p { margin: 0.25rem 0; }
EOF

cat > src/app/page.tsx << 'EOF'
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/server/db";
import { ensureUser } from "@/server/auth/requireUser";

export default async function Home() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await ensureUser(user);

  // Reuse most recent conversation or create a new one
  const existing = await prisma.conversation.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    redirect(`/conversations/${existing.id}`);
  }

  const convo = await prisma.conversation.create({
    data: { userId: user.id, title: "New advisory thread" },
  });
  redirect(`/conversations/${convo.id}`);
}
EOF

cat > src/app/sign-in/[[...sign-in]]/page.tsx << 'EOF'
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn routing="hash" />
    </div>
  );
}
EOF

cat > src/app/sign-up/[[...sign-up]]/page.tsx << 'EOF'
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp routing="hash" />
    </div>
  );
}
EOF

cat > src/app/conversations/[id]/page.tsx << 'EOF'
import { prisma } from "@/server/db";
import { currentUser } from "@clerk/nextjs/server";
import ChatClient from "./ChatClient";
import { notFound } from "next/navigation";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { activeAdvisor: true },
  });
  if (!conversation || conversation.userId !== user.id) return notFound();

  const advisors = await prisma.advisor.findMany();
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return (
    <ChatClient
      conversationId={conversation.id}
      advisors={advisors.map(a => ({
        id: a.id,
        name: (a.persona as any).name || a.id
      }))}
      initialMessages={messages.map(m => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        advisorId: m.advisorId
      }))}
      activeAdvisorId={conversation.activeAdvisorId || undefined}
    />
  );
}
EOF

cat > src/app/conversations/[id]/ChatClient.tsx << 'EOF'
"use client";
import { useChat } from "ai/react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

type M = { id: string; sender: "user"|"advisor"|"system"; content: string; advisorId?: string | null };

export default function ChatClient({
  conversationId,
  advisors,
  initialMessages,
  activeAdvisorId,
}: {
  conversationId: string;
  advisors: { id: string; name: string }[];
  initialMessages: M[];
  activeAdvisorId?: string;
}) {
  const { messages, input, setInput, append, isLoading } = useChat({
    api: "/api/chat",
    body: { conversationId },
    initialMessages: initialMessages.map(m => ({
      id: m.id,
      role: m.sender === "user" ? "user" : m.sender === "advisor" ? "assistant" : "system",
      content: m.content,
    })),
  });

  const [active, setActive] = useState<string | undefined>(activeAdvisorId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const setActiveAdvisor = async (id: string) => {
    setActive(id);
    await fetch(`/api/conversations/${conversationId}/set-active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advisorId: id }),
    });
  };

  const initials = (name: string) => name.split(" ").map(p => p[0]).join("").slice(0,2);

  const onSend = async (text: string) => {
    await append({ role: "user", content: text });
  };

  const activeName = advisors.find(a => a.id === active)?.name ?? "Advisor";

  return (
    <div className="flex h-screen">
      <aside className="w-20 bg-zinc-900 text-white flex flex-col items-center py-3 gap-3">
        {advisors.map(a => (
          <button
            key={a.id}
            onClick={() => setActiveAdvisor(a.id)}
            className={clsx(
              "rounded-full h-12 w-12 flex items-center justify-center transition ring-offset-2",
              active === a.id ? "ring-2 ring-sky-400" : "opacity-80 hover:opacity-100"
            )}
            title={a.name}
          >
            <span className="text-sm font-semibold">{initials(a.name)}</span>
          </button>
        ))}
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-white flex items-center px-4 gap-3">
          <div className="text-sm text-zinc-600">Active advisor:</div>
          <div className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-sm border border-sky-200">
            {activeName}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <motion.div
              key={m.id ?? idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "max-w-[70%] p-3 rounded-xl shadow-sm",
                m.role === "user" ? "bg-sky-50 self-end" : "bg-white border self-start"
              )}
            >
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">{m.content}</div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="self-start">
              <TypingIndicator name={activeName} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t bg-white p-3">
          <textarea
            className="w-full h-24 resize-none border rounded-md p-2"
            placeholder={`Message @${advisors[0]?.name?.split(" ")[0]} ...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const t = input.trim();
                if (t) onSend(t);
              }
            }}
          />
          <div className="text-xs text-zinc-500 mt-1">Tip: start your message with @Name to switch advisors.</div>
        </div>
      </main>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-zinc-500">
      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-typing-dot [animation-delay:-0.32s]"></span>
      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-typing-dot [animation-delay:-0.16s]"></span>
      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-typing-dot"></span>
      <span className="ml-2">{name} is typing…</span>
    </div>
  );
}
EOF

cat > src/app/api/chat/route.ts << 'EOF'
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/requireUser";
import { openrouter } from "@/server/llm/openrouter";
import { pickModel } from "@/server/llm/model-router";
import { buildAdvisorPrompt } from "@/server/llm/prompt";
import { parseMentions } from "@/server/chat/mentions";
import { streamText, toAIStreamResponse } from "ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const { conversationId, messages: _, text } = body as {
    conversationId: string;
    text: string;
  };

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { activeAdvisor: true },
  });
  if (!convo || convo.userId !== user.id) return new Response("Not found", { status: 404 });

  const advisors = await prisma.advisor.findMany();
  const advisorNameList = advisors.map(a => ({
    id: a.id,
    name: (a.persona as any)?.name ?? a.id,
  }));

  const { mentions, startsWithSwitch } = parseMentions({ text, advisors: advisorNameList });

  let activeAdvisorId = convo.activeAdvisorId ?? advisors[0]?.id;
  if (startsWithSwitch) activeAdvisorId = startsWithSwitch;

  if (activeAdvisorId !== convo.activeAdvisorId) {
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { activeAdvisorId },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      sender: "user",
      content: text,
      mentions,
    },
  });

  const recent = await prisma.message.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  const summaries = await prisma.threadSummary.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  const activeAdvisor = advisors.find(a => a.id === activeAdvisorId)!;
  const { system, history, appendSignOff } = buildAdvisorPrompt({
    advisor: activeAdvisor,
    messages: recent,
    summaries,
  });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const modelName = pickModel({ user: dbUser!, advisor: activeAdvisor });

  const result = await streamText({
    model: openrouter(modelName),
    system,
    messages: history,
    temperature: 0.3,
    onFinish: async ({ text, usage }) => {
      const final = appendSignOff(text);
      await prisma.message.create({
        data: {
          conversationId: convo.id,
          sender: "advisor",
          advisorId: activeAdvisor.id,
          content: final,
          contentJson: { usage },
          tokensUsed: usage?.totalTokens ?? undefined,
        },
      });
    },
  });

  return toAIStreamResponse(result.toAIStream());
}
EOF

cat > src/app/api/conversations/[id]/set-active/route.ts << 'EOF'
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/requireUser";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const body = await req.json();
  const { advisorId } = body as { advisorId: string };

  const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!convo || convo.userId !== user.id) return new Response("Not found", { status: 404 });

  const advisor = await prisma.advisor.findUnique({ where: { id: advisorId } });
  if (!advisor) return new Response("Advisor not found", { status: 404 });

  await prisma.conversation.update({
    where: { id: params.id },
    data: { activeAdvisorId: advisorId },
  });

  return new Response("OK");
}
EOF

cat > src/server/db.ts << 'EOF'
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
EOF

cat > src/server/auth/requireUser.ts << 'EOF'
import { prisma } from "@/server/db";
import { currentUser } from "@clerk/nextjs/server";

export async function ensureUser(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress ?? null,
      name: user.fullName ?? null,
      image: user.imageUrl ?? null,
      plan: (user.publicMetadata as any)?.plan ?? "free",
    },
    update: {
      email: user.emailAddresses?.[0]?.emailAddress ?? null,
      name: user.fullName ?? null,
      image: user.imageUrl ?? null,
      plan: (user.publicMetadata as any)?.plan ?? "free",
    },
  });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated");
  await ensureUser(user);
  return user;
}
EOF

cat > src/server/llm/openrouter.ts << 'EOF'
import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
    "X-Title": "Advisor Board",
  },
});
EOF

cat > src/server/llm/model-router.ts << 'EOF'
import { Advisor, User } from "@prisma/client";

const envOr = (k: string, fallback: string) => (process.env[k] && process.env[k]!.trim()) || fallback;

const DEFAULTS = {
  free: envOr("OPENROUTER_FREE_MODEL", "google/gemini-flash-1.5"),
  base: envOr("OPENROUTER_BASE_MODEL", "openai/gpt-4o-mini"),
  premium: envOr("OPENROUTER_PREMIUM_MODEL", "anthropic/claude-3.5-sonnet"),
};

export function pickModel({ user, advisor }: { user: Pick<User, "plan">; advisor: Pick<Advisor, "modelHint"> }) {
  const tier = (user.plan ?? "free") as "free" | "base" | "premium";
  const hinted = advisor.modelHint;
  if (tier === "premium") return hinted || DEFAULTS.premium;
  if (tier === "base") return hinted || DEFAULTS.base;
  return hinted || DEFAULTS.free;
}
EOF

cat > src/server/llm/prompt.ts << 'EOF'
import { Advisor, Message, ThreadSummary } from "@prisma/client";

type BuildArgs = {
  advisor: Advisor;
  messages: Message[];
  summaries: ThreadSummary[];
};

export function buildAdvisorPrompt({ advisor, messages, summaries }: BuildArgs) {
  const p: any = advisor.persona;
  const role: any = advisor.roleDefinition ?? {};
  const components: any[] = advisor.components as any[];
  const responseProtocol = components.find(c => c.id === "responseProtocol")?.config ?? {};
  const signOff = p?.adviceDelivery?.signOff ? `\n${p.adviceDelivery.signOff}` : "";

  const system = [
    `You are ${p.name}, ${p.title}. Archetype: ${p.archetype}.`,
    `Temperament: ${p.temperament}`,
    `Core beliefs: ${(p.coreBeliefsOrPrinciples ?? []).join(" | ")}`,
    role?.mission ? `Mission: ${role.mission}` : "",
    `Scope guardrails: Respect your role and stay within it.`,
    `Response protocol: maxLength=${responseProtocol.maxResponseLength ?? 500}, includeActionItems=${responseProtocol.includeActionItems ?? true}, tone=${responseProtocol.tone ?? "practical"}.`,
    `If you are Alex Reyes, make a clear 'Yes / No / Not yet' judgment when evaluating ideas.`,
    `If you are Amara Johnson, focus on trade-offs and pragmatic, scalable solutions.`,
  ].filter(Boolean).join("\n");

  const history = [
    ...summaries.map(s => ({ role: "system" as const, content: `Summary: ${s.content}` })),
    ...messages.map(m => {
      if (m.sender === "user") return { role: "user" as const, content: m.content };
      if (m.sender === "advisor") return { role: "assistant" as const, content: m.content };
      return { role: "system" as const, content: m.content };
    }),
  ];

  const appendSignOff = (text: string) => (signOff ? text + signOff : text);
  return { system, history, appendSignOff };
}
EOF

cat > src/server/chat/mentions.ts << 'EOF'
export function parseMentions({
  text,
  advisors,
}: {
  text: string;
  advisors: { id: string; name: string }[];
}): { mentions: string[]; startsWithSwitch?: string } {
  const nameToId = new Map<string, string>();
  for (const a of advisors) {
    const full = a.name.toLowerCase();
    const first = full.split(/\s+/)[0];
    const init = a.name.split(" ").map(p => p[0]).join("").toLowerCase();
    nameToId.set(full, a.id);
    nameToId.set(first, a.id);
    nameToId.set(init, a.id);
    nameToId.set(a.id.toLowerCase(), a.id);
  }

  const mentions: string[] = [];
  const regex = /@([A-Za-z0-9\-\_\.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const key = m[1].toLowerCase();
    const id = nameToId.get(key);
    if (id && !mentions.includes(id)) mentions.push(id);
  }

  let startsWithSwitch: string | undefined;
  const trimmed = text.trim();
  if (trimmed.startsWith("@")) {
    const head = trimmed.slice(1).split(/\s+/)[0].toLowerCase();
    const id = nameToId.get(head);
    if (id) startsWithSwitch = id;
  }

  return { mentions, startsWithSwitch };
}
EOF

cat > src/middleware.ts << 'EOF'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/conversations(.*)",
  "/api(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
};
EOF

cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB"

# OpenRouter
OPENROUTER_API_KEY="sk-or-..."
APP_URL="http://localhost:3000"
OPENROUTER_FREE_MODEL="google/gemini-flash-1.5"
OPENROUTER_BASE_MODEL="openai/gpt-4o-mini"
OPENROUTER_PREMIUM_MODEL="anthropic/claude-3.5-sonnet"

# Clerk
CLERK_SECRET_KEY=""
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
EOF

cat > README.md << 'EOF'
# Advisory Board (Minimal)

Next.js + Tailwind + Prisma + Clerk + OpenRouter + Vercel AI SDK.
- Multiple advisors (Alex & Amara seeded)
- Teams-like chat UI with advisor switching
- @mentions parsing (start message with @Name to switch)
- SSE streaming responses
- Tiered models by plan: free | base | premium (from Clerk publicMetadata.plan)

## Setup

1) Copy .env.example to .env.local and fill:
- DATABASE_URL (Neon/Supabase/Postgres)
- OPENROUTER_API_KEY (from openrouter.ai)
- APP_URL (http://localhost:3000 in dev; your Vercel URL in prod)
- Clerk: CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

2) Install deps
pnpm install

3) Init DB + seed
pnpm db:push
pnpm db:seed

4) Dev
pnpm dev

5) Deploy
- Push to GitHub
- Import in Vercel, set env vars
- Ensure /api routes run on Node (default). Streaming works out of the box.

## Plans
Set Clerk publicMetadata.plan to "free" | "base" | "premium" for a user to control model tiering.

EOF

echo "Installing dependencies..."
pnpm install

echo "Pushing schema..."
pnpm db:push

echo "Seeding..."
pnpm db:seed

echo "Done! Next steps:
1) cp .env.example .env.local and fill values
2) pnpm dev
3) Open http://localhost:3000
"
```

Environment variables to set (Vercel → Project Settings → Environment Variables)
- DATABASE_URL: your Postgres connection string (Neon/Supabase)
- OPENROUTER_API_KEY: from openrouter.ai
- APP_URL: your domain (e.g., http://localhost:3000 in dev, https://your-app.vercel.app in prod)
- CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: from Clerk

What’s included
- Conversation persistence: stored in Postgres; returns to most recent thread on login
- User-directed advisor control: click avatar or start message with @Name
- @mentions parsing: server-side (robust matching on full name, first name, initials, id)
- Typing indicators + animated message bubbles
- Persona-aware prompting: action items, tone, Alex’s Yes/No/Not Yet, Amara’s trade-offs
- Tiered models via OpenRouter based on Clerk user plan

Want me to extend this with:
- Conversation list sidebar + “New chat”
- Summarizer job and per-advisor memory examples
- Admin UI to upload new advisor JSON
- BMAD install + starter PRD/Architecture docs

Say the word and I’ll generate the add-ons.