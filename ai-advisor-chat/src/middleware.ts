import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/test-chat(.*)",
  "/test-auth(.*)",
  "/clerk-test(.*)",
  "/api/webhooks(.*)",
  "/api/health(.*)",
  "/api/test-convex(.*)",
  "/api/advisors(.*)", // Public: getting available advisors
  "/api/test-simple(.*)",
  "/api/debug-env(.*)",
  "/api/debug-auth(.*)",
  "/api/auth-debug(.*)",
  "/api/test-auth-flow(.*)",
  "/api/clerk-diagnostic(.*)",
  "/api/csp-report(.*)",
  "/api/payments/webhook(.*)", // Stripe webhooks
  "/api/subscriptions(.*)", // Subscription management
  "/api/roles(.*)", // Role management
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
