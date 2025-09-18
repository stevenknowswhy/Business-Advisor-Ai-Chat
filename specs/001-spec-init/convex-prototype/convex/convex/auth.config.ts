export default {
  providers: [
    {
      // Clerk JWT template issuer domain; keep in sync with your Clerk instance
      // Hardcoded fallback ensures provider is configured even if env is missing
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://above-ferret-50.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

