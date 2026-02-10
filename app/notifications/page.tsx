"use client";

import Link from "next/link";
import { useState } from "react";
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

type NotificationType = "all" | "likes" | "comments" | "events";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification, loading } = useNotifications();

  const types = [
    { value: "all", label: "Tümü", icon: Bell },
    { value: "likes", label: "Beğeniler", icon: Heart },
    { value: "comments", label: "Yorumlar", icon: MessageCircle },
    { value: "events", label: "Etkinlikler", icon: Calendar },
  ] as const;

  const [selectedType, setSelectedType] = useState<NotificationType>("all");

  const filteredNotifications =
    selectedType === "all" ? notifications : notifications.filter((n) => n.type === selectedType);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
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
                Feed beğenileri, yorumlar ve etkinlik katılımları gerçek zamanlı listelenir.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2" disabled={notifications.length === 0}>
                <CheckCheck size={16} />
                Tümünü Okundu İşaretle
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
                  onRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
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
  notification: AppNotification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "likes":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comments":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "events":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-500" />;
    }
  };

  return (
    <Card className={`glass transition-smooth ${!notification.isRead ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10" : ""}`}>
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
            <p className="text-xs text-neutral-400 mt-2">{getTimeAgo(notification.createdAt)}</p>
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

        {notification.actionUrl && (
          <div className="mt-3 ml-14">
            <Link href={notification.actionUrl}>
              <Button variant="outline" size="sm">
                {notification.actionLabel || "Görüntüle"}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
