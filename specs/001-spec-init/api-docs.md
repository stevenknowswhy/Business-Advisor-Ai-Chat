# Advisor Marketplace API (Convex)

This document describes the Convex actions used by the Advisor Marketplace. It covers request/response shapes, validation rules, authentication, idempotency, and rate limiting.

## Authentication

- All actions require a valid Clerk session with a JWT configured for Convex
  - JWT template must be named "convex" with audience "convex" and issuer matching your Clerk domain
- Unauthenticated requests return `UNAUTHENTICATED`

## advisors.create

Creates a single advisor owned by the authenticated user and links it in `userAdvisors`.

- Identifier: `advisors.create` (Convex action)
- Auth: Required (Clerk)

### Parameters

payload (validated server-side via Zod):
- name: string (min 2)
- title?: string (max 80)
- oneLiner: string (min 6)
- avatarUrl?: string (url)
- handle?: string (slug, 3-40 lowercase alphanumerics and dashes)
- tags?: string[]
- specialties?: string[]
- expertise?: string[]
- traits?: string[]
- mission: string (min 10)
- scopeIn?: string[]
- scopeOut?: string[]
- kpis?: string[]
- adviceStyle?: { voice: string; tone?: string }
- metadata?: { templateId?: string; templateVersion?: string; source?: "wizard" | "team" | "import" }
- isPublic?: boolean
- featured?: boolean
- category?: string

### Behavior

- Validates the payload with server-side Zod
- Ensures handle uniqueness per owner using centralized guard
  - If `handle` omitted, derived from `name`
  - On conflict, appends incrementing suffixes (-2, -3, ...)
- Inserts into `advisors` and links in `userAdvisors`

### Response

```
{ ok: true, advisorId: string }
```

### Errors

- `UNAUTHENTICATED` — missing/invalid Clerk session
- `INVALID_PAYLOAD: <zod message>` — validation failure
- `HANDLE_GENERATION_FAILED` — uniqueness guard exceeded attempts (rare)

## advisors.getMany

Fetch basic details for multiple advisors by ID. Only returns advisors owned by the requesting user.

- Identifier: `advisors.getMany` (Convex action)
- Auth: Required (Clerk)

### Parameters

- ids: string[] (Convex IDs for `advisors`)

### Response

```
{ ok: true, advisors: Array<{ _id: string; name: string; oneLiner: string; handle: string; category?: string; avatarUrl?: string }> }
```

### Errors

- `UNAUTHENTICATED`

## teams.createFromTemplate

Creates a team of advisors from a predefined template for the authenticated user.

- Identifier: `teams.createFromTemplate` (Convex action)
- Auth: Required (Clerk)
- Idempotency: Supported via `idempotencyKey`
- Rate Limiting: 3 team creations per minute per user

### Parameters

- templateId: string — one of:
  - `startup-squad`
  - `enterprise-trio`
  - `creative-studio`
  - `growth-pod`
- idempotencyKey?: string — optional, provides client-side idempotency (TTL ~10 minutes)

### Behavior

- Validates templateId against registry
- Enforces per-user rate limit (sliding window; 3/min)
- Applies idempotency: repeated calls with same key return cached result
- Spawns advisors using `advisors.create` for each blueprint in the template
- Advisors created from templates set `isPublic: true` and include a `category`

### Response

```
{ ok: true, templateId: string, version: string, advisorIds: string[] }
```

### Errors

- `UNAUTHENTICATED` — missing/invalid Clerk session
- `RATE_LIMITED` — too many team creations in the last minute
- `TEMPLATE_NOT_FOUND` — unknown templateId

## Troubleshooting

- UNAUTHENTICATED
  - Ensure ClerkProvider is configured and the request includes a valid session token
  - Verify JWT template is named `convex` with audience `convex`
- INVALID_PAYLOAD
  - Check required fields; see schema above; strings must meet min lengths
- RATE_LIMITED
  - Wait at least a minute before retrying team creation; reduce frequency
- TEMPLATE_NOT_FOUND
  - Use one of the documented template IDs or update the template registry if adding new ones
- HANDLE_GENERATION_FAILED
  - Extremely rare; try a different base `name` or explicit `handle`

