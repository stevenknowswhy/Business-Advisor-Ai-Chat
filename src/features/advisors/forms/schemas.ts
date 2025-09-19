import { z } from "zod";

/**
 * Shared Zod schemas for Advisor Wizard (client + server)
 * Keep in sync with Convex server-side validation.
 */

// Basic reusable primitives
export const NonEmptyString = z.string().trim().min(1, "Required");
export const Slug = z
  .string()
  .trim()
  .min(3, "Min 3 characters")
  .max(40, "Max 40 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens only");

export const UrlString = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .or(z.literal("").transform(() => undefined))
  .optional();

export const Tag = z
  .string()
  .trim()
  .min(2)
  .max(24);

// Step 1: Identity
export const AdvisorIdentitySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  title: z.string().trim().max(80).optional(),
  oneLiner: z.string().trim().min(6, "Add a short description"),
  avatarUrl: UrlString,
  handle: Slug.optional(),
  tags: z.array(Tag).max(12).optional().default([]),
});
export type AdvisorIdentity = z.infer<typeof AdvisorIdentitySchema>;

// Step 2: Expertise
export const AdvisorExpertiseSchema = z.object({
  specialties: z.array(z.string().trim().min(2)).min(1, "Select at least one"),
  expertise: z.array(z.string().trim().min(2)).optional().default([]),
  traits: z.array(z.string().trim().min(2)).optional().default([]),
});
export type AdvisorExpertise = z.infer<typeof AdvisorExpertiseSchema>;

// Step 3: Role
export const AdvisorRoleSchema = z.object({
  mission: z.string().trim().min(10, "Describe the advisor's mission"),
  scopeIn: z.array(z.string().trim().min(2)).optional().default([]),
  scopeOut: z.array(z.string().trim().min(2)).optional().default([]),
  kpis: z.array(z.string().trim().min(2)).optional().default([]),
  adviceStyle: z
    .object({
      voice: z.string().trim().min(2),
      tone: z.string().trim().min(2).optional(),
    })
    .optional(),
});
export type AdvisorRole = z.infer<typeof AdvisorRoleSchema>;

// Full wizard data
export const AdvisorWizardSchema = z
  .object({
    identity: AdvisorIdentitySchema,
    expertise: AdvisorExpertiseSchema,
    role: AdvisorRoleSchema,
  })
  .superRefine((val, ctx) => {
    // Example cross-step validation: ensure handle uniqueness is checked server-side.
    if (val.identity.handle && val.identity.handle.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 3,
        type: "string",
        inclusive: true,
        message: "Handle must be at least 3 characters",
        path: ["identity", "handle"],
      });
    }
  });
export type AdvisorWizardInput = z.infer<typeof AdvisorWizardSchema>;

// Server payload (flattened advisor document shape suggestion)
export const AdvisorCreatePayloadSchema = z.object({
  name: z.string().trim().min(2),
  title: z.string().trim().max(80).optional(),
  oneLiner: z.string().trim().min(6),
  avatarUrl: UrlString,
  handle: Slug.optional(),
  tags: z.array(Tag).optional().default([]),
  specialties: z.array(z.string().trim().min(2)).optional().default([]),
  expertise: z.array(z.string().trim().min(2)).optional().default([]),
  traits: z.array(z.string().trim().min(2)).optional().default([]),
  mission: z.string().trim().min(10),
  scopeIn: z.array(z.string().trim().min(2)).optional().default([]),
  scopeOut: z.array(z.string().trim().min(2)).optional().default([]),
  kpis: z.array(z.string().trim().min(2)).optional().default([]),
  adviceStyle: z
    .object({
      voice: z.string().trim().min(2),
      tone: z.string().trim().min(2).optional(),
    })
    .optional(),
  // Template provenance (optional)
  metadata: z
    .object({
      templateId: z.string().optional(),
      templateVersion: z.string().optional(),
      source: z.enum(["wizard", "team", "import"]).optional(),
    })
    .optional(),
});
export type AdvisorCreatePayload = z.infer<typeof AdvisorCreatePayloadSchema>;

// Helper to map wizard data to server payload
export function mapWizardToCreatePayload(input: AdvisorWizardInput): AdvisorCreatePayload {
  const { identity, expertise, role } = input;
  return {
    name: identity.name,
    title: identity.title,
    oneLiner: identity.oneLiner,
    avatarUrl: identity.avatarUrl,
    handle: identity.handle,
    tags: identity.tags ?? [],
    specialties: expertise.specialties ?? [],
    expertise: expertise.expertise ?? [],
    traits: expertise.traits ?? [],
    mission: role.mission,
    scopeIn: role.scopeIn ?? [],
    scopeOut: role.scopeOut ?? [],
    kpis: role.kpis ?? [],
    adviceStyle: role.adviceStyle,
    metadata: { source: "wizard" },
  };
}

