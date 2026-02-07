"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  Settings,
  Star,
  Trash2,
  UserPlus,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Notification, NotificationCategory, useNotifications } from "../contexts/NotificationContext";

type NotificationType = "all" | NotificationCategory;

export default function NotificationsPage() {
  const [selectedType, setSelectedType] = useState<NotificationType>("all");
  const {
    notifications,
    unreadCount,
    getUnreadCount,
    markAllAsRead,
    markAsRead,
    removeNotification,
    clearNotifications,
  } = useNotifications();

  const types = [
    { value: "all", label: "Tümü", icon: Bell },
    { value: "likes", label: "Beğeniler", icon: Heart },
    { value: "comments", label: "Yorumlar", icon: MessageCircle },
    { value: "follows", label: "Takipler", icon: UserPlus },
    { value: "events", label: "Etkinlikler", icon: Calendar },
    { value: "messages", label: "Mesajlar", icon: MessageCircle },
    { value: "system", label: "Sistem", icon: Star },
  ];

  const filteredNotifications = useMemo(
    () =>
      selectedType === "all"
        ? notifications
        : notifications.filter((notification) => notification.category === selectedType),
    [notifications, selectedType],
  );

  const hasNotifications = notifications.length > 0;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bell className="h-8 w-8 text-red-500" />
                Bildirimler
                {unreadCount > 0 && (
                  <Badge variant="primary">{unreadCount} yeni</Badge>
                )}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Etkinlikler, mesajlar ve topluluk aktiviteleri
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
                disabled={!hasNotifications || unreadCount === 0}
              >
                <CheckCheck size={16} />
                Tümünü Okundu İşaretle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearNotifications}
                className="gap-2"
                disabled={!hasNotifications}
              >
                <Trash2 size={16} />
                Temizle
              </Button>
              <Link href="/ayarlar">
                <Button variant="ghost" size="icon">
                  <Settings size={20} />
                </Button>
              </Link>
            </div>
          </div>

          {/* FILTER TABS */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {types.map((type) => {
              const Icon = type.icon;
              const count = type.value === "all" ? unreadCount : getUnreadCount(type.value);

              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value as NotificationType)}
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

          {/* NOTIFICATIONS LIST */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
                  <h3 className="text-xl font-bold mb-2">Bildirim Yok</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Henüz bu kategoride bildiriminiz bulunmuyor.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                  onDelete={() => removeNotification(notification.id)}
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
}: {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const getIcon = () => {
    switch (notification.category) {
      case "likes":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comments":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "follows":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "events":
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case "messages":
        return <MessageCircle className="h-5 w-5 text-indigo-500" />;
      case "system":
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-500" />;
    }
  };

  const timeLabel = formatRelativeTime(notification.createdAt);

  return (
    <Card
      className={`glass transition-smooth ${
        !notification.isRead
          ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10"
          : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar src={notification.actor?.avatar} fallback={notification.actor?.name || "S"} size="md" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm">
              {getIcon()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {notification.title}
            </p>
            <p className="text-sm">
              {notification.actor?.name && (
                <span className="font-semibold">{notification.actor?.name}</span>
              )}
              {notification.actor?.name && " "}
              <span className="text-neutral-600 dark:text-neutral-400">{notification.message}</span>
            </p>
            {notification.content && (
              <p className="text-sm text-neutral-500 mt-1 truncate">
                &quot;{notification.content}&quot;
              </p>
            )}
            <p className="text-xs text-neutral-400 mt-2">{timeLabel}</p>
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

        {notification.action && (
          <div className="mt-3 ml-14">
            <Link href={notification.action.href}>
              <Button variant="outline" size="sm">
                {notification.action.label || "Görüntüle"}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Az önce";
  }

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });

  if (absSeconds < 60) {
    return rtf.format(seconds, "second");
  }
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return rtf.format(hours, "hour");
  }
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) {
    return rtf.format(days, "day");
  }
  return date.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
