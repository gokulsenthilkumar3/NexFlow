/**
 * NexFlow Route Configuration
 *
 * PUBLIC_ROUTES: paths accessible without authentication.
 * To add a new public page (e.g. /about), append it here.
 * The middleware imports this list automatically.
 */
export const PUBLIC_ROUTES = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
] as const;
