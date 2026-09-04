'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/clerk-mock';
import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';

// ─── Metadata (works in server components; kept here for colocation reference)
// For App Router: move to a separate `export const metadata` in a server component wrapper.
// The per-page title/OG is set in layout.tsx.

const icons = {
  kanban:    'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
  zap:       'M13 2L3 14h9l-1 8 10-12h-9l1-8',
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
};

// ─── Scroll Reveal Hook ────────────────────────────────────────────────────────
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────
const STATS = [
  { value: '100+', label: 'Teams trust NexFlow' },
  { value: '10k+', label: 'Tickets resolved' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '< 2s',  label: 'Avg response time' },
];

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function Home() {
  const { isLoaded, isSignedIn } = useUser();

  const features = [
    { icon: icons.kanban,    title: 'Beautiful Kanban Boards',   desc: 'Visual sprint management with drag-and-drop workflows.' },
    { icon: icons.analytics, title: 'Rich Analytics Dashboards', desc: 'Turn raw work items into actionable team insights.' },
    { icon: icons.zap,       title: 'Lightning-fast Performance', desc: 'Real-time updates powered by a high-speed backend.' },
    { icon: icons.shield,    title: 'Enterprise Secure Auth',    desc: 'Clerk identity platform — your credentials are secure.' },
  ];

  const { ref: featuresRef, isVisible: featuresVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl px-8 py-16">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-900/40">
            N
          </div>
          <span className="text-4xl font-black tracking-tight text-white">
            Nex<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Flow</span>
          </span>
        </div>

        {/* Hero headline */}
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 text-white">
          Visualize Your Team&apos;s
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
            Workflow Like Never Before
          </span>
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
          Transform your work items into beautiful, actionable insights.
          The unified command hub that makes your team actually want to check their metrics.
        </p>

        {/* CTA Buttons — auth-aware */}
        <div className="flex items-center justify-center gap-4 mb-14">
          {isLoaded && isSignedIn ? (
            <Link
              href="/dashboard"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:scale-105 active:scale-95"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:scale-105 active:scale-95"
            >
              Get Started Free →
            </Link>
          )}
          <Link
            href="/sign-in"
            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 hover:border-slate-600 transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Stats strip */}
        <div
          ref={statsRef}
          className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          {STATS.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
              <p className="text-[11px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Feature Grid — scroll-reveal */}
        <div
          ref={featuresRef}
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card rounded-2xl p-5 text-left hover:border-blue-500/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center mb-3 group-hover:bg-blue-600/30 transition-colors">
                <Icon d={f.icon} size={18} className="text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="absolute bottom-6 text-xs text-slate-600">© 2026 NexFlow. Built with passion for DevOps teams.</p>
    </div>
  );
}
