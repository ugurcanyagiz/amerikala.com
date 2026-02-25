"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Calendar,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Loader2,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { AppNotification, getTimeAgo, useNotifications } from "../contexts/NotificationContext";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";

type NotificationType = "all" | "likes" | "comments" | "events" | "friends" | "groups";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification, refreshNotifications, loading, error } = useNotifications();
  const [requestActionLoading, setRequestActionLoading] = useState<Record<string, boolean>>({});

  const types = [
    { value: "all", label: "Tümü", icon: Bell },
    { value: "likes", label: "Beğeniler", icon: Heart },
    { value: "comments", label: "Yorumlar", icon: MessageCircle },
    { value: "events", label: "Etkinlikler", icon: Calendar },
    { value: "friends", label: "Arkadaşlık", icon: UserPlus },
    { value: "groups", label: "Gruplar", icon: Bell },
  ] as const;

  const [selectedType, setSelectedType] = useState<NotificationType>("all");

  const filteredNotifications =
    selectedType === "all" ? notifications : notifications.filter((n) => n.type === selectedType);

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  const handleDeleteNotification = useCallback((id: string) => {
    deleteNotification(id);
  }, [deleteNotification]);

  const followInsert = useCallback(async (targetUserId: string) => {
    if (!user?.id) return false;

    const pairs = [
      { from: "follower_id", to: "following_id" },
      { from: "user_id", to: "target_user_id" },
      { from: "user_id", to: "followed_user_id" },
    ] as const;

    for (const pair of pairs) {
      const { error: insertError } = await supabase.from("follows").insert({ [pair.from]: user.id, [pair.to]: targetUserId });
      if (!insertError) return true;
    }

    return false;
  }, [user?.id]);

  const handleFriendRequestAction = useCallback(async (notification: AppNotification, action: "accept" | "reject") => {
    if (!user?.id || !notification.friendRequest?.isIncoming || notification.friendRequest.receiverId !== user.id) return;

    const requestId = notification.id;
    setRequestActionLoading((prev) => ({ ...prev, [requestId]: true }));

    try {
      const nextStatus = action === "accept" ? "accepted" : "rejected";
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: nextStatus, responded_at: new Date().toISOString() })
        .eq("requester_id", notification.friendRequest.requesterId)
        .eq("receiver_id", notification.friendRequest.receiverId)
        .eq("status", "pending");

      if (updateError) throw updateError;

      if (action === "accept") {
        await followInsert(notification.friendRequest.requesterId);
      }

      markAsRead(notification.id);
      await refreshNotifications();
    } catch (actionError) {
      console.error("Arkadaşlık isteği güncellenemedi:", actionError);
    } finally {
      setRequestActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  }, [followInsert, markAsRead, refreshNotifications, user?.id]);


  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bell className="h-8 w-8 text-red-500" />
                Bildirimler
                {unreadCount > 0 && <Badge variant="primary">{unreadCount} yeni</Badge>}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Beğeniler, yorumlar, etkinlikler, arkadaşlık ve grup bildirimleri gerçek zamanlı listelenir.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  markAllAsRead();
                }}
                className="gap-2"
                disabled={notifications.length === 0}
              >
                <CheckCheck size={16} />
                Tümünü Okundu İşaretle
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void refreshNotifications()} className="gap-2">
                <Loader2 size={14} className={loading ? "animate-spin" : ""} />
                Yenile
              </Button>
              <Link href="/ayarlar">
                <Button variant="ghost" size="icon">
                  <Settings size={20} />
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {types.map((type) => {
              const Icon = type.icon;
              const count =
                type.value === "all"
                  ? notifications.filter((n) => !n.isRead).length
                  : notifications.filter((n) => n.type === type.value && !n.isRead).length;

              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-smooth whitespace-nowrap ${
                    selectedType === type.value
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <Icon size={16} />
                  {type.label}
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedType === type.value
                          ? "bg-white/20"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {error && (
              <Card className="border border-red-200 bg-red-50/70">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => void refreshNotifications()}>Tekrar Dene</Button>
                </CardContent>
              </Card>
            )}
            {loading ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-10 w-10 mx-auto mb-4 text-red-500 animate-spin" />
                  <p className="text-neutral-600 dark:text-neutral-400">Bildirimler yükleniyor...</p>
                </CardContent>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
                  <h3 className="text-xl font-bold mb-2">Bildirim Yok</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">Henüz bu kategoride bildiriminiz bulunmuyor.</p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => handleMarkAsRead(notification.id)}
                  onDelete={() => handleDeleteNotification(notification.id)}
                  onFriendRequestAction={(action) => void handleFriendRequestAction(notification, action)}
                  actionLoading={Boolean(requestActionLoading[notification.id])}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
  onFriendRequestAction,
  actionLoading,
}: {
  notification: AppNotification;
  onRead: () => void;
  onDelete: () => void;
  onFriendRequestAction: (action: "accept" | "reject") => void;
  actionLoading: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const timeHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (notification.isRead || !cardRef.current) return;

    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") {
      return;
    }

    const node = cardRef.current;
    const observer = new window.IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onRead();
          observer.disconnect();
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [notification.id, notification.isRead, onRead]);

  const getIcon = () => {
    switch (notification.type) {
      case "likes":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comments":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "events":
        return <Calendar className="h-5 w-5 text-green-500" />;
      case "friends":
        return <UserPlus className="h-5 w-5 text-violet-500" />;
      case "groups":
        return <Bell className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-500" />;
    }
  };

  return (
    <Card ref={cardRef} className={`glass transition-smooth ${!notification.isRead ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar src={notification.user.avatar || undefined} fallback={notification.user.name} size="md" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm">
              {getIcon()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{notification.user.name}</span>{" "}
              <span className="text-neutral-600 dark:text-neutral-400">{notification.message}</span>
            </p>
            {notification.content && <p className="text-sm text-neutral-500 mt-1 truncate">&quot;{notification.content}&quot;</p>}
            <p className="text-xs text-neutral-400 mt-2" suppressHydrationWarning>
              {timeHydrated ? getTimeAgo(notification.createdAt) : "..."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <Button variant="ghost" size="icon" onClick={onRead} title="Okundu işaretle">
                <Check size={16} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onDelete} title="Sil">
              <Trash2 size={16} className="text-red-500" />
            </Button>
          </div>
        </div>

        {(notification.actionUrl || (notification.type === "friends" && notification.friendRequest?.isIncoming && notification.friendRequest.status === "pending")) && (
          <div className="mt-3 ml-14 flex flex-wrap items-center gap-2">
            <Link
              href={notification.actionUrl || "/profile"}
              onClick={onRead}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-sky-200 px-3 text-sm font-medium text-[var(--color-ink)] transition-all duration-150 ease-out hover:bg-[var(--color-surface-sunken)] hover:border-sky-300"
            >
              {notification.actionLabel || "Görüntüle"}
            </Link>

            {notification.type === "friends" && notification.friendRequest?.isIncoming && notification.friendRequest.status === "pending" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onFriendRequestAction("accept")}
                  disabled={actionLoading}
                  className="h-8"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : "Kabul Et"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onFriendRequestAction("reject")}
                  disabled={actionLoading}
                  className="h-8"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : "Reddet"}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
