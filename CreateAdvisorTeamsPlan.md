We're embarking on a **powerful, user-centric upgrade** — turning advisor creation from a hidden, technical chore into an intuitive, one-click team-empowering experience. Below is a **comprehensive implementation roadmap**, aligned with your 3 goals and the T3 stack architecture, that transforms your app into a flexible, robust system primed for “one-click team” functionality.

---

## ✅ GOAL 1: Make Adding/Creating Advisors Easier

### 🚀 Solution: Replace Raw JSON Modal with a Guided Advisor Wizard + Templates

#### ➤ Step 1: Build `AdvisorWizardDialog` (React Component)
Located at: `src/features/advisors/components/AdvisorWizardDialog.tsx`

```tsx
// Uses React Hook Form + Zod + Steps
const steps = [
  { id: 'identity', label: 'Who Are They?' },
  { id: 'expertise', label: 'What Do They Know?' },
  { id: 'behavior', label: 'How Do They Advise?' },
  { id: 'preview', label: 'Preview & Save' }
];
```

Each step renders tailored inputs:

- **Identity**: Name, Title, Avatar Upload, Description
- **Expertise**: Multi-select specialties, personality traits, tags (with chips UI)
- **Behavior**: Mission, Scope (in/out), KPIs, Advice Style (dropdown: coach → propose → refine), Voice Tone
- **Preview**: Live-rendered card + sample prompt test + copyable/exportable JSON

> 💡 Use `react-hook-form` with `zodResolver` per step. Debounced live validation.

---

#### ➤ Step 2: Add Templates System

Create preset templates in:  
`src/shared/advisor-templates/startup-squad.ts`  
`src/shared/advisor-templates/life-coach-team.ts`  
`src/shared/advisor-templates/college-prep-team.ts`

Each exports an array of advisor configs:

```ts
// startup-squad.ts
export const StartupSquadTemplates = [
  {
    id: "visionary",
    name: "The Visionary",
    title: "Big-Picture Strategist",
    description: "Optimistic, product-obsessed. Asks: 'Does this change the game?'",
    tags: ["strategy", "innovation", "product"],
    roleDefinition: {
      mission: "Ensure every idea disrupts the market and creates user love.",
      scope: {
        inScope: ["market positioning", "long-term vision"],
        outOfScope: ["budgeting", "daily ops"]
      }
    },
    adviceDelivery: {
      mode: "coach → propose → refine",
      formality: "casual",
      voiceGuidelines: ["enthusiastic", "visionary tone"]
    }
  },
  // ... Analyst, Operator, Skeptic, Storyteller
];
```

> ✨ In wizard Step 1, add:  
> _“Start from Template → [Startup Squad] [Life Coach Team] [College Prep Team]”_  
> Selecting auto-fills all fields + enables “Customize Further”.

---

#### ➤ Step 3: One-Click Team Creation Button

Add to Projects Tab & Marketplace:

```tsx
// In ProjectsPage.tsx or MarketplacePage.tsx
<Button onClick={() => openWizard({ template: 'startup-squad' })}>
  🚀 Add Startup Squad (5 Advisors)
</Button>
```

When clicked → opens wizard in “bulk mode”:

- Shows checklist of 5 advisors
- User can toggle which to include
- Optional: Customize names/titles per advisor before creation
- Submit → loops through selected, calls Convex action for each

> ⚙️ Behind the scenes:  
> ```ts
> const upload = useAction(api.advisors.uploadAdvisorJSON);
> for (const advisor of selectedAdvisors) {
>   await upload({ advisor });
> }
> ```

---

## ✅ GOAL 2: Robust, Flexible, Future-Proof System

### 🧱 Architecture Upgrade

#### ➤ Fix Backend Wiring (Immediate)

Implement missing route:  
`src/app/api/advisors/route.ts`

```ts
import { NextRequest } from "next/server";
import { api } from "~/convex/_generated/api";
import { server } from "~/convex/_generated/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jsonConfiguration, firstName, lastName, title, image } = body;

  // Parse & enrich
  let advisorJson;
  try {
    advisorJson = JSON.parse(jsonConfiguration);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ensure persona fallback
  if (!advisorJson.persona) {
    advisorJson.persona = { name: `${firstName} ${lastName}`, title };
  }

  // Call Convex
  try {
    const result = await server.api.advisors.uploadAdvisorJSON({ advisor: advisorJson });
    if (!result.ok) throw new Error(result.error);
    return Response.json({ success: true, advisorId: result.advisorId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

> ✅ Now legacy modal works temporarily while you build wizard.

---

#### ➤ Shared Zod Schema (Frontend + Backend Validation)

Create: `src/features/advisors/forms/schemas.ts`

```ts
import { z } from "zod";

export const AdvisorPersonaSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  expertise: z.array(z.string()).optional(),
});

export const AdvisorRoleSchema = z.object({
  mission: z.string().optional(),
  scope: z.object({
    inScope: z.array(z.string()).optional(),
    outOfScope: z.array(z.string()).optional(),
  }).optional(),
  KPIs: z.array(z.string()).optional(),
});

export const AdvisorSchema = z.object({
  persona: AdvisorPersonaSchema,
  roleDefinition: AdvisorRoleSchema.optional(),
  adviceDelivery: z.object({
    mode: z.string().optional(),
    formality: z.enum(["formal", "casual"]).optional(),
    voiceGuidelines: z.array(z.string()).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  localization: z.record(z.string()).optional(),
});
```

> 🔁 Reuse same schema in Convex action for server-side validation.

---

#### ➤ Live JSON Preview + Export/Import

In wizard preview step:

```tsx
// Derive from form state
const advisorJson = useMemo(() => assembleAdvisorFromForm(getValues()), [getValues()]);

// Validate & display
const validationResult = AdvisorSchema.safeParse(advisorJson);

return (
  <div>
    <SyntaxHighlighter language="json">
      {JSON.stringify(advisorJson, null, 2)}
    </SyntaxHighlighter>
    <Button onClick={() => navigator.clipboard.writeText(JSON.stringify(advisorJson))}>
      📋 Copy Config
    </Button>
    <input type="file" onChange={handleImport} accept=".json" />
  </div>
);
```

> ✅ Users can export, share, import, or paste configs later.

---

## ✅ GOAL 3: Roadmap Ready — One-Click Teams

### 🎯 Implementation Strategy

#### ➤ Team Preset Loader

Create util: `src/features/advisors/utils/loadTeamPreset.ts`

```ts
import { StartupSquadTemplates } from "~/shared/advisor-templates/startup-squad";
import { LifeCoachTeamTemplates } from "~/shared/advisor-templates/life-coach-team";
import { CollegePrepTeamTemplates } from "~/shared/advisor-templates/college-prep-team";

export const loadTeamPreset = (teamKey: string) => {
  switch (teamKey) {
    case 'startup-squad': return StartupSquadTemplates;
    case 'life-coach-team': return LifeCoachTeamTemplates;
    case 'college-prep-team': return CollegePrepTeamTemplates;
    default: return [];
  }
};
```

#### ➤ Bulk Creation Hook

`src/features/advisors/hooks/useBulkCreateAdvisors.ts`

```ts
import { useAction } from "convex/react";
import { api } from "~/convex/_generated/api";

export const useBulkCreateAdvisors = () => {
  const upload = useAction(api.advisors.uploadAdvisorJSON);

  const createTeam = async (advisors: any[]) => {
    const results = [];
    for (const advisor of advisors) {
      const res = await upload({ advisor });
      results.push(res);
    }
    return results;
  };

  return { createTeam };
};
```

#### ➤ UX Flow for “Add Entire Team”

1. User clicks “Add Startup Squad”
2. Modal opens showing 5 avatars + checkboxes + optional rename fields
3. User unchecks any they don’t want
4. Clicks “Create Selected Advisors (4/5)”
5. Progress bar appears → Success toast → Advisors appear in sidebar

> 🧩 Bonus: After creation, auto-create a new Project named “My Startup Squad Workspace” and assign all 5 advisors to it.

---

## 🧭 Navigation & Discoverability Fixes

### ➤ Add CTAs Everywhere

- **Projects Tab Header**: “+ New Advisor” / “+ Add Team”
- **Marketplace Page**: “Create Your Own Advisor” button next to search
- **Empty State**: If no advisors, show illustration + “Get started by adding your first advisor or team!”

---

## ♿ Accessibility & Polish

- ✅ All steps have `aria-labelledby`, errors use `aria-describedby`
- ✅ Keyboard navigation between steps (Tab/Enter)
- ✅ Auto-save draft to `localStorage` every 30s (`useEffect` + `JSON.stringify`)
- ✅ Toast notifications on success/error
- ✅ Loading states during Convex mutations

---

## 🧪 Testing Plan

| Test Type       | What to Test                                                                 |
|-----------------|------------------------------------------------------------------------------|
| Unit            | `jsonMapping.ts` – form ↔ JSON conversion                                    |
| Integration     | Wizard submit → calls Convex → returns ID/error                              |
| E2E (Playwright)| Click “Add Startup Squad” → 5 advisors created → appear in project sidebar   |
| Accessibility   | Axe-core scan, keyboard nav, screen reader test on wizard                    |

---

## 🗺️ Future Roadmap (Post-Launch)

1. **Team Collaboration**: Invite others to co-manage advisor teams
2. **Versioning**: Edit & version advisor configs (like GitHub commits)
3. **Community Templates**: Share/publish your advisor configs publicly
4. **AI-Assisted Creation**: “Describe the advisor you want → we generate the config”
5. **Mobile Optimization**: Swipeable wizard steps, responsive card previews

---

## 🏁 Summary: What to Build Now

✅ **Short-Term Wins**

1. Implement `/api/advisors POST` route → unblocks current modal
2. Add “Create Advisor” button in Projects tab
3. Build `AdvisorWizardDialog` with 4-step flow + Zod validation
4. Add template selector (Startup Squad, Life Coach, College Prep)
5. Add “Add Entire Team” bulk creation flow
6. Add live JSON preview + export/import

✅ **Tech Debt Resolved**

- No more 404s on advisor creation
- Convex actions properly wired
- Validation consistent front-to-back
- Entry points visible and intuitive

✅ **User Delight**

- Non-technical users can now create powerful advisors
- One-click teams accelerate onboarding
- Templates reduce friction + increase quality
- Preview/test before saving builds confidence

---

## 🛠 Sample Commit Plan

```bash
feat(advisors): implement POST /api/advisors route
feat(ui): add Create Advisor button to Projects tab
feat(wizard): build AdvisorWizardDialog with RHF + Zod
feat(templates): add startup/life/college advisor presets
feat(bulk): support one-click team creation
feat(preview): live JSON + avatar preview in wizard
feat(accessibility): WCAG AA compliance for wizard
test: add unit + e2e tests for advisor creation
```

---

By implementing this plan, you’ll transform advisor creation from a broken, hidden feature into a **flagship, user-empowering system** — perfectly setting up your app for viral growth via “teams” and community sharing.

You're embarking on a **powerful, user-centric upgrade** — turning advisor creation from a hidden, technical chore into an intuitive, one-click team-empowering experience. Below is a **comprehensive implementation roadmap**, aligned with your 3 goals and the T3 stack architecture, that transforms your app into a flexible, robust system primed for “one-click team” functionality.

---

## ✅ GOAL 1: Make Adding/Creating Advisors Easier

### 🚀 Solution: Replace Raw JSON Modal with a Guided Advisor Wizard + Templates

#### ➤ Step 1: Build `AdvisorWizardDialog` (React Component)
Located at: `src/features/advisors/components/AdvisorWizardDialog.tsx`

```tsx
// Uses React Hook Form + Zod + Steps
const steps = [
  { id: 'identity', label: 'Who Are They?' },
  { id: 'expertise', label: 'What Do They Know?' },
  { id: 'behavior', label: 'How Do They Advise?' },
  { id: 'preview', label: 'Preview & Save' }
];
```

Each step renders tailored inputs:

- **Identity**: Name, Title, Avatar Upload, Description
- **Expertise**: Multi-select specialties, personality traits, tags (with chips UI)
- **Behavior**: Mission, Scope (in/out), KPIs, Advice Style (dropdown: coach → propose → refine), Voice Tone
- **Preview**: Live-rendered card + sample prompt test + copyable/exportable JSON

> 💡 Use `react-hook-form` with `zodResolver` per step. Debounced live validation.

---

#### ➤ Step 2: Add Templates System

Create preset templates in:  
`src/shared/advisor-templates/startup-squad.ts`  
`src/shared/advisor-templates/life-coach-team.ts`  
`src/shared/advisor-templates/college-prep-team.ts`

Each exports an array of advisor configs:

```ts
// startup-squad.ts
export const StartupSquadTemplates = [
  {
    id: "visionary",
    name: "The Visionary",
    title: "Big-Picture Strategist",
    description: "Optimistic, product-obsessed. Asks: 'Does this change the game?'",
    tags: ["strategy", "innovation", "product"],
    roleDefinition: {
      mission: "Ensure every idea disrupts the market and creates user love.",
      scope: {
        inScope: ["market positioning", "long-term vision"],
        outOfScope: ["budgeting", "daily ops"]
      }
    },
    adviceDelivery: {
      mode: "coach → propose → refine",
      formality: "casual",
      voiceGuidelines: ["enthusiastic", "visionary tone"]
    }
  },
  // ... Analyst, Operator, Skeptic, Storyteller
];
```

> ✨ In wizard Step 1, add:  
> _“Start from Template → [Startup Squad] [Life Coach Team] [College Prep Team]”_  
> Selecting auto-fills all fields + enables “Customize Further”.

---

#### ➤ Step 3: One-Click Team Creation Button

Add to Projects Tab & Marketplace:

```tsx
// In ProjectsPage.tsx or MarketplacePage.tsx
<Button onClick={() => openWizard({ template: 'startup-squad' })}>
  🚀 Add Startup Squad (5 Advisors)
</Button>
```

When clicked → opens wizard in “bulk mode”:

- Shows checklist of 5 advisors
- User can toggle which to include
- Optional: Customize names/titles per advisor before creation
- Submit → loops through selected, calls Convex action for each

> ⚙️ Behind the scenes:  
> ```ts
> const upload = useAction(api.advisors.uploadAdvisorJSON);
> for (const advisor of selectedAdvisors) {
>   await upload({ advisor });
> }
> ```

---

## ✅ GOAL 2: Robust, Flexible, Future-Proof System

### 🧱 Architecture Upgrade

#### ➤ Fix Backend Wiring (Immediate)

Implement missing route:  
`src/app/api/advisors/route.ts`

```ts
import { NextRequest } from "next/server";
import { api } from "~/convex/_generated/api";
import { server } from "~/convex/_generated/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jsonConfiguration, firstName, lastName, title, image } = body;

  // Parse & enrich
  let advisorJson;
  try {
    advisorJson = JSON.parse(jsonConfiguration);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ensure persona fallback
  if (!advisorJson.persona) {
    advisorJson.persona = { name: `${firstName} ${lastName}`, title };
  }

  // Call Convex
  try {
    const result = await server.api.advisors.uploadAdvisorJSON({ advisor: advisorJson });
    if (!result.ok) throw new Error(result.error);
    return Response.json({ success: true, advisorId: result.advisorId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

> ✅ Now legacy modal works temporarily while you build wizard.

---

#### ➤ Shared Zod Schema (Frontend + Backend Validation)

Create: `src/features/advisors/forms/schemas.ts`

```ts
import { z } from "zod";

export const AdvisorPersonaSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  expertise: z.array(z.string()).optional(),
});

export const AdvisorRoleSchema = z.object({
  mission: z.string().optional(),
  scope: z.object({
    inScope: z.array(z.string()).optional(),
    outOfScope: z.array(z.string()).optional(),
  }).optional(),
  KPIs: z.array(z.string()).optional(),
});

export const AdvisorSchema = z.object({
  persona: AdvisorPersonaSchema,
  roleDefinition: AdvisorRoleSchema.optional(),
  adviceDelivery: z.object({
    mode: z.string().optional(),
    formality: z.enum(["formal", "casual"]).optional(),
    voiceGuidelines: z.array(z.string()).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  localization: z.record(z.string()).optional(),
});
```

> 🔁 Reuse same schema in Convex action for server-side validation.

---

#### ➤ Live JSON Preview + Export/Import
In wizard preview step:
```tsx
// Derive from form state
const advisorJson = useMemo(() => assembleAdvisorFromForm(getValues()), [getValues()]);
// Validate & display
const validationResult = AdvisorSchema.safeParse(advisorJson);
return (
  <div>
    <SyntaxHighlighter language="json">
      {JSON.stringify(advisorJson, null, 2)}
    </SyntaxHighlighter>
    <Button onClick={() => navigator.clipboard.writeText(JSON.stringify(advisorJson))}>
      📋 Copy Config
    </Button>
    <input type="file" onChange={handleImport} accept=".json" />
  </div>
);
```

> ✅ Users can export, share, import, or paste configs later.

---

## ✅ GOAL 3: Roadmap Ready — One-Click Teams

### 🎯 Implementation Strategy

#### ➤ Team Preset Loader

Create util: `src/features/advisors/utils/loadTeamPreset.ts`

```ts
import { StartupSquadTemplates } from "~/shared/advisor-templates/startup-squad";
import { LifeCoachTeamTemplates } from "~/shared/advisor-templates/life-coach-team";
import { CollegePrepTeamTemplates } from "~/shared/advisor-templates/college-prep-team";

export const loadTeamPreset = (teamKey: string) => {
  switch (teamKey) {
    case 'startup-squad': return StartupSquadTemplates;
    case 'life-coach-team': return LifeCoachTeamTemplates;
    case 'college-prep-team': return CollegePrepTeamTemplates;
    default: return [];
  }
};
```

#### ➤ Bulk Creation Hook

`src/features/advisors/hooks/useBulkCreateAdvisors.ts`

```ts
import { useAction } from "convex/react";
import { api } from "~/convex/_generated/api";

export const useBulkCreateAdvisors = () => {
  const upload = useAction(api.advisors.uploadAdvisorJSON);

  const createTeam = async (advisors: any[]) => {
    const results = [];
    for (const advisor of advisors) {
      const res = await upload({ advisor });
      results.push(res);
    }
    return results;
  };

  return { createTeam };
};
```

#### ➤ UX Flow for “Add Entire Team”

1. User clicks “Add Startup Squad”
2. Modal opens showing 5 avatars + checkboxes + optional rename fields
3. User unchecks any they don’t want
4. Clicks “Create Selected Advisors (4/5)”
5. Progress bar appears → Success toast → Advisors appear in sidebar

> 🧩 Bonus: After creation, auto-create a new Project named “My Startup Squad Workspace” and assign all 5 advisors to it.

---

## 🧭 Navigation & Discoverability Fixes

### ➤ Add CTAs Everywhere

- **Projects Tab Header**: “+ New Advisor” / “+ Add Team”
- **Marketplace Page**: “Create Your Own Advisor” button next to search
- **Empty State**: If no advisors, show illustration + “Get started by adding your first advisor or team!”

---

## ♿ Accessibility & Polish

- ✅ All steps have `aria-labelledby`, errors use `aria-describedby`
- ✅ Keyboard navigation between steps (Tab/Enter)
- ✅ Auto-save draft to `localStorage` every 30s (`useEffect` + `JSON.stringify`)
- ✅ Toast notifications on success/error
- ✅ Loading states during Convex mutations

---

## 🧪 Testing Plan

| Test Type       | What to Test                                                                 |
|-----------------|------------------------------------------------------------------------------|
| Unit            | `jsonMapping.ts` – form ↔ JSON conversion                                    |
| Integration     | Wizard submit → calls Convex → returns ID/error                              |
| E2E (Playwright)| Click “Add Startup Squad” → 5 advisors created → appear in project sidebar   |
| Accessibility   | Axe-core scan, keyboard nav, screen reader test on wizard                    |

---

## 🗺️ Future Roadmap (Post-Launch)

1. **Team Collaboration**: Invite others to co-manage advisor teams
2. **Versioning**: Edit & version advisor configs (like GitHub commits)
3. **Community Templates**: Share/publish your advisor configs publicly
4. **AI-Assisted Creation**: “Describe the advisor you want → we generate the config”
5. **Mobile Optimization**: Swipeable wizard steps, responsive card previews

---

## 🏁 Summary: What to Build Now

✅ **Short-Term Wins**

1. Implement `/api/advisors POST` route → unblocks current modal
2. Add “Create Advisor” button in Projects tab
3. Build `AdvisorWizardDialog` with 4-step flow + Zod validation
4. Add template selector (Startup Squad, Life Coach, College Prep)
5. Add “Add Entire Team” bulk creation flow
6. Add live JSON preview + export/import

✅ **Tech Debt Resolved**

- No more 404s on advisor creation
- Convex actions properly wired
- Validation consistent front-to-back
- Entry points visible and intuitive

✅ **User Delight**

- Non-technical users can now create powerful advisors
- One-click teams accelerate onboarding
- Templates reduce friction + increase quality
- Preview/test before saving builds confidence

---

## 🛠 Sample Commit Plan

```bash
feat(advisors): implement POST /api/advisors route
feat(ui): add Create Advisor button to Projects tab
feat(wizard): build AdvisorWizardDialog with RHF + Zod
feat(templates): add startup/life/college advisor presets
feat(bulk): support one-click team creation
feat(preview): live JSON + avatar preview in wizard
feat(accessibility): WCAG AA compliance for wizard
test: add unit + e2e tests for advisor creation
```
Love this direction — it hits usability, robustness, and scale. Here’s a concrete plan to ship “one‑click advisors” and “one‑click teams” with a friendly creation flow, solid validation, and clean wiring to your backend.

Overview
- Short-term (1–2 days): Make “Create Advisor” discoverable and fix the broken create path. Add one‑click team spawn for the three teams you listed.
- Next (3–7 days): Ship a guided Advisor Wizard with live preview + templates.
- Then (1–2 sprints): Versioned template library, import/export, and stronger validation mirrored on the server.

Part 1 — Quick fixes to unblock creation
1) Re‑add the entry point
- Add a “Create advisor” button in Projects and Marketplace (also a “Create team” split-button).
- Keep the existing AdvisorModal for now, but wire its save button to Convex.

2) Fix the save path (call Convex directly)
- Use Convex actions/mutations instead of the missing POST route. Two options:
  - Client → Convex: useAction(api.advisors.uploadAdvisorJSON) or useMutation(api.advisors.createAdvisorFromJSON).
  - Or add a Next route that calls the Convex action (handy for auth/logging), then call that from the modal.

Example (client-side call):
```ts
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

function useCreateAdvisor() {
  const upload = useAction(api.advisors.uploadAdvisorJSON);
  return async (advisor: unknown) => {
    const res = await upload({ advisor });
    if (!res.ok) throw new Error(res.error ?? "Failed to create advisor");
    return res.advisorId;
  };
}
```

3) Minimal front-end validation
- Before submit, ensure advisor.persona.name and advisor.persona.title exist. If the modal expects first/last/title separately, combine to persona.name internally.

Part 2 — One‑click Team Templates (The “wow”)
Add a tiny “Team Template” system that spawns several advisors at once.

Suggested data types
```ts
// Minimal advisor JSON expected by Convex createAdvisorFromJSON
export type AdvisorJSON = {
  persona: {
    name: string;
    title: string;
    description?: string;
    image?: string;
    specialties?: string[];
    expertise?: string[];
    personality?: string[];
  };
  roleDefinition?: {
    mission?: string;
    scope?: { inScope?: string[]; outOfScope?: string[] };
    kpis?: string[];
  };
  tags?: string[];
  metadata?: Record<string, unknown>;
};

// Team template definition
export type TeamTemplate = {
  id: string;          // "startup-squad"
  name: string;        // "The Startup Squad"
  description?: string;
  advisors: AdvisorJSON[];
  starterPrompt?: string;           // shown after creation
  outputs?: string[];               // e.g., “timeline”, “budget”
  recommendedIntegrations?: string[]; // e.g., ["Calendar", "Docs"]
};
```

Server action to create a team from template
```ts
// convex/teams.ts
import { v } from "convex/values";
import { action } from "./_generated/server";
import { TEAM_TEMPLATES } from "../templates/teamTemplates"; // see below

export const createFromTemplate = action({
  args: { templateId: v.string() },
  handler: async (ctx, { templateId }) => {
    const auth = await ctx.auth.getUserIdentity();
    if (!auth) return { ok: false, error: "Not authenticated" };

    const template = TEAM_TEMPLATES[templateId];
    if (!template) return { ok: false, error: "Unknown team template" };

    const advisorIds: string[] = [];

    for (const a of template.advisors) {
      // Option A: uploadAdvisorJSON action
      const created = await ctx.runAction("advisors.uploadAdvisorJSON", { advisor: a });
      if (!created.ok) return { ok: false, error: created.error ?? "Advisor create failed" };
      advisorIds.push(created.advisorId);
    }

    // Optional: create a "team" record to group the advisors
    const teamId = await ctx.db.insert("teams", {
      ownerId: auth.subject,
      name: template.name,
      templateId,
      advisorIds,
      createdAt: Date.now(),
    });

    return { ok: true, teamId, advisorIds };
  },
});
```

Client: One‑click create
```tsx
// AddTeamButton.tsx
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AddTeamButton() {
  const createTeam = useAction(api.teams.createFromTemplate);
  const onClick = async (templateId: string) => {
    const res = await createTeam({ templateId });
    if (!res.ok) return alert(res.error);
    // navigate or toast
  };
  return (
    <div className="inline-flex gap-2">
      <button onClick={() => onClick("startup-squad")}>Add Startup Squad 🚀</button>
      <button onClick={() => onClick("life-coach")}>Add Life Coach Team 🌱</button>
      <button onClick={() => onClick("college-prep")}>Add College Prep Team 🎓</button>
    </div>
  );
}
```

Team template registry
Create src/templates/teamTemplates.ts and export the three teams. Keep the advisor JSON minimal but meaningful; you can enrich later.

```ts
// src/templates/teamTemplates.ts
import type { TeamTemplate } from "./types";

export const TEAM_TEMPLATES: Record<string, TeamTemplate> = {
  "startup-squad": {
    id: "startup-squad",
    name: "The Startup Squad",
    description: "Stress-test a business idea from every critical angle.",
    advisors: [
      {
        persona: {
          name: "The Visionary",
          title: "Product & Mission",
          description: "Optimistic, big‑picture, product‑obsessed. Asks: Does this change the game?",
          specialties: ["market disruption", "long‑term mission", "user love"],
          personality: ["optimistic", "future‑focused", "bold"]
        },
        roleDefinition: { mission: "Push the idea toward a category‑defining future." },
        tags: ["startup","vision","product"]
      },
      {
        persona: {
          name: "The Analyst",
          title: "Market & Economics",
          description: "Data‑driven, pragmatic. TAM, competition, unit economics, KPIs.",
          specialties: ["TAM","unit economics","KPI frameworks"],
          personality: ["skeptical","grounded","precise"]
        },
        roleDefinition: { mission: "Validate feasibility and scalability with numbers." },
        tags: ["finance","analytics","gtm"]
      },
      {
        persona: {
          name: "The Operator",
          title: "Execution & Delivery",
          description: "Pragmatic execution. Logistics, tech stack, hiring, roadmaps.",
          specialties: ["roadmapping","ops","tech stack"],
          personality: ["practical","systematic","decisive"]
        },
        roleDefinition: { mission: "Turn the plan into a predictable build and launch motion." },
        tags: ["ops","engineering","planning"]
      },
      {
        persona: {
          name: "The Skeptic",
          title: "Risk & Compliance",
          description: "Risk‑averse critic. Legal, financial, market risks.",
          specialties: ["risk review","compliance","downside analysis"],
          personality: ["critical","cautious","thorough"]
        },
        roleDefinition: { mission: "Identify and mitigate risks before they hurt." },
        tags: ["risk","legal","finance"]
      },
      {
        persona: {
          name: "The Storyteller",
          title: "Brand & Narrative",
          description: "Branding, messaging, PR. Makes customers and investors care.",
          specialties: ["positioning","messaging","PR"],
          personality: ["empathetic","clear","persuasive"]
        },
        roleDefinition: { mission: "Craft a narrative that resonates and converts." },
        tags: ["marketing","brand","comms"]
      }
    ],
    starterPrompt: "Kick off a startup review: market size, competition, risks, execution plan, and positioning.",
    outputs: ["risk register","unit economics sheet","90‑day roadmap","positioning brief"],
    recommendedIntegrations: ["Docs","Sheets/Notion","Calendar"]
  },

  "life-coach": {
    id: "life-coach",
    name: "Life Coach Team",
    description: "Values → goals → habits with health and budget alignment.",
    advisors: [
      { persona: { name: "Life Coach", title: "Values & Goals", specialties: ["values mapping","goal setting"] }, tags: ["life","goals"] },
      { persona: { name: "Habit Scientist", title: "Behavior Design", specialties: ["cues","rewards","streaks"] }, tags: ["habits","behavior"] },
      { persona: { name: "Planner", title: "Routines & Time Blocks", specialties: ["weekly cadence","buffers"] }, tags: ["planning","time"] },
      { persona: { name: "Health Coach", title: "Sleep, Fitness, Nutrition", specialties: ["sleep","training","meal planning"] }, tags: ["health"] },
      { persona: { name: "Budget Coach", title: "Cash‑Flow & Savings", specialties: ["budgeting","savings"] }, tags: ["finance","budget"] }
    ],
    starterPrompt: "Design a 12‑week plan to [primary goal] given [constraints] with ~[x] hrs/week.",
    outputs: ["12‑week goals map","habit stack","weekly calendar","simple meal/workout","monthly budget"],
    recommendedIntegrations: ["Calendar","Reminders","Sheets/Notion"]
  },

  "college-prep": {
    id: "college-prep",
    name: "College Prep Team",
    description: "End‑to‑end admissions strategy, essays, testing, and aid.",
    advisors: [
      { persona: { name: "Admissions Counselor", title: "Target List & Strategy" }, tags: ["admissions"] },
      { persona: { name: "Essay Coach", title: "Story & Drafts" }, tags: ["essays","writing"] },
      { persona: { name: "Test Prep Tutor", title: "SAT/ACT Plan" }, tags: ["testing","study"] },
      { persona: { name: "Financial Aid Advisor", title: "FAFSA/CSS & Scholarships" }, tags: ["aid","finance"] },
      { persona: { name: "Program Researcher", title: "Outcomes & Clubs" }, tags: ["research"] }
    ],
    starterPrompt: "I’m a [junior/senior] with GPA [x], target majors [y]. Build an admissions plan for Fall [year] and a first essay outline.",
    outputs: ["balanced school list","timeline","essay drafts","test plan","scholarship tracker","visit/interview prep"],
    recommendedIntegrations: ["Docs","Sheets/Notion","Calendar"]
  }
};
```

Part 3 — Advisor Wizard (friendly, flexible, robust)
Replace raw JSON entry with a step-by-step wizard plus a live JSON preview.

Wizard flow
- Step 1: Identity (name, title, one‑liner, avatar)
- Step 2: Personality & Expertise (chips: personality traits, expertise, specialties)
- Step 3: Role & Scope (mission, in/out of scope, KPIs)
- Step 4: Tags & Metadata
- Step 5: Review (live JSON preview, per-field validation), then Save

Tech
- React Hook Form + Zod resolver
- Zod schemas mirrored on server for identical error messages
- Live read-only JSON preview panel; copy to clipboard
- Import JSON: paste/upload → validate → map into form; Export JSON: download config

Schemas (client and server)
```ts
// src/features/advisors/forms/schemas.ts
import { z } from "zod";

export const AdvisorSchema = z.object({
  persona: z.object({
    name: z.string().min(2, "Name is required"),
    title: z.string().min(2, "Title is required"),
    description: z.string().optional(),
    image: z.string().url().optional(),
    specialties: z.array(z.string()).optional(),
    expertise: z.array(z.string()).optional(),
    personality: z.array(z.string()).optional(),
  }),
  roleDefinition: z.object({
    mission: z.string().optional(),
    scope: z.object({
      inScope: z.array(z.string()).optional(),
      outOfScope: z.array(z.string()).optional(),
    }).optional(),
    kpis: z.array(z.string()).optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});
export type AdvisorForm = z.infer<typeof AdvisorSchema>;
```

Submission wiring
```ts
// Wizard submit
const onSubmit = async (values: AdvisorForm) => {
  const res = await upload({ advisor: values }); // useAction(api.advisors.uploadAdvisorJSON)
  if (!res.ok) setError(res.error);
  else router.push(`/advisors/${res.advisorId}`);
};
```

Part 4 — Discoverability and UX polish
- Add “Create” split-button in Projects: [Create Advisor] [v] → “Start from Template” → list of curated advisor archetypes.
- Marketplace: “Create Custom Advisor” card + “Start from Team” cards for the three teams.
- Optional: “Test-drive” the advisor in the wizard Review step (send a sample message to a temp session).

Part 5 — Robustness, versioning, and scale
- Version your templates: template.version; store in src/templates with semantic versions.
- When spawning from a template, persist templateId + version in the advisor metadata for future migrations.
- Mirror Zod schemas on the server (Convex action) for consistent errors; return structured field errors.
- Import/export: allow .json files; validate with Zod; show field-by-field mapping results.
- Accessibility: proper labels, aria-live for error summaries, keyboard nav between steps.

Acceptance criteria
- Users can:
  - Create an advisor from Projects and Marketplace without errors.
  - Spawn “Startup Squad”, “Life Coach Team”, and “College Prep Team” with one click; all advisors appear immediately.
  - Use the Advisor Wizard to create a custom advisor with live preview and clear validation.
  - Start from a preset advisor or import JSON, then refine and save.
- Backend:
  - All creation paths hit Convex (uploadAdvisorJSON or createAdvisorFromJSON).
  - Team creation returns teamId + advisorIds.
  - Templates are versioned and test-covered.
- QA:
  - E2E: create advisor → appears in list → open chat.
  - E2E: create team → all advisors created → optional team view groups them.

Open questions for you
- Do you want a “team” entity in the UI (grouping + shared starter prompt), or is spawning advisors sufficient for now?
- Are advisors tied to a specific project on creation, or global to the user?
- Any preferred default models/tooling per advisor (e.g., certain models for Analyst vs Storyteller)?
- Should teams also create a shared checklist/doc set (Outputs) automatically in Docs/Notion?

If you’d like, I can:
- Drop in the exact three team templates as JSON files you can paste into src/templates.
- Wire the AdvisorModal to Convex in your current code and add the Project/Marketplace buttons.
- Scaffold the Wizard (React Hook Form + Zod) with a live JSON preview pane.
Awesome—thanks for the clarifications. I’ll tune the plan to your choices:

- No team entity. One click just spawns multiple advisors.
- Advisors are global to the user and can be invoked via @NAME anywhere.
- No model/tooling prefs yet.
- No auto-outputs (Docs/Notion) yet—keep on roadmap.

Below is a minimal, concrete implementation you can paste in to ship “one‑click teams” and “@mentions”, plus wiring fixes so creation actually works today. After that, we can layer in the wizard and richer validation.

Plan
1) Add one‑click team templates that spawn advisors (no team record).
2) Wire creation to Convex (fixes current POST gap).
3) Add @mentions so users can summon any advisor from any chat.
4) Add entry points in Projects/Marketplace.

1) Templates for one‑click teams
Create src/templates/teamTemplates.ts with your three teams.

```ts
// src/templates/teamTemplates.ts
export type AdvisorJSON = {
  persona: {
    name: string;
    title: string;
    description?: string;
    image?: string;
    specialties?: string[];
    expertise?: string[];
    personality?: string[];
  };
  roleDefinition?: {
    mission?: string;
    scope?: { inScope?: string[]; outOfScope?: string[] };
    kpis?: string[];
  };
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type TeamTemplate = {
  id: string;
  name: string;
  description?: string;
  advisors: AdvisorJSON[];
  starterPrompt?: string;
  outputs?: string[];
  recommendedIntegrations?: string[];
};

// Minimal slugify for handles
export const toHandle = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30);

export const TEAM_TEMPLATES: Record<string, TeamTemplate> = {
  "startup-squad": {
    id: "startup-squad",
    name: "The Startup Squad",
    description: "Stress-test a business idea from every critical angle.",
    advisors: [
      {
        persona: {
          name: "The Visionary",
          title: "Product & Mission",
          description:
            "Optimistic, big‑picture, product‑obsessed. Asks: Does this change the game?",
          specialties: ["market disruption", "long‑term mission", "user love"],
          personality: ["optimistic", "future‑focused", "bold"],
        },
        roleDefinition: { mission: "Push the idea toward a category‑defining future." },
        tags: ["startup", "vision", "product"],
      },
      {
        persona: {
          name: "The Analyst",
          title: "Market & Economics",
          description:
            "Data‑driven, pragmatic. TAM, competition, unit economics, KPIs.",
          specialties: ["TAM", "unit economics", "KPI frameworks"],
          personality: ["skeptical", "grounded", "precise"],
        },
        roleDefinition: { mission: "Validate feasibility and scalability with numbers." },
        tags: ["finance", "analytics", "gtm"],
      },
      {
        persona: {
          name: "The Operator",
          title: "Execution & Delivery",
          description:
            "Pragmatic execution. Logistics, tech stack, hiring, roadmaps.",
          specialties: ["roadmapping", "ops", "tech stack"],
          personality: ["practical", "systematic", "decisive"],
        },
        roleDefinition: { mission: "Turn the plan into a predictable build and launch motion." },
        tags: ["ops", "engineering", "planning"],
      },
      {
        persona: {
          name: "The Skeptic",
          title: "Risk & Compliance",
          description:
            "Risk‑averse critic. Legal, financial, and market risks.",
          specialties: ["risk review", "compliance", "downside analysis"],
          personality: ["critical", "cautious", "thorough"],
        },
        roleDefinition: { mission: "Identify and mitigate risks before they hurt." },
        tags: ["risk", "legal", "finance"],
      },
      {
        persona: {
          name: "The Storyteller",
          title: "Brand & Narrative",
          description:
            "Branding, messaging, PR. Makes customers and investors care.",
          specialties: ["positioning", "messaging", "PR"],
          personality: ["empathetic", "clear", "persuasive"],
        },
        roleDefinition: { mission: "Craft a narrative that resonates and converts." },
        tags: ["marketing", "brand", "comms"],
      },
    ],
    starterPrompt:
      "Kick off a startup review: market size, competition, risks, execution plan, and positioning.",
    outputs: ["risk register", "unit economics sheet", "90‑day roadmap", "positioning brief"],
    recommendedIntegrations: ["Docs", "Sheets/Notion", "Calendar"],
  },

  "life-coach": {
    id: "life-coach",
    name: "Life Coach Team",
    description: "Values → goals → habits with health and budget alignment.",
    advisors: [
      {
        persona: {
          name: "Life Coach",
          title: "Values & Goals",
          specialties: ["values mapping", "goal setting"],
        },
        tags: ["life", "goals"],
      },
      {
        persona: {
          name: "Habit Scientist",
          title: "Behavior Design",
          specialties: ["cues", "rewards", "streaks"],
        },
        tags: ["habits", "behavior"],
      },
      {
        persona: {
          name: "Planner",
          title: "Routines & Time Blocks",
          specialties: ["weekly cadence", "buffers"],
        },
        tags: ["planning", "time"],
      },
      {
        persona: {
          name: "Health Coach",
          title: "Sleep, Fitness, Nutrition",
          specialties: ["sleep", "training", "meal planning"],
        },
        tags: ["health"],
      },
      {
        persona: {
          name: "Budget Coach",
          title: "Cash‑Flow & Savings",
          specialties: ["budgeting", "savings"],
        },
        tags: ["finance", "budget"],
      },
    ],
    starterPrompt:
      "Design a 12‑week plan to [primary goal] given [constraints] with ~[x] hrs/week.",
    outputs: [
      "12‑week goals map",
      "habit stack",
      "weekly calendar",
      "simple meal/workout",
      "monthly budget",
    ],
    recommendedIntegrations: ["Calendar", "Reminders", "Sheets/Notion"],
  },

  "college-prep": {
    id: "college-prep",
    name: "College Prep Team",
    description: "End‑to‑end admissions strategy, essays, testing, and aid.",
    advisors: [
      { persona: { name: "Admissions Counselor", title: "Target List & Strategy" }, tags: ["admissions"] },
      { persona: { name: "Essay Coach", title: "Story & Drafts" }, tags: ["essays", "writing"] },
      { persona: { name: "Test Prep Tutor", title: "SAT/ACT Plan" }, tags: ["testing", "study"] },
      { persona: { name: "Financial Aid Advisor", title: "FAFSA/CSS & Scholarships" }, tags: ["aid", "finance"] },
      { persona: { name: "Program Researcher", title: "Outcomes & Clubs" }, tags: ["research"] },
    ],
    starterPrompt:
      "I’m a [junior/senior] with GPA [x], target majors [y]. Build an admissions plan for Fall [year] and a first essay outline.",
    outputs: [
      "balanced school list",
      "timeline",
      "essay drafts",
      "test plan",
      "scholarship tracker",
      "visit/interview prep",
    ],
    recommendedIntegrations: ["Docs", "Sheets/Notion", "Calendar"],
  },
};
```

2) Convex actions: spawn from template (no team record)
Create convex/teams.ts and a utility to ensure per‑user unique @handles.

```ts
// convex/teams.ts
import { v } from "convex/values";
import { action } from "./_generated/server";
import { TEAM_TEMPLATES, toHandle } from "../src/templates/teamTemplates";

// Helper: ensure unique handle per user by suffixing -2, -3...
async function uniqueHandle(ctx: any, ownerId: string, base: string) {
  const existing = await ctx.db
    .query("advisors") // adjust to your table name
    .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
    .collect();
  const handles = new Set(
    existing.map((a: any) => a.metadata?.handle || a.persona?.handle).filter(Boolean)
  );
  if (!handles.has(base)) return base;
  let i = 2;
  while (handles.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export const createFromTemplate = action({
  args: { templateId: v.string() },
  handler: async (ctx, { templateId }) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return { ok: false, error: "Not authenticated" };

    const template = TEAM_TEMPLATES[templateId];
    if (!template) return { ok: false, error: "Unknown team template" };

    const advisorIds: string[] = [];

    for (const a of template.advisors) {
      const base = toHandle(a.persona.name);
      const handle = await uniqueHandle(ctx, user.subject, base);
      const advisor = {
        ...a,
        metadata: { ...(a.metadata ?? {}), handle, templateId, templateName: template.name },
      };
      // Reuse your existing Convex action/mutation; both patterns shown below.
      // If you have advisors.uploadAdvisorJSON (action):
      const created = await ctx.runAction("advisors.uploadAdvisorJSON", { advisor });
      if (!created?.ok) return { ok: false, error: created?.error ?? "Advisor create failed" };
      advisorIds.push(created.advisorId);
    }

    return { ok: true, advisorIds }; // no team entity
  },
});
```

If you prefer not to add a new Convex file, you can place createFromTemplate in convex/advisors.ts and export it under api.advisors.createFromTemplate.

3) Client: Add “Add Team” buttons and wire up creation
```tsx
// src/features/advisors/AddTeamButtons.tsx
"use client";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function AddTeamButtons() {
  const createTeam = useAction(api.teams.createFromTemplate); // or api.advisors.createFromTemplate
  const [loading, setLoading] = useState<string | null>(null);

  const onClick = async (templateId: string) => {
    try {
      setLoading(templateId);
      const res = await createTeam({ templateId });
      if (!res.ok) throw new Error(res.error);
      // show toast and optionally navigate to Advisors list
      // e.g., toast.success(`Created ${res.advisorIds.length} advisors`);
    } catch (e: any) {
      // toast.error(e.message);
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={loading === "startup-squad"} onClick={() => onClick("startup-squad")}>
        {loading === "startup-squad" ? "Adding…" : "Add Startup Squad 🚀"}
      </button>
      <button disabled={loading === "life-coach"} onClick={() => onClick("life-coach")}>
        {loading === "life-coach" ? "Adding…" : "Add Life Coach Team 🌱"}
      </button>
      <button disabled={loading === "college-prep"} onClick={() => onClick("college-prep")}>
        {loading === "college-prep" ? "Adding…" : "Add College Prep Team 🎓"}
      </button>
    </div>
  );
}
```

Add this component in:
- Projects tab header area
- Marketplace page near “Create custom advisor”

4) Wire up advisor creation (fix current POST gap)
If your AdvisorModal currently posts to /api/advisors (which 404s), change its onSave to call Convex directly:

```ts
// src/features/advisors/useCreateAdvisor.ts
"use client";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCreateAdvisor() {
  const upload = useAction(api.advisors.uploadAdvisorJSON); // existing Convex action
  return async (advisorJson: unknown) => {
    const res = await upload({ advisor: advisorJson });
    if (!res.ok) throw new Error(res.error ?? "Failed to create advisor");
    return res.advisorId as string;
  };
}
```

Then inside AdvisorModal submit:
```ts
const createAdvisor = useCreateAdvisor();
await createAdvisor(parsedJson); // parsed from the modal form
```

5) Global @mentions (any chat session)
a) Give each advisor a stable handle
- We already set metadata.handle during creation (unique per user).
- If you have existing advisors without handles, add a one‑time migration action to backfill metadata.handle.

b) Suggest advisors when typing “@”
```tsx
// src/features/chat/hooks/useAdvisorMentions.ts
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useAdvisorMentions() {
  const advisors = useQuery(api.advisors.listMine) ?? []; // implement if missing
  return advisors
    .map((a: any) => ({
      id: a._id,
      name: a.persona?.name,
      title: a.persona?.title,
      handle: a.metadata?.handle,
    }))
    .filter((a) => !!a.handle);
}
```

In your ChatComposer, when user types “@”, open a popover filtered by handle or name; insert “@handle”.

c) Route the message using the mentioned advisor
On send, parse the first mention and set the system prompt for that advisor. For now, use first mention only.

```ts
// src/features/chat/utils/mentions.ts
export const extractMentions = (text: string) =>
  Array.from(text.matchAll(/@([a-z0-9][a-z0-9-]{0,29})\b/gi)).map((m) => m[1].toLowerCase());
```

Compose the advisor’s system prompt:
```ts
// src/features/advisors/composeSystemPrompt.ts
import type { AdvisorJSON } from "@/templates/teamTemplates";

export function composeSystemPrompt(a: AdvisorJSON) {
  const p = a.persona ?? {};
  const r = a.roleDefinition ?? {};
  const inScope = r.scope?.inScope?.length ? `In-scope: ${r.scope?.inScope?.join("; ")}` : "";
  const outScope = r.scope?.outOfScope?.length ? `Out-of-scope: ${r.scope?.outOfScope?.join("; ")}` : "";
  const kpis = r.kpis?.length ? `KPIs: ${r.kpis?.join("; ")}` : "";
  const specialties = p.specialties?.length ? `Specialties: ${p.specialties?.join(", ")}` : "";
  const personality = p.personality?.length ? `Style: ${p.personality?.join(", ")}` : "";

  return [
    `You are ${p.name} — ${p.title}.`,
    p.description ? `Description: ${p.description}` : "",
    r.mission ? `Mission: ${r.mission}` : "",
    specialties,
    personality,
    inScope,
    outScope,
    kpis,
    `When replying, stay in character as ${p.name}. Be concise and actionable.`,
  ]
    .filter(Boolean)
    .join("\n");
}
```

Use it when calling your model:
```ts
// inside your sendMessage handler
const handles = extractMentions(userMessage);
let systemPrompt: string | undefined;

if (handles.length) {
  const list = advisorsListFromCacheOrQuery; // your listMine result
  const advisor = list.find((a) => a.metadata?.handle === handles[0]);
  if (advisor) {
    systemPrompt = composeSystemPrompt(advisor);
  }
}

// Build OpenAI-like payload
const messages = [
  ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
  // prior chat messages...
  { role: "user", content: userMessage },
];

// call your LLM with messages
```

This gives users the “@NAME from any chat” experience immediately.

6) Entry points and UX
- Projects: Add a “Create” split-button: [Create Advisor] [v] → “Add Startup Squad”, “Add Life Coach Team”, “Add College Prep Team”.
- Marketplace: Add a “Create Custom Advisor” card and “Add Team” cards for the three teams.
- After team spawn, show a toast with “5 advisors added: @visionary, @analyst, …” where handles are clickable.

7) Testing checklist
- Create each team: all advisors appear in the global list.
- In chat, typing @ opens advisor suggestions and inserts @handle.
- Sending a message with @handle uses that advisor’s voice (system prompt set).
- Non‑mentioned messages still work as before.

What’s next (nice-to-haves you can add after this)
- Advisor Wizard (form → JSON + live preview) so users don’t edit raw JSON.
- Import/export advisor JSON.
- Template versioning (store templateId + version in metadata).
- Multi‑advisor “panel” replies when a message has multiple @mentions (roundtable), behind a feature flag.

