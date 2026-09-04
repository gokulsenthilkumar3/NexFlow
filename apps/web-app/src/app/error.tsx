'use client';

// Root-level error boundary for Next.js App Router.
// Catches unhandled runtime errors across the entire app tree.
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('[NexFlow Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Something went wrong</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
