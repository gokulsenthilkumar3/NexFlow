import { SignIn } from '@clerk/nextjs';

/**
 * Clerk-hosted Sign-In page for NexFlow.
 * The [[...sign-in]] catch-all route handles all Clerk auth sub-routes
 * (e.g., /sign-in, /sign-in/factor-one, /sign-in/sso-callback, etc.)
 */
export default function SignInPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-900/40">
            N
          </div>
          <span className="text-4xl font-black tracking-tight text-white">
            Nex<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Flow</span>
          </span>
        </div>

        {/* Clerk SignIn Component */}
        <SignIn
          appearance={{
            elements: {
              card: 'bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-3xl',
              headerTitle: 'text-white font-black',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton: 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition-all',
              dividerLine: 'bg-slate-700',
              dividerText: 'text-slate-500',
              formFieldInput: 'bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/30',
              formFieldLabel: 'text-slate-400 text-xs font-semibold uppercase tracking-wider',
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30',
              footerActionLink: 'text-blue-400 hover:text-blue-300',
              identityPreviewText: 'text-slate-300',
              identityPreviewEditButton: 'text-blue-400',
            },
            variables: {
              colorPrimary: '#3b82f6',
              colorBackground: 'transparent',
              colorText: '#f1f5f9',
              colorTextSecondary: '#94a3b8',
              borderRadius: '0.75rem',
            },
          }}
        />
      </div>
    </div>
  );
}
