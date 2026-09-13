'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { UserButton, useUser } from '@/lib/clerk-mock';

// ── Icon paths ─────────────────────────────────────────────────────────────────
const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  kanban:    'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18',
  ticket:    'M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6 M14 2v6h6',
  git:       'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9',
  book:      'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
  people:    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  office:    'M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-6h6v6 M9 10h.01 M15 10h.01',
};

export const NAV_ITEMS = [
  { icon: icons.dashboard, label: 'Overview',         href: '/dashboard' },
  { icon: icons.kanban,    label: 'Project Boards',   href: '/projects/DEFAULT/board' },
  { icon: icons.ticket,    label: 'Helpdesk Tickets', href: '/helpdesk/queue' },
  { icon: icons.people,    label: 'People',           href: '/people' },
  { icon: icons.office,    label: 'Workplace',        href: '/workplace' },
  { icon: icons.git,       label: 'Repo & Pipelines', href: '/integrations' },
  { icon: icons.book,      label: 'Knowledge Base',   href: '/helpdesk/kb' },
  { icon: icons.analytics, label: 'Analytics',        href: '/helpdesk/sla' },
];

interface AppSidebarProps {
  /** Override to show a back-button instead of full nav */
  compact?: boolean;
  /** Label for the back button when compact=true */
  backLabel?: string;
  /** Route for the back button when compact=true */
  backHref?: string;
  /** Sub-nav items rendered below the back button in compact mode */
  subNav?: { label: string; href: string }[];
}

/**
 * Unified application sidebar.
 * Active state is derived from the current pathname — never hardcoded.
 */
export function AppSidebar({
  compact = false,
  backLabel = 'Dashboard',
  backHref = '/dashboard',
  subNav,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  if (compact) {
    return (
      <aside className="w-56 shrink-0 border-r border-slate-800 flex flex-col p-4 bg-slate-900/50">
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 px-2"
        >
          ← {backLabel}
        </button>
        {subNav && (
          <nav className="space-y-1">
            {subNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 flex flex-col p-4 bg-slate-900/50 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-10">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-900/30">
          N
        </div>
        <span className="text-xl font-black">
          Nex<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">ora</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href !== null &&
            (pathname === item.href || pathname.startsWith(item.href + '/'));
          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon d={item.icon} size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
            ) : (
              <button key={item.label} type="button" disabled title="Coming soon" aria-disabled="true" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-slate-600 cursor-not-allowed">
                <Icon d={item.icon} size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
        })}
      </nav>

      {/* User profile */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40">
          <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
          <div className="flex flex-col overflow-hidden">
            {isLoaded ? (
              <>
                <p className="text-xs font-semibold text-white truncate">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </p>
                <p className="text-[10px] text-slate-500">Authenticated</p>
              </>
            ) : (
              <div className="w-20 h-3 bg-slate-700 animate-pulse rounded" />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
