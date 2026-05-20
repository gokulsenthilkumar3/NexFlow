import axios from 'axios';

/**
 * Axios instance pre-configured to point at the NexFlow API Gateway.
 * The base URL is injected from NEXT_PUBLIC_API_URL so no hardcoding occurs.
 *
 * The request interceptor automatically attaches the Clerk session JWT as a
 * Bearer token on every outgoing request. Clerk's getToken() is called lazily
 * (window.__clerk__) so this works both in browser and SSR environments.
 *
 * The response interceptor handles 401 Unauthorized responses gracefully by
 * logging out the user via the Clerk client.
 */

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ── Request Interceptor: attach Clerk JWT ──────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  try {
    // Clerk exposes a global helper in the browser for token retrieval.
    // During SSR there is no window so we skip token attachment.
    if (typeof window !== 'undefined') {
      const clerk = (window as any).__clerk__;
      if (clerk?.session) {
        const token = await clerk.session.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
  } catch {
    // Non-fatal: proceed without token (unauthenticated request)
  }
  return config;
});

// ── Response Interceptor: handle 401 ──────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      try {
        const clerk = (window as any).__clerk__;
        await clerk?.signOut();
        window.location.href = '/sign-in';
      } catch {
        // Ignore sign-out errors
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
