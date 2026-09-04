'use client';

import { useState, useCallback, useRef } from 'react';
import { SOCKET_EVENTS } from '@/lib/socket';

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

/**
 * useNotifications — consumes SOCKET_EVENTS.NOTIFICATION events and maintains
 * an in-memory notification list with unread count.
 *
 * Call `registerSocketListener(socket)` once after socket is initialised.
 * Returns the notification list, unread count, and control functions.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const idRef = useRef(0);

  const addNotification = useCallback((data: Partial<AppNotification>) => {
    const notification: AppNotification = {
      id: String(++idRef.current),
      message: data.message ?? 'New notification',
      type: data.type ?? 'info',
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // keep last 50
  }, []);

  /**
   * Wire up this hook to a socket instance.
   * Call this once inside the useEffect that initialises the socket.
   */
  const registerSocketListener = useCallback(
    (socket: ReturnType<typeof import('@/lib/socket').getSocket>) => {
      socket.on(SOCKET_EVENTS.NOTIFICATION, (data: Partial<AppNotification>) => {
        addNotification(data);
      });
    },
    [addNotification],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, addNotification, registerSocketListener, markAllRead, clearAll };
}
