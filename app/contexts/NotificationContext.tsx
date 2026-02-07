"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";

export type NotificationCategory = "likes" | "comments" | "follows" | "events" | "messages" | "system";

export type NotificationAction = {
  label: string;
  href: string;
};

export type NotificationActor = {
  id?: string;
  name: string;
  avatar?: string;
};

export type Notification = {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  content?: string;
  actor?: NotificationActor;
  action?: NotificationAction;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
};

type NotificationInput = Omit<Notification, "id" | "createdAt" | "isRead" | "readAt"> & {
  createdAt?: string;
  isRead?: boolean;
};

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  getUnreadCount: (category?: NotificationCategory) => number;
  addNotification: (input: NotificationInput) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  getUnreadCount: () => 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
});

const STORAGE_KEY = "amerikala.notifications.v1";

const createNotificationId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const createSeedNotifications = (): Notification[] => {
  const now = Date.now();
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
  const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();

  return [
    {
      id: createNotificationId(),
      category: "likes",
      title: "Gönderin beğenildi",
      message: "gönderinizi beğendi",
      content: "NYC'deki etkinlik harikaydı!",
      actor: { name: "Zeynep Kaya", avatar: "/avatars/zeynep.jpg" },
      createdAt: minutesAgo(2),
      isRead: false,
      action: { label: "Gönderiyi Gör", href: "/meetups" },
    },
    {
      id: createNotificationId(),
      category: "follows",
      title: "Yeni takipçi",
      message: "sizi takip etmeye başladı",
      actor: { name: "Ahmet Yılmaz", avatar: "/avatars/ahmet.jpg" },
      createdAt: minutesAgo(15),
      isRead: false,
      action: { label: "Profili Gör", href: "/profile/ahmet" },
    },
    {
      id: createNotificationId(),
      category: "comments",
      title: "Yeni yorum",
      message: "gönderinize yorum yaptı",
      content: "Ben de gelmek istiyorum!",
      actor: { name: "Elif Demir", avatar: "/avatars/elif.jpg" },
      createdAt: hoursAgo(1),
      isRead: false,
      action: { label: "Yorumu Gör", href: "/meetups" },
    },
    {
      id: createNotificationId(),
      category: "events",
      title: "Yeni etkinlik",
      message: "yeni bir etkinlik oluşturdu",
      content: "Turkish Coffee & Networking",
      actor: { name: "NYC Meetup Group", avatar: "/groups/nyc.jpg" },
      createdAt: hoursAgo(3),
      isRead: true,
      action: { label: "Etkinliği Gör", href: "/events/1" },
    },
    {
      id: createNotificationId(),
      category: "messages",
      title: "Yeni mesaj",
      message: "size bir mesaj gönderdi",
      content: "Merhaba, tanışabilir miyiz?",
      actor: { name: "Mehmet Şahin", avatar: "/avatars/mehmet.jpg" },
      createdAt: hoursAgo(5),
      isRead: true,
      action: { label: "Mesajı Oku", href: "/messages" },
    },
    {
      id: createNotificationId(),
      category: "likes",
      title: "Fotoğrafın beğenildi",
      message: "fotoğrafınızı beğendi",
      actor: { name: "Can Özdemir", avatar: "/avatars/can.jpg" },
      createdAt: daysAgo(1),
      isRead: true,
    },
    {
      id: createNotificationId(),
      category: "events",
      title: "Etkinlik hatırlatması",
      message: "etkinliğiniz yarın başlıyor",
      content: "Weekend Hiking & Brunch",
      actor: { name: "LA Turkish Community", avatar: "/groups/la.jpg" },
      createdAt: daysAgo(1),
      isRead: true,
      action: { label: "Detayları Gör", href: "/events/3" },
    },
  ];
};

const normalizeNotifications = (items: Notification[]) =>
  items
    .map((item) => ({
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Notification[];
        setNotifications(normalizeNotifications(parsed));
        hasHydrated.current = true;
        return;
      } catch (error) {
        console.warn("Notifications storage parse error:", error);
      }
    }
    const seeded = createSeedNotifications();
    setNotifications(normalizeNotifications(seeded));
    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydrated.current || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const getUnreadCount = useCallback(
    (category?: NotificationCategory) => {
      if (!category) return unreadCount;
      return notifications.filter(
        (notification) => notification.category === category && !notification.isRead,
      ).length;
    },
    [notifications, unreadCount],
  );

  const addNotification = useCallback((input: NotificationInput) => {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const notification: Notification = {
      id: createNotificationId(),
      createdAt,
      isRead: input.isRead ?? false,
      readAt: input.isRead ? new Date().toISOString() : undefined,
      ...input,
    };
    setNotifications((prev) => normalizeNotifications([notification, ...prev]));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id && !notification.isRead
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.isRead ? notification : { ...notification, isRead: true, readAt: now },
      ),
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      getUnreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
    }),
    [
      notifications,
      unreadCount,
      getUnreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}
