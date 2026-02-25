"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getTimeAgo, type NotificationItem, type NotificationListResponse } from "@/lib/notifications";
import { useAuth } from "./AuthContext";

export interface AppNotification {
  id: string;
  type: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  message: string;
  content?: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  refreshNotifications: async () => {},
});

function toAppNotification(item: NotificationItem): AppNotification {
  return {
    id: item.id,
    type: item.category,
    user: {
      id: item.actor?.id ?? "system",
      name: item.actor?.name ?? "Sistem",
      avatar: item.actor?.avatarUrl ?? null,
    },
    message: item.title,
    content: item.body,
    createdAt: item.createdAt,
    isRead: item.isRead,
    actionUrl: item.actionUrl ?? "/notifications",
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications?limit=20&offset=0", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Bildirimler alınamadı");
      }

      const payload = (await response.json()) as NotificationListResponse;
      setNotifications(payload.items.map(toAppNotification));
    } catch (fetchError) {
      console.error(fetchError);
      setError("Bildirimler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refreshNotifications();
  }, [authLoading, refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    await fetch("/api/notifications/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", ids: [id] }),
    });
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    await fetch("/api/notifications/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    await fetch("/api/notifications/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive_selected", ids: [id] }),
    });
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, error, markAsRead, markAllAsRead, deleteNotification, refreshNotifications }),
    [notifications, unreadCount, loading, error, markAsRead, markAllAsRead, deleteNotification, refreshNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}

export { getTimeAgo };
