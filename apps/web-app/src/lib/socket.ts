import { io, Socket } from 'socket.io-client';

/**
 * Singleton Socket.io client for NexFlow real-time updates.
 *
 * Connects to the Realtime Service via the Nginx /ws/ proxy.
 * The URL is injected from NEXT_PUBLIC_WS_URL — no hardcoding.
 *
 * Usage:
 *   import { getSocket } from '@/lib/socket';
 *   const socket = getSocket(clerkToken);
 *   socket.on('workItemUpdated', handler);
 */

let socketInstance: Socket | null = null;

export function getSocket(authToken?: string | null): Socket {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8080';

  socketInstance = io(wsUrl, {
    path: '/ws/socket.io',
    auth: authToken ? { token: authToken } : undefined,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socketInstance.on('connect', () => {
    console.log('[NexFlow Socket] Connected:', socketInstance?.id);
  });

  socketInstance.on('disconnect', (reason) => {
    console.warn('[NexFlow Socket] Disconnected:', reason);
  });

  socketInstance.on('connect_error', (err) => {
    console.error('[NexFlow Socket] Connection error:', err.message);
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

// ── Typed event constants ──────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  WORK_ITEM_UPDATED: 'workItemUpdated',
  TICKET_UPDATED: 'ticketUpdated',
  AI_SUGGESTION: 'aiSuggestion',
  NOTIFICATION: 'notification',
} as const;
