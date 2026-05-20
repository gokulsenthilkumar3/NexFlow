import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * NexFlow Authentication Middleware (Clerk)
 *
 * Protects all routes under /dashboard.
 * Public routes (sign-in, sign-up, landing page "/") are accessible without auth.
 * Any request to a protected route without a valid Clerk session is redirected
 * to /sign-in automatically by Clerk.
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
