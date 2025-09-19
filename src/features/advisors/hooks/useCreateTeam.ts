import * as React from "react";
import { useAction } from "convex/react";

function genIdempotencyKey() {
  try {
    // @ts-ignore - crypto may not exist in some envs
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface AdvisorSummary {
  _id: string;
  name: string;
  oneLiner: string;
  handle: string;
  category?: string;
  avatarUrl?: string;
}

export interface CreateTeamResult {
  ok: true;
  templateId: string;
  version: string;
  advisorIds: string[];
  advisors?: AdvisorSummary[];
}

export function useCreateTeam() {
  const createFromTemplate = useAction("teams:createFromTemplate");
  const getAdvisors = useAction("advisors:getMany");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastResult, setLastResult] = React.useState<CreateTeamResult | null>(null);

  const createTeam = React.useCallback(
    async (templateId: string, customIdempotencyKey?: string) => {
      setError(null);
      setLoading(true);
      try {
        const idempotencyKey = customIdempotencyKey ?? genIdempotencyKey();
        const res = (await createFromTemplate({ templateId, idempotencyKey } as any)) as CreateTeamResult;

        // Fetch advisor details to return for navigation and UI
        let advisors: AdvisorSummary[] | undefined = undefined;
        try {
          const details = (await getAdvisors({ ids: res.advisorIds } as any)) as { ok: true; advisors: AdvisorSummary[] };
          advisors = details.advisors;
        } catch (e) {
          // Non-fatal: keep IDs even if details fetch fails
          advisors = undefined;
        }

        const full: CreateTeamResult = { ...res, advisors };
        setLastResult(full);
        return full;
      } catch (e: any) {
        const msg = e?.message ?? "Failed to create team";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [createFromTemplate, getAdvisors]
  );

  const reset = React.useCallback(() => {
    setError(null);
    setLastResult(null);
  }, []);

  return { createTeam, loading, error, lastResult, reset } as const;
}

