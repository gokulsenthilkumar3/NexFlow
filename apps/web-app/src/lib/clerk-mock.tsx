'use client';
import React from 'react';

/**
 * Mock Clerk Provider for local development without API keys.
 * This prevents the frontend from crashing when `.env.local` uses placeholder keys.
 */
export function ClerkProvider({ children }: { children: React.ReactNode, afterSignOutUrl?: string }) {
  return <>{children}</>;
}

export function useAuth() {
  return {
    userId: 'mock-user-123',
    sessionId: 'mock-session-456',
    getToken: async () => 'mock-token',
    signOut: () => Promise.resolve(),
    isSignedIn: true,
    isLoaded: true,
  };
}

export function useUser() {
  return {
    user: {
      id: 'mock-user-123',
      firstName: 'Mock',
      lastName: 'User',
      fullName: 'Mock User',
      primaryEmailAddress: { emailAddress: 'mock@example.com' },
      emailAddresses: [{ emailAddress: 'mock@example.com' }],
      imageUrl: 'https://ui-avatars.com/api/?name=Mock+User&background=0D8ABC&color=fff',
    },
    isLoaded: true,
    isSignedIn: true,
  };
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  return null;
}

export function UserButton({ appearance: _appearance }: { appearance?: unknown } = {}) {
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg ring-2 ring-slate-800">
      MU
    </div>
  );
}

export function SignIn({ appearance: _appearance }: { appearance?: unknown } = {}) {
  return <div className="text-white p-8 bg-slate-900 rounded-xl border border-slate-700">Mock Sign In Component (Clerk is bypassed)</div>;
}

export function SignUp({ appearance: _appearance }: { appearance?: unknown } = {}) {
  return <div className="text-white p-8 bg-slate-900 rounded-xl border border-slate-700">Mock Sign Up Component (Clerk is bypassed)</div>;
}
