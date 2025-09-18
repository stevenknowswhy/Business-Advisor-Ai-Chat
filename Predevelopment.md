Awesome — locking in your choices and moving to build mode.

What we’re implementing
- Provider: OpenRouter with tiered models (free/base/premium) by user plan
- DB: Prisma (Postgres)
- Realtime: SSE via Vercel AI SDK
- Hosting: Vercel (Node runtime for streaming route)
- Auth: Clerk (instead of NextAuth)
- UX: Typing indicators, @mentions parsing, polished UI/animations
- Persistence: Conversations persist across sessions

Install + scaffold
- Create T3 app (skip NextAuth in the CLI)
pnpm create t3-app@latest advisory-board
cd advisory-board
pnpm add ai @ai-sdk/openai zod @tanstack/react-query @trpc/server @trpc/client superjson
pnpm add @clerk/nextjs
pnpm add prisma @prisma/client
pnpm add framer-motion clsx
pnpm add -D prisma

Environment variables
- Add to .env (Vercel → Project Settings → Environment Variables)
DATABASE_URL=postgres://...
OPENROUTER_API_KEY=...
APP_URL=https://your-app.vercel.app

CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# Model tiering (override as you like)
OPENROUTER_FREE_MODEL=google/gemini-flash-1.5
OPENROUTER_BASE_MODEL=openai/gpt-4o-mini
OPENROUTER_PREMIUM_MODEL=anthropic/claude-3.5-sonnet

Prisma schema (with Clerk-aware User)
prisma/schema.prisma
```prisma
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
  // Use Clerk userId
  id            String         @id
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
  persona       Json           // persona block
  components    Json           // components block
  metadata      Json?
  localization  Json?
  modelHint     String?        // e.g., "anthropic/claude-3.5-sonnet"
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
  mentions        String[]       @default([]) // advisor ids in text
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
```

Initialize DB and seed advisors
- npx prisma db push

prisma/seed.ts
```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import alexJson from "./advisors/alex-reyes-v3.json";
import amaraJson from "./advisors/amara-johnson-v2.json";

function toAdvisorRow(a: any) {
  return {
    id: a.advisorId,
    schemaVersion: a.advisorSchemaVersion,
    status: a.status,
    persona: a.persona,
    components: a.components,
    metadata: a.metadata,
    localization: a.localization,
    modelHint: undefined, // set per-advisor if desired
    tags: a.metadata?.tags ?? [],
  };
}

async function main() {
  await prisma.advisor.upsert({
    where: { id: alexJson.advisorId },
    create: toAdvisorRow(alexJson),
    update: toAdvisorRow(alexJson),
  });
  await prisma.advisor.upsert({
    where: { id: amaraJson.advisorId },
    create: toAdvisorRow(amaraJson),
    update: toAdvisorRow(amaraJson),
  });
  console.log("Seeded: Alex & Amara");
}

main().finally(() => prisma.$disconnect());
```
- package.json: "prisma": { "seed": "ts-node prisma/seed.ts" }
- pnpm prisma db seed

Clerk setup
src/middleware.ts
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/conversations(.*)",
  "/api/chat",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!_next|public|.*\\..*).*)"],
};
```

src/app/layout.tsx
```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-zinc-50">{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

Prisma client and Clerk user sync
src/server/db.ts
```ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

src/server/auth/sync-user.ts
```ts
import { prisma } from "../db";
import { currentUser } from "@clerk/nextjs/server";

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthenticated");
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
  return user;
}
```

OpenRouter provider + model tiering
src/server/llm/openrouter.ts
```ts
import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
    "X-Title": "Advisor Board",
  },
});
```

src/server/llm/model-router.ts
```ts
import { Advisor, User } from "@prisma/client";

const envModel = (name: string, fallback: string) =>
  process.env[name] && process.env[name]!.trim().length > 0
    ? process.env[name]!
    : fallback;

// Defaults; override via env
const DEFAULTS = {
  free: envModel("OPENROUTER_FREE_MODEL", "google/gemini-flash-1.5"),
  base: envModel("OPENROUTER_BASE_MODEL", "openai/gpt-4o-mini"),
  premium: envModel("OPENROUTER_PREMIUM_MODEL", "anthropic/claude-3.5-sonnet"),
};

export function pickModel({
  user,
  advisor,
}: { user: Pick<User, "plan">; advisor: Pick<Advisor, "modelHint"> }) {
  const tier = (user.plan ?? "free") as "free" | "base" | "premium";
  // If the advisor hints a model and user has sufficient tier, respect it
  const hinted = advisor.modelHint;
  if (hinted) {
    if (tier === "premium") return hinted;
    if (tier === "base" && hinted === DEFAULTS.premium) return DEFAULTS.base;
  }
  if (tier === "premium") return DEFAULTS.premium;
  if (tier === "base") return DEFAULTS.base;
  return DEFAULTS.free;
}
```

@mentions parsing utility
src/server/chat/mentions.ts
```ts
export type MentionParse = {
  mentions: string[];         // advisor ids
  startsWithSwitch: string?;  // advisor id if message begins with @NAME
};

export function parseMentions({
  text,
  advisors,
}: {
  text: string;
  advisors: { id: string; name: string }[];
}): MentionParse {
  const nameToId = new Map(
    advisors.flatMap(a => {
      const name = a.name;
      const parts = name.toLowerCase().split(/\s+/);
      const short = parts[0]; // "Alex"
      const init = parts.map(p => p[0]).join(""); // "AR"
      return [
        [name.toLowerCase(), a.id],
        [short, a.id],
        [init.toLowerCase(), a.id],
        [a.id.toLowerCase(), a.id],
      ] as [string, string][];
    }),
  );

  const mentions: string[] = [];
  const regex = /@([A-Za-z0-9\-\_\.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[1].toLowerCase();
    const id = nameToId.get(raw);
    if (id && !mentions.includes(id)) mentions.push(id);
  }

  let startsWithSwitch: string | undefined;
  const trimmed = text.trim();
  const leading = trimmed.startsWith("@") ? trimmed.slice(1).split(/\s+/)[0]?.toLowerCase() : null;
  if (leading) {
    const id = nameToId.get(leading);
    if (id) startsWithSwitch = id;
  }
  return { mentions, startsWithSwitch };
}
```

Persona-aware prompt
src/server/llm/prompt.ts
```ts
import { Advisor, Message, ThreadSummary } from "@prisma/client";

type BuildArgs = {
  advisor: Advisor;
  messages: Message[];
  summaries: ThreadSummary[];
};

export function buildAdvisorPrompt({ advisor, messages, summaries }: BuildArgs) {
  const p: any = advisor.persona;
  const components: any[] = advisor.components as any[];
  const responseProtocol = components.find(c => c.id === "responseProtocol")?.config ?? {};
  const signOff = p?.adviceDelivery?.signOff ? `\n${p.adviceDelivery.signOff}` : "";

  const system = [
    `You are ${p.name}, ${p.title}. Archetype: ${p.archetype}.`,
    `Temperament: ${p.temperament}`,
    `Core beliefs: ${(p.coreBeliefsOrPrinciples ?? []).join(" | ")}`,
    `Scope guardrails: Respect your role and stay within it.`,
    `Response protocol: maxLength=${responseProtocol.maxResponseLength ?? 500}, includeActionItems=${responseProtocol.includeActionItems ?? true}, tone=${responseProtocol.tone ?? "practical"}.`,
    `If you are Alex Reyes, make a clear 'Yes / No / Not yet' judgment when evaluating ideas.`,
    `If you are Amara Johnson, focus on trade-offs and pragmatic, scalable solutions.`,
  ].join("\n");

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
```

Streaming chat route (SSE with Vercel AI SDK, Node runtime)
src/app/api/chat/route.ts
```ts
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/sync-user";
import { openrouter } from "@/server/llm/openrouter";
import { pickModel } from "@/server/llm/model-router";
import { buildAdvisorPrompt } from "@/server/llm/prompt";
import { parseMentions } from "@/server/chat/mentions";
import { streamText, toAIStreamResponse } from "ai";

// Important: Prisma needs Node runtime
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const { conversationId, text } = body as { conversationId: string; text: string };

  // Ensure conversation belongs to user
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

  // Parse mentions + possible switch
  const { mentions, startsWithSwitch } = parseMentions({ text, advisors: advisorNameList });

  // Switch active advisor if message begins with @NAME
  const activeAdvisorId = startsWithWith(startsWithSwitch, convo.activeAdvisorId) ?? (convo.activeAdvisorId ?? advisors[0]?.id);
  function startsWithWith(next: string | undefined, current?: string | null) {
    return next ? next : current ?? undefined;
  }

  if (activeAdvisorId !== convo.activeAdvisorId) {
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { activeAdvisorId },
    });
  }

  // Store user message
  const userMsg = await prisma.message.create({
    data: {
      conversationId: convo.id,
      sender: "user",
      content: text,
      mentions,
    },
  });

  // Build context
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

  // Pick model by user plan and advisor hint
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const modelName = pickModel({ user: dbUser!, advisor: activeAdvisor });

  // Stream from OpenRouter
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
      // Optional: summarize thread every N messages
    },
  });

  return toAIStreamResponse(result.toAIStream());
}
```

Client Chat UI with SSE, Clerk, mentions, typing indicator
- Layout: advisor rail, conversation list, transcript, composer
- useChat from ai/react streams token-by-token

src/app/conversations/[id]/page.tsx
```tsx
import { prisma } from "@/server/db";
import { currentUser } from "@clerk/nextjs/server";
import ChatClient from "./ChatClient";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { activeAdvisor: true },
  });
  if (!conversation || conversation.userId !== user.id) {
    // Optionally create a new conversation and redirect
    return <div className="p-6">Conversation not found.</div>;
  }

  const advisors = await prisma.advisor.findMany();
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 200, // initial load
  });

  return (
    <ChatClient
      conversationId={conversation.id}
      advisors={advisors.map(a => ({
        id: a.id,
        name: (a.persona as any).name,
      }))}
      initialMessages={messages}
      activeAdvisorId={conversation.activeAdvisorId ?? undefined}
    />
  );
}
```

src/app/conversations/[id]/ChatClient.tsx
```tsx
"use client";
import { useState, useMemo } from "react";
import { useChat } from "ai/react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function ChatClient({
  conversationId,
  advisors,
  initialMessages,
  activeAdvisorId,
}: {
  conversationId: string;
  advisors: { id: string; name: string }[];
  initialMessages: { id: string; sender: "user" | "advisor" | "system"; content: string; advisorId?: string | null }[];
  activeAdvisorId?: string;
}) {
  const { messages, input, setInput, isLoading, append } = useChat({
    api: "/api/chat",
    body: { conversationId },
    initialMessages: initialMessages.map(m => ({
      id: m.id,
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    })),
  });

  const [active, setActive] = useState<string | undefined>(activeAdvisorId);

  const onSend = async (text: string) => {
    await append({ role: "user", content: text });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Advisors rail */}
      <aside className="w-20 bg-zinc-900 text-white flex flex-col items-center py-3 gap-3">
        {advisors.map(a => {
          const initials = a.name.split(" ").map(p => p[0]).join("").slice(0, 2);
          return (
            <button
              key={a.id}
              onClick={() => setActive(a.id)}
              className={clsx("rounded-full h-12 w-12 flex items-center justify-center",
                active === a.id ? "ring-2 ring-sky-400" : "opacity-80 hover:opacity-100")}
              title={a.name}
            >
              <span className="text-sm font-semibold">{initials}</span>
            </button>
          );
        })}
      </aside>

      {/* Transcript */}
      <main className="flex-1 flex flex-col">
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
              <div className="prose prose-sm max-w-none">
                {m.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="self-start">
              <TypingIndicator name={advisors.find(a => a.id === active)?.name ?? "Advisor"} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t bg-white p-3">
          <textarea
            className="w-full h-20 resize-none border rounded-md p-2"
            placeholder={`Message @${advisors[0]?.name?.split(" ")[0]}...`}
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
        </div>
      </main>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-zinc-500">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
      </div>
      <span>{name} is typing…</span>
    </div>
  );
}
```

Creating and listing conversations (persistence across sessions)
- New conversation on first visit, or show a list

src/app/page.tsx (simple: auto-create and redirect)
```tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/server/db";

export default async function Home() {
  const user = await currentUser();
  if (!user) return null;

  const convo = await prisma.conversation.create({
    data: { userId: user.id, title: "New advisory thread" },
  });
  redirect(`/conversations/${convo.id}`);
}
```

Mentions: handled server-side in the chat route. If you also want client autocompletion, reuse your earlier Composer component or add a light dropdown when typing “@”.

UX improvements checklist
- Message bubbles: framer-motion fade/slide in (done)
- Typing indicator: animated dots (done)
- Active advisor ring highlight in rail (done)
- Smooth scroll to bottom on new messages (add a ref and scrollIntoView)
- Markdown rendering: add react-markdown if you want
- Advisor headers: show advisor name above assistant messages

Seed advisors using your JSON
- Place your two JSON persona files in prisma/advisors/ named exactly as shown
- pnpm prisma db seed

Notes and constraints
- Running on Vercel: keep the chat route on Node runtime (Prisma + Postgres). If you want Edge, consider Drizzle + Neon HTTP driver; we can switch later.
- Tiering: We read plan from Prisma’s User.plan, which we keep in sync with Clerk publicMetadata.plan. Change a user’s plan in Clerk dashboard under Public Metadata (e.g., { "plan": "premium" }).
- User-directed only: The server never auto-hands-off between advisors. Switching requires starting a message with @NAME or clicking the avatar (we store on conversation.activeAdvisorId). We can add AI-directed handoffs later by letting models emit a special tag, e.g., <handoff to="amara-johnson-v2" reason="..." />, and having the server honor it.

Optional follow-ups I can add next
- Admin screen to add/edit advisors from JSON
- Summarizer job for long threads
- Rate limiting + per-plan usage caps
- File uploads + per-advisor RAG
- BMAD integration (npx bmad-method install) and provide the initial PRD + Architecture docs via the planning agents
