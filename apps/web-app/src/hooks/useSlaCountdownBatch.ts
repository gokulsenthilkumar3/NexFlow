'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Ticket } from '@/hooks/useTickets';

export interface SlaCountdownEntry {
  remaining: string;
  isBreach: boolean;
  isWarning: boolean; // < 30 min
}

/**
 * useSlaCountdownBatch — manages ALL SLA countdowns with a single global
 * setInterval instead of one per ticket. Prevents hundreds of parallel timers.
 *
 * @param tickets — the full list of tickets (from useTickets)
 * @returns a Map<ticketId, SlaCountdownEntry> updated every second
 */
export function useSlaCountdownBatch(tickets: Ticket[]): Map<string, SlaCountdownEntry> {
  const [now, setNow] = useState(Date.now());

  // Single global 1-second interval
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Recompute map whenever tick changes (once/second) or ticket list changes
  const countdownMap = useMemo(() => {
    const map = new Map<string, SlaCountdownEntry>();

    for (const ticket of tickets) {
      if (!ticket.slaResolveAt) {
        map.set(ticket.id, { remaining: '—', isBreach: false, isWarning: false });
        continue;
      }

      const diff = new Date(ticket.slaResolveAt).getTime() - now;

      if (diff <= 0) {
        map.set(ticket.id, { remaining: 'BREACH', isBreach: true, isWarning: false });
        continue;
      }

      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      const remaining = `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
      const isWarning = diff < 30 * 60_000;

      map.set(ticket.id, { remaining, isBreach: false, isWarning });
    }

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, tickets]);

  return countdownMap;
}
