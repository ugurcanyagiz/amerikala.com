"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";
import { devLog } from "@/lib/debug/devLogger";

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
  error: string | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
}

const getNotificationTimestamp = (notification: Pick<AppNotification, "createdAt">) => {
  const timestamp = new Date(notification.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const compareNotifications = (a: AppNotification, b: AppNotification) => {
  const timestampDiff = getNotificationTimestamp(b) - getNotificationTimestamp(a);
  if (timestampDiff !== 0) return timestampDiff;
  return a.id.localeCompare(b.id);
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
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
  if (Number.isNaN(date.getTime())) return "Az önce";
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
  const userId = user?.id ?? null;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [notificationStateHydrated, setNotificationStateHydrated] = useState(false);
  const readIdsRef = useRef(readIds);
  const dismissedIdsRef = useRef(dismissedIds);
  const refreshInFlightRef = useRef(false);
  const refreshQueuedRef = useRef(false);

  const isAbortError = (err: unknown) => {
    if (!err) return false;
    if (err instanceof DOMException) {
      return err.name === "AbortError" || err.name === "TimeoutError";
    }

    if (typeof err !== "object") return false;

    const maybeError = err as { name?: string; message?: string; details?: string; code?: string };
    const combinedText = `${maybeError.name || ""} ${maybeError.message || ""} ${maybeError.details || ""} ${maybeError.code || ""}`.toLowerCase();

    return (
      maybeError.name === "AbortError" ||
      maybeError.name === "TimeoutError" ||
      combinedText.includes("aborterror") ||
      combinedText.includes("signal is aborted") ||
      combinedText.includes("request aborted")
    );
  };

  useEffect(() => {
    readIdsRef.current = readIds;
  }, [readIds]);

  useEffect(() => {
    dismissedIdsRef.current = dismissedIds;
  }, [dismissedIds]);

  useEffect(() => {
    if (authLoading) return;

    if (!userId || typeof window === "undefined") {
      setReadIds(new Set());
      setDismissedIds(new Set());
      setNotifications([]);
      readIdsRef.current = new Set();
      dismissedIdsRef.current = new Set();
      setNotificationStateHydrated(false);
      return;
    }

    try {
      const storedRead = window.localStorage.getItem(storageKeys.read(userId));
      const storedDismissed = window.localStorage.getItem(storageKeys.dismissed(userId));
      const nextReadIds = new Set(storedRead ? JSON.parse(storedRead) : []);
      const nextDismissedIds = new Set(storedDismissed ? JSON.parse(storedDismissed) : []);

      readIdsRef.current = nextReadIds;
      dismissedIdsRef.current = nextDismissedIds;
      setReadIds(nextReadIds);
      setDismissedIds(nextDismissedIds);
    } catch (error) {
      console.error("Bildirim durumları yüklenemedi:", error);
      const fallbackReadIds = new Set<string>();
      const fallbackDismissedIds = new Set<string>();
      readIdsRef.current = fallbackReadIds;
      dismissedIdsRef.current = fallbackDismissedIds;
      setReadIds(fallbackReadIds);
      setDismissedIds(fallbackDismissedIds);
    } finally {
      setNotificationStateHydrated(true);
    }
  }, [authLoading, userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.setItem(storageKeys.read(userId), JSON.stringify(Array.from(readIds)));
  }, [readIds, userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.setItem(storageKeys.dismissed(userId), JSON.stringify(Array.from(dismissedIds)));
  }, [dismissedIds, userId]);

  const refreshNotifications = useCallback(async () => {
    if (refreshInFlightRef.current) {
      refreshQueuedRef.current = true;
      return;
    }

    if (authLoading) {
      return;
    }

    if (!notificationStateHydrated) {
      return;
    }

    if (!userId) {
      setNotifications([]);
      return;
    }

    devLog("notifications", "refresh:start", { userId });
    setLoading(true);
    setError(null);
    refreshInFlightRef.current = true;

    try {
      const { data: myPosts, error: postsError } = await supabase
        .from("posts")
        .select("id, content")
        .eq("user_id", userId)
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
              .neq("user_id", userId)
          : Promise.resolve({ data: [], error: null }),
        postIds.length
          ? supabase
              .from("comments")
              .select("id, post_id, user_id, content, created_at")
              .in("post_id", postIds)
              .neq("user_id", userId)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("events").select("id, title").eq("organizer_id", userId).limit(500),
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
            .neq("user_id", userId)
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
          isRead: readIdsRef.current.has(id),
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
          isRead: readIdsRef.current.has(id),
          actionUrl: "/feed",
          actionLabel: "Yorumu Gör",
        };
      });

      const attendeeNotifications: AppNotification[] = eventAttendees
        .filter((attendee) => attendee.status === "pending" || attendee.status === "going")
        .map((attendee) => {
          const actor = profilesById.get(attendee.user_id);
          const id = `event_attendees:${attendee.event_id}:${attendee.user_id}`;
          const eventTitle = eventTitleById.get(attendee.event_id);
          const isApprovalRequest = attendee.status === "pending";

          return {
            id,
            source: "event_attendees",
            type: "events",
            user: {
              id: attendee.user_id,
              name: getDisplayName(actor),
              avatar: actor?.avatar_url || null,
            },
            message: isApprovalRequest ? "etkinliğinize katılım isteği gönderdi" : "etkinliğinize katılım gösterdi",
            content: eventTitle || undefined,
            createdAt: attendee.created_at,
            isRead: readIdsRef.current.has(id),
            actionUrl: `/meetups/${attendee.event_id}`,
            actionLabel: isApprovalRequest ? "İsteği İncele" : "Etkinliği Gör",
          };
        });

      const dedupedById = new Map<string, AppNotification>();
      const readIdsSnapshot = readIdsRef.current;

      [...likeNotifications, ...commentNotifications, ...attendeeNotifications].forEach((notification) => {
        const candidate = readIdsSnapshot.has(notification.id) && !notification.isRead ? { ...notification, isRead: true } : notification;
        const existing = dedupedById.get(candidate.id);

        if (!existing) {
          dedupedById.set(candidate.id, candidate);
          return;
        }

        const nextTimestamp = getNotificationTimestamp(candidate);
        const existingTimestamp = getNotificationTimestamp(existing);

        if (nextTimestamp > existingTimestamp) {
          dedupedById.set(candidate.id, candidate);
          return;
        }

        if (nextTimestamp === existingTimestamp && candidate.id.localeCompare(existing.id) < 0) {
          dedupedById.set(candidate.id, candidate);
        }
      });

      const merged = Array.from(dedupedById.values())
        .filter((notification) => !dismissedIdsRef.current.has(notification.id))
        .sort(compareNotifications);

      setNotifications(merged);
      devLog("notifications", "refresh:set", { userId, count: merged.length });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      console.error("Bildirimler alınamadı:", error);
      setError("Bildirimler yüklenemedi.");
    } finally {
      refreshInFlightRef.current = false;
      setLoading(false);
      devLog("notifications", "refresh:end", { userId });

      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false;
        void refreshNotifications();
      }
    }
  }, [authLoading, notificationStateHydrated, userId]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setNotifications([]);
      return;
    }

    if (!notificationStateHydrated) {
      return;
    }

    void refreshNotifications();
  }, [authLoading, notificationStateHydrated, refreshNotifications, userId]);

  useEffect(() => {
    if (authLoading || !userId || !notificationStateHydrated) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => {
        void refreshNotifications();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
        void refreshNotifications();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_attendees" }, () => {
        void refreshNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, notificationStateHydrated, refreshNotifications, userId]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      readIdsRef.current = next;
      return next;
    });

    setNotifications((prev) => prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((notification) => next.add(notification.id));
      readIdsRef.current = next;
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
    () => ({ notifications, unreadCount, loading, error, markAsRead, markAllAsRead, deleteNotification, refreshNotifications }),
    [deleteNotification, error, loading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}

export { getTimeAgo };
