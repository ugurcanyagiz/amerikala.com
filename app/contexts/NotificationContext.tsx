"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";

export type AppNotificationType = "likes" | "comments" | "events";

export interface AppNotification {
  id: string;
  source: "likes" | "comments" | "event_attendees";
  type: AppNotificationType;
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
  actionLabel?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  refreshNotifications: async () => {},
});

const storageKeys = {
  read: (userId: string) => `amerikala:notifications:read:${userId}`,
  dismissed: (userId: string) => `amerikala:notifications:dismissed:${userId}`,
};

const getDisplayName = (profile?: { first_name?: string | null; last_name?: string | null; username?: string | null } | null) => {
  if (!profile) return "Kullanıcı";
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.username || "Kullanıcı";
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dakika önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;

  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;

    if (!user || typeof window === "undefined") {
      setReadIds(new Set());
      setDismissedIds(new Set());
      setNotifications([]);
      return;
    }

    try {
      const storedRead = window.localStorage.getItem(storageKeys.read(user.id));
      const storedDismissed = window.localStorage.getItem(storageKeys.dismissed(user.id));

      setReadIds(new Set(storedRead ? JSON.parse(storedRead) : []));
      setDismissedIds(new Set(storedDismissed ? JSON.parse(storedDismissed) : []));
    } catch (error) {
      console.error("Bildirim durumları yüklenemedi:", error);
      setReadIds(new Set());
      setDismissedIds(new Set());
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    window.localStorage.setItem(storageKeys.read(user.id), JSON.stringify(Array.from(readIds)));
  }, [readIds, user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    window.localStorage.setItem(storageKeys.dismissed(user.id), JSON.stringify(Array.from(dismissedIds)));
  }, [dismissedIds, user]);

  const refreshNotifications = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);

    try {
      const { data: myPosts, error: postsError } = await supabase
        .from("posts")
        .select("id, content")
        .eq("user_id", user.id)
        .limit(500);

      if (postsError) throw postsError;

      const postIds = (myPosts || []).map((post) => post.id);
      const postContentById = new Map((myPosts || []).map((post) => [post.id, post.content as string | null]));

      const [likesResult, commentsResult, myEventsResult] = await Promise.all([
        postIds.length
          ? supabase
              .from("likes")
              .select("post_id, user_id, created_at")
              .in("post_id", postIds)
              .neq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
        postIds.length
          ? supabase
              .from("comments")
              .select("id, post_id, user_id, content, created_at")
              .in("post_id", postIds)
              .neq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("events").select("id, title").eq("organizer_id", user.id).limit(500),
      ]);

      if (likesResult.error) throw likesResult.error;
      if (commentsResult.error) throw commentsResult.error;
      if (myEventsResult.error) throw myEventsResult.error;

      const myEvents = myEventsResult.data || [];
      const eventIds = myEvents.map((event) => event.id);
      const eventTitleById = new Map(myEvents.map((event) => [event.id, event.title as string | null]));

      const eventAttendeesResult = eventIds.length
        ? await supabase
            .from("event_attendees")
            .select("event_id, user_id, status, created_at")
            .in("event_id", eventIds)
            .neq("user_id", user.id)
        : { data: [], error: null };

      if (eventAttendeesResult.error) throw eventAttendeesResult.error;

      const likes = likesResult.data || [];
      const comments = commentsResult.data || [];
      const eventAttendees = eventAttendeesResult.data || [];

      const actorIds = Array.from(
        new Set([
          ...likes.map((like) => like.user_id),
          ...comments.map((comment) => comment.user_id),
          ...eventAttendees.map((attendee) => attendee.user_id),
        ])
      );

      const profilesResult = actorIds.length
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name, username, avatar_url")
            .in("id", actorIds)
        : { data: [], error: null };

      if (profilesResult.error) throw profilesResult.error;

      const profilesById = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));

      const likeNotifications: AppNotification[] = likes.map((like) => {
        const actor = profilesById.get(like.user_id);
        const id = `likes:${like.post_id}:${like.user_id}`;

        return {
          id,
          source: "likes",
          type: "likes",
          user: {
            id: like.user_id,
            name: getDisplayName(actor),
            avatar: actor?.avatar_url || null,
          },
          message: "gönderinizi beğendi",
          content: postContentById.get(like.post_id) || undefined,
          createdAt: like.created_at,
          isRead: readIds.has(id),
          actionUrl: "/feed",
          actionLabel: "Gönderiyi Gör",
        };
      });

      const commentNotifications: AppNotification[] = comments.map((comment) => {
        const actor = profilesById.get(comment.user_id);
        const id = `comments:${comment.id}`;

        return {
          id,
          source: "comments",
          type: "comments",
          user: {
            id: comment.user_id,
            name: getDisplayName(actor),
            avatar: actor?.avatar_url || null,
          },
          message: "gönderinize yorum yaptı",
          content: comment.content,
          createdAt: comment.created_at,
          isRead: readIds.has(id),
          actionUrl: "/feed",
          actionLabel: "Yorumu Gör",
        };
      });

      const attendeeNotifications: AppNotification[] = eventAttendees
        .filter((attendee) => attendee.status !== "not_going")
        .map((attendee) => {
          const actor = profilesById.get(attendee.user_id);
          const id = `event_attendees:${attendee.event_id}:${attendee.user_id}`;
          const eventTitle = eventTitleById.get(attendee.event_id);

          return {
            id,
            source: "event_attendees",
            type: "events",
            user: {
              id: attendee.user_id,
              name: getDisplayName(actor),
              avatar: actor?.avatar_url || null,
            },
            message: "etkinliğinize katılım gösterdi",
            content: eventTitle || undefined,
            createdAt: attendee.created_at,
            isRead: readIds.has(id),
            actionUrl: `/meetups/${attendee.event_id}`,
            actionLabel: "Etkinliği Gör",
          };
        });

      const merged = [...likeNotifications, ...commentNotifications, ...attendeeNotifications]
        .filter((notification) => !dismissedIds.has(notification.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(merged);
    } catch (error) {
      console.error("Bildirimler alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, dismissedIds, readIds, user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (authLoading || !user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => {
        refreshNotifications();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
        refreshNotifications();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_attendees" }, () => {
        refreshNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, refreshNotifications, user]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
    setNotifications((prev) => prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((notification) => next.add(notification.id));
      return next;
    });

    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  }, [notifications]);

  const deleteNotification = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refreshNotifications }),
    [deleteNotification, loading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}

export { getTimeAgo };
