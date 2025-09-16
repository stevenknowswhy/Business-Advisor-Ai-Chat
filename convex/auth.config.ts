export default {
  providers: [
    {
      // Clerk issuer domain for validating "convex" JWTs
      // Prefer CLERK_JWT_ISSUER_DOMAIN (configure on Convex Dashboard or local env)
      // Fallback to NEXT_PUBLIC_CLERK_FRONTEND_API_URL if present in dev
      domain:
        process.env.CLERK_JWT_ISSUER_DOMAIN ||
        process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
      applicationID: "convex",
    },
  ],
};

