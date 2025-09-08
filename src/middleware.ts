import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/test-chat(.*)",
  "/test-auth(.*)",
  "/clerk-test(.*)",
  "/api/webhooks(.*)",
  // Removed: "/api/chat(.*)" - now requires authentication
  // Removed: "/api/chat-minimal(.*)" - now requires authentication
  // Removed: "/api/advisors(.*)" - now requires authentication
  // Removed: "/api/conversations(.*)" - now requires authentication
  "/api/test-simple(.*)",
  "/api/debug-env(.*)",
  "/api/debug-auth(.*)",
  "/api/auth-debug(.*)",
  "/api/test-auth-flow(.*)",
  "/api/clerk-diagnostic(.*)",
  "/api/csp-report(.*)",
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
