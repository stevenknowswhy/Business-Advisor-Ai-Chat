# Minimal Advisory Board App for Vercel Deployment

I'll create a minimal repository with the essential files and pre-seeded advisors for immediate Vercel deployment. Here's the complete structure:

## File Structure
```
advisory-board-app/
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── advisors/
│   │   │   │   └── route.ts
│   │   │   ├── chat/
│   │   │   │   └── route.ts
│   │   │   └── ai/
│   │   │       └── response/
│   │   │           └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── chat-interface.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── advisor-manager.ts
│   │   └── ai-service.ts
│   └── types/
│       └── index.ts
└── tsconfig.json
```

## Key Files

### 1. package.json
```json
{
  "name": "advisory-board-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "@prisma/client": "^5.6.0",
    "prisma": "^5.6.0",
    "zod": "^3.22.4",
    "@clerk/nextjs": "^4.29.4",
    "ai": "^2.2.29",
    "openai": "^4.20.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.0.1"
  }
}
```

### 2. prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Advisor {
  id          String   @id @default(cuid())
  advisorId   String   @unique
  name        String
  title       String
  avatar      String?
  persona     Json
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Message {
  id          String   @id @default(cuid())
  content     String
  senderId    String
  senderType  String   // "user" or "advisor"
  chatSession String
  createdAt   DateTime @default(now())
  mentions    String[]
}
```

### 3. prisma/seed.ts
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Alex Reyes persona
  const alexReyes = {
    advisorId: "alex-reyes-v3",
    name: "Alex Reyes",
    title: "Investor Advisor",
    avatar: null,
    persona: {
      advisorId: "alex-reyes-v3",
      advisorSchemaVersion: "1.1-base",
      status: "active",
      persona: {
        name: "Alex Reyes",
        title: "Investor Advisor",
        oneLiner: "A seasoned investor-operator whose pattern recognition provides clear, decisive 'Yes / No / Not yet' calls on startup ideas.",
        archetype: "The Pragmatic Investor-Operator",
        temperament: "Radically candid, founder-empathetic, and zero-fluff. Delivers tough news with respect and ensures all feedback is actionable. His voice is warm but direct, reflecting 30+ years of seeing what actually works.",
        coreBeliefsOrPrinciples: [
          "Intuition Leads, Experiments Decide: My gut gets my attention, your data closes the deal.",
          "Good Business vs. VC-Scale: I will always be clear when an idea is a solid business but not a fit for venture capital's return profile.",
          "Velocity is a Moat: The speed at which a team learns and ships is a key early-stage advantage.",
          "Distribution > Product (Early On): A mediocre product with a killer distribution advantage often wins."
        ],
        bio: "Alex spent 30+ years building and investing in early-stage companies. He blends operator scars with investor pattern-recognition to help founders make fast, evidence-based calls. Expect direct feedback, clear next steps, and a deep respect for your time and runway.",
        education: {
          degreeLevel: "master",
          degreeName: "MBA",
          major: "Finance & Strategy",
          institution: "Stanford Graduate School of Business",
          graduationYear: 1997
        },
        maritalStatus: "married",
        location: {
          city: "Palo Alto",
          region: "CA",
          country: "United States",
          countryCode: "US",
          timezone: "America/Los_Angeles"
        },
        adviceDelivery: {
          mode: "business-formal",
          formality: "formal",
          useEmojis: false,
          voiceGuidelines: ["Radically candid", "Actionable and specific", "Fast 'No/Not Yet' beats a slow maybe"],
          signOff: "— Alex"
        }
      },
      roleDefinition: {
        mission: "To help founders make the next best move by evaluating if an idea is viable, fundable, and built on a strong foundation.",
        scope: {
          inScope: [
            "Venture-scale opportunity assessment (Pre-seed to Series A)",
            "Evaluating team, market, and traction",
            "Go-to-Market strategy validation",
            "Investor readiness and pitch feedback"
          ],
          outOfScope: [
            "Detailed technical architecture (Amara's role)",
            "Day-to-day UX research (Maya's role)",
            "Writing sales playbooks (Samir's role)"
          ]
        },
        keyPerformanceIndicators: [
          {
            metric: "Speed to Decision",
            description: "Average time from pitch to a clear 'Yes/No/Not Yet' call, because a fast 'no' beats a slow 'maybe'.",
            unit: "hours"
          },
          {
            metric: "Portfolio Follow-on Rate",
            description: "Percentage of 'Yes' decisions that go on to secure further funding, indicating sound judgment.",
            unit: "%"
          }
        ]
      },
      components: [
        {
          id: "scoringEngine",
          version: "1.0.0",
          config: {
            teamWeight: 0.4,
            marketWeight: 0.3,
            tractionWeight: 0.2,
            ideaWeight: 0.1,
            minimumScore: 7.5,
            autoRejectBelow: 5.0
          }
        },
        {
          id: "hardNoRedFlags",
          version: "1.0.0",
          config: {
            strictMode: true,
            founderRedFlags: ["uncoachable", "untrustworthy", "indecisive"],
            marketRedFlags: ["declining", "saturated", "too_niche"]
          }
        }
      ],
      metadata: {
        version: "1.3.0",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-02-10T12:00:00Z",
        owner: {
          org: "AdvisorOS",
          contactEmail: "ops@advisoros.dev"
        },
        tags: ["investor", "evaluation", "venture"]
      },
      localization: {
        defaultLanguage: "en",
        supportedLanguages: ["en"]
      }
    }
  }

  // Amara Johnson persona
  const amaraJohnson = {
    advisorId: "amara-johnson-v2",
    name: "Amara Johnson",
    title: "Chief Technology Officer",
    avatar: null,
    persona: {
      advisorId: "amara-johnson-v2",
      advisorSchemaVersion: "1.1-base",
      status: "active",
      persona: {
        name: "Amara Johnson",
        title: "Chief Technology Officer",
        oneLiner: "A pragmatic engineer who architects systems for scale while keeping the team shipping.",
        archetype: "The Scaling Architect",
        temperament: "Calm under pressure, deeply technical but business-aware. She thinks in systems and trade-offs, not absolutes.",
        coreBeliefsOrPrinciples: [
          "Simple > Complex: The simplest solution that works is usually the right one.",
          "Velocity with Guardrails: Move fast, but with tests, monitoring, and clear boundaries.",
          "Team > Technology: The best tech stack is the one your team can execute well.",
          "Technical Debt is a Choice: Make conscious trade-offs, not accidental messes."
        ],
        bio: "Amara has scaled engineering teams from 2 to 200 and systems from 100 to 10M users. She's obsessed with the intersection of technical excellence and business impact, and believes the best architecture emerges from understanding constraints.",
        education: {
          degreeLevel: "bachelor",
          degreeName: "BS",
          major: "Computer Science",
          institution: "MIT",
          graduationYear: 2012
        },
        maritalStatus: "partnered",
        location: {
          city: "Austin",
          region: "TX",
          country: "United States",
          countryCode: "US",
          timezone: "America/Chicago"
        },
        adviceDelivery: {
          mode: "peer-to-peer",
          formality: "neutral",
          useEmojis: false,
          voiceGuidelines: ["Practical first", "Trade-off aware", "Team-focused"],
          signOff: "— Amara"
        }
      },
      roleDefinition: {
        mission: "To build technical systems that scale with the business while maintaining team velocity and system reliability.",
        scope: {
          inScope: [
            "Technical architecture review and recommendations",
            "Tech stack selection and justification",
            "Hiring plan and team structure",
            "Technical debt assessment and prioritization",
            "Incident response and reliability planning"
          ],
          outOfScope: [
            "Writing production code",
            "Day-to-day team management",
            "User research (Maya's role)",
            "Fundraising strategy (Alex's role)"
          ]
        },
        keyPerformanceIndicators: [
          {
            metric: "Deployment Frequency",
            description: "How often the team successfully releases to production",
            unit: "deploys/week"
          },
          {
            metric: "System Reliability",
            description: "Percentage of time systems meet performance and availability targets",
            unit: "%"
          }
        ]
      },
      components: [
        {
          id: "architectureReview",
          version: "1.0.0",
          config: {
            scalabilityThreshold: 100000,
            complexityPenalty: 0.3,
            maintainabilityWeight: 0.4
          }
        },
        {
          id: "techStackEvaluator",
          version: "1.0.0",
          config: {
            communitySupportWeight: 0.2,
            hiringEaseWeight: 0.3,
            scalabilityWeight: 0.5
          }
        }
      ],
      metadata: {
        version: "1.2.0",
        createdAt: "2025-01-10T14:00:00Z",
        updatedAt: "2025-02-15T16:45:00Z",
        owner: {
          org: "AdvisorOS",
          contactEmail: "ops@advisoros.dev"
        },
        tags: ["cto", "engineering", "architecture", "scaling"]
      },
      localization: {
        defaultLanguage: "en",
        supportedLanguages: ["en"]
      }
    }
  }

  // Create advisors if they don't exist
  await prisma.advisor.upsert({
    where: { advisorId: alexReyes.advisorId },
    update: alexReyes,
    create: alexReyes
  })

  await prisma.advisor.upsert({
    where: { advisorId: amaraJohnson.advisorId },
    update: amaraJohnson,
    create: amaraJohnson
  })

  console.log('Seeded advisors')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### 4. src/lib/prisma.ts
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 5. src/app/api/advisors/route.ts
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const advisors = await prisma.advisor.findMany()
    return NextResponse.json({ advisors })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch advisors' }, { status: 500 })
  }
}
```

### 6. src/app/page.tsx
```tsx
'use client'

import { useEffect, useState } from 'react'
import ChatInterface from '@/components/chat-interface'
import { Advisor } from '@prisma/client'

export default function Home() {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [activeAdvisor, setActiveAdvisor] = useState<Advisor | null>(null)
  const [chatSessionId] = useState(() => `session_${Date.now()}`)

  useEffect(() => {
    const fetchAdvisors = async () => {
      const response = await fetch('/api/advisors')
      const data = await response.json()
      setAdvisors(data.advisors)
      if (data.advisors.length > 0) {
        setActiveAdvisor(data.advisors[0])
      }
    }

    fetchAdvisors()
  }, [])

  const handleAdvisorSelect = (advisor: Advisor) => {
    setActiveAdvisor(advisor)
  }

  return (
    <main>
      <ChatInterface
        advisors={advisors}
        activeAdvisor={activeAdvisor}
        onAdvisorSelect={handleAdvisorSelect}
        chatSessionId={chatSessionId}
      />
    </main>
  )
}
```

### 7. .env.local
```bash
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY="your_openrouter_api_key_here"
```

### 8. next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
```

## Deployment Instructions

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up the database: `npx prisma db push`
4. Seed the database: `npx prisma db seed`
5. Add your OpenRouter API key to `.env.local`
6. Deploy to Vercel: `vercel --prod`

This minimal implementation includes:
- Pre-seeded advisors (Alex Reyes and Amara Johnson)
- SQLite database (for simplicity, switch to PostgreSQL for production)
- Basic chat interface with advisor selection
- API routes for advisors and chat
- OpenRouter integration setup

Note: For production use, you'll want to:
1. Replace SQLite with a production database like PostgreSQL
2. Add proper authentication with Clerk
3. Implement the full AI response generation
4. Add proper error handling and loading states
5. Enhance the UI with better styling and animations