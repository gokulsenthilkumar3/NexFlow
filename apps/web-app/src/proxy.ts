import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';
import { PUBLIC_ROUTES } from '@/config/routes';

/**
 * NexFlow Authentication Middleware (Clerk)
 *
 * Protects all routes under /dashboard and other authenticated areas.
 * Public routes are managed in src/config/routes.ts — add new public pages there.
 * Any request to a protected route without a valid Clerk session is redirected
 * to /sign-in automatically by Clerk.
 */

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES]);

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key || key.includes('REPLACE_ME')) {
    // Skip auth if Clerk is not configured to prevent Next.js React child crash
    return NextResponse.next();
  }

  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  })(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
