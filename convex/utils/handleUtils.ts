// Convex-safe copy of handle utilities (no external imports)

export function slugifyHandle(base: string): string {
  const s = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return s.length < 3 ? `${s}-${Math.random().toString(36).slice(2, 6)}` : s;
}

export interface GetUniqueHandleOptions {
  maxAttempts?: number;
}

export async function getUniqueHandle(
  base: string,
  existsChecker: (candidate: string) => Promise<boolean>,
  options: GetUniqueHandleOptions = {}
): Promise<string> {
  const { maxAttempts = 50 } = options;
  let root = slugifyHandle(base);
  if (root.length < 3) root = `${root}-${Math.random().toString(36).slice(2, 6)}`;

  let candidate = root;
  let n = 1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const exists = await existsChecker(candidate);
    if (!exists) return candidate;
    n += 1;
    candidate = `${root}-${n}`.slice(0, 40);
  }
  throw new Error("HANDLE_GENERATION_FAILED");
}

