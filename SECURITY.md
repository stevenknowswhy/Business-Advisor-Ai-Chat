# Security Policy and Secret Management

This project treats security and secret hygiene as first‑class concerns. This document explains how we prevent secret leaks, how our automated scanners work, and what to do if a leak occurs.

## 1) Secret Scanning Workflow (CI)

Our GitHub Actions workflow “Secret Scan” runs on every push:
- Scans the working tree and a recent history window (e.g., last ~200 commits)
- Uploads an audit artifact for visibility
- Fails the job if suspected secrets are found

Findings must be triaged immediately. If a true secret is detected, rotate/invalidate it and remove it from the repo/history (see sections below).

## 2) Allowed locations for secrets

Never commit secrets to the repository. Instead use:
- GitHub Environment “Production” (for CI/automation-only values):
  - VERCEL_DEPLOY_HOOK_URL
  - PRODUCTION_BASE_URL
- Vercel Project Environment Variables (for runtime app configuration):
  - DATABASE_URL
  - OPENROUTER_API_KEY
  - CLERK_SECRET_KEY
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

Use .env.example with placeholders for local development guidance.

## 3) Files that must never be committed

The following must never be tracked by Git (they are in .gitignore):
- .env
- .env.local
- .env.production

If you accidentally stage one of these, run `git restore --staged <file>` and delete the file from your commit before pushing.

## 4) History Rewrites (BFG Repo‑Cleaner)

When a historical secret is discovered, we use BFG Repo‑Cleaner to scrub past commits. The rules below were used in the recent cleanup:

Create a file (e.g., `bfg-replacements.txt`) with the following expressions:

```
regex:sk-or-v1-[0-9a-fA-F]+==>***REMOVED***
regex:sk_test_[A-Za-z0-9_\-]+==>***REMOVED***
regex:pk_test_[A-Za-z0-9_\-]+==>***REMOVED***
regex:postgresql://***REMOVED***
```

Then run BFG (from the repo root):

```
java -jar bfg.jar -rt bfg-replacements.txt --no-blob-protection .
# Followed by cleanup and a forced push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force origin --all
git push --force origin --tags
```

Notes:
- Using `--no-blob-protection` allows current commits to be modified—only use after fixing the working tree (replace real secrets with placeholders).
- Force-push requires coordination. Ensure collaborators update their local clones (e.g., fresh clone or `git fetch --all` + reset).

## 5) Immediate actions if a leak occurs

1. Revoke/rotate the exposed credential with the provider (OpenRouter, Clerk, database, etc.).
2. Remove the secret from the code and config files; replace with environment variables.
3. If present in Git history, scrub it using the BFG process above.
4. Force-push the rewrite and notify maintainers.
5. Re-run the “Secret Scan” workflow to verify a clean state.

## 6) Contributor Best Practices

- Never commit real secrets; use environment variables and `.env.example` placeholders.
- Prefer per-environment configuration through GitHub Environments (CI) and Vercel (runtime).
- Validate before pushing: search for patterns like `sk-`, `sk_test_`, `pk_test_`, and `DATABASE_URL=`.
- If unsure, ask a maintainer before including any sensitive value in code or docs.

## 7) Reporting Security Issues

If you believe you have found a security vulnerability, please open a private, minimal report (do not include sensitive values) or contact the maintainers directly. We will acknowledge and address issues promptly.

