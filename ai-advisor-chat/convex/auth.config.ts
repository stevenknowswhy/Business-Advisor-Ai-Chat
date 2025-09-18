export default {
  providers: [
    {
      // Clerk issuer domain for validating JWTs
      // Use the standard Clerk domain instead of requiring a custom "convex" template
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

