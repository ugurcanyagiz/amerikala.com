"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Bell,
  Heart,
  MessageCircle,
  Users,
  Calendar,
  UserPlus,
  Star,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Filter
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";

type NotificationType = "all" | "likes" | "comments" | "follows" | "events" | "messages";

export default function NotificationsPage() {
  const [selectedType, setSelectedType] = useState<NotificationType>("all");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const types = [
    { value: "all", label: "Tümü", icon: Bell },
    { value: "likes", label: "Beğeniler", icon: Heart },
    { value: "comments", label: "Yorumlar", icon: MessageCircle },
    { value: "follows", label: "Takipler", icon: UserPlus },
    { value: "events", label: "Etkinlikler", icon: Calendar },
    { value: "messages", label: "Mesajlar", icon: MessageCircle },
  ];

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = selectedType === "all" 
    ? notifications 
    : notifications.filter(n => n.type === selectedType);

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
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
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

          {/* FILTER TABS */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {types.map((type) => {
              const Icon = type.icon;
              const count = type.value === "all" 
                ? notifications.filter(n => !n.isRead).length
                : notifications.filter(n => n.type === type.value && !n.isRead).length;
              
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
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedType === type.value
                        ? "bg-white/20"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    }`}>
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
  onDelete 
}: { 
  notification: typeof NOTIFICATIONS[0];
  onRead: () => void;
  onDelete: () => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "likes": return <Heart className="h-5 w-5 text-red-500" />;
      case "comments": return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "follows": return <UserPlus className="h-5 w-5 text-green-500" />;
      case "events": return <Calendar className="h-5 w-5 text-purple-500" />;
      case "messages": return <MessageCircle className="h-5 w-5 text-indigo-500" />;
      default: return <Bell className="h-5 w-5 text-neutral-500" />;
    }
  };

  return (
    <Card className={`glass transition-smooth ${
      !notification.isRead 
        ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10" 
        : ""
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar src={notification.user.avatar} fallback={notification.user.name} size="md" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm">
              {getIcon()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{notification.user.name}</span>
              {" "}
              <span className="text-neutral-600 dark:text-neutral-400">{notification.message}</span>
            </p>
            {notification.content && (
              <p className="text-sm text-neutral-500 mt-1 truncate">
                &quot;{notification.content}&quot;
              </p>
            )}
            <p className="text-xs text-neutral-400 mt-2">{notification.time}</p>
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

const NOTIFICATIONS = [
  {
    id: 1,
    type: "likes" as const,
    user: { name: "Zeynep Kaya", avatar: "/avatars/zeynep.jpg" },
    message: "gönderinizi beğendi",
    content: "NYC'deki etkinlik harikaydı!",
    time: "2 dakika önce",
    isRead: false,
    actionUrl: "/meetups",
    actionLabel: "Gönderiyi Gör",
  },
  {
    id: 2,
    type: "follows" as const,
    user: { name: "Ahmet Yılmaz", avatar: "/avatars/ahmet.jpg" },
    message: "sizi takip etmeye başladı",
    time: "15 dakika önce",
    isRead: false,
    actionUrl: "/profile/ahmet",
    actionLabel: "Profili Gör",
  },
  {
    id: 3,
    type: "comments" as const,
    user: { name: "Elif Demir", avatar: "/avatars/elif.jpg" },
    message: "gönderinize yorum yaptı",
    content: "Ben de gelmek istiyorum!",
    time: "1 saat önce",
    isRead: false,
    actionUrl: "/meetups",
    actionLabel: "Yorumu Gör",
  },
  {
    id: 4,
    type: "events" as const,
    user: { name: "NYC Meetup Group", avatar: "/groups/nyc.jpg" },
    message: "yeni bir etkinlik oluşturdu",
    content: "Turkish Coffee & Networking",
    time: "3 saat önce",
    isRead: true,
    actionUrl: "/events/1",
    actionLabel: "Etkinliği Gör",
  },
  {
    id: 5,
    type: "messages" as const,
    user: { name: "Mehmet Şahin", avatar: "/avatars/mehmet.jpg" },
    message: "size bir mesaj gönderdi",
    content: "Merhaba, tanışabilir miyiz?",
    time: "5 saat önce",
    isRead: true,
    actionUrl: "/messages",
    actionLabel: "Mesajı Oku",
  },
  {
    id: 6,
    type: "likes" as const,
    user: { name: "Can Özdemir", avatar: "/avatars/can.jpg" },
    message: "fotoğrafınızı beğendi",
    time: "1 gün önce",
    isRead: true,
  },
  {
    id: 7,
    type: "events" as const,
    user: { name: "LA Turkish Community", avatar: "/groups/la.jpg" },
    message: "etkinliğiniz yarın başlıyor",
    content: "Weekend Hiking & Brunch",
    time: "1 gün önce",
    isRead: true,
    actionUrl: "/events/3",
    actionLabel: "Detayları Gör",
  },
];
