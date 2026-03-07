export type NotificationCategory = "all" | "mentions" | "comments" | "follows" | "system";

export interface NotificationActor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface NotificationItem {
  id: string;
  eventType: string;
  category: Exclude<NotificationCategory, "all">;
  title: string;
  body: string;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  seenAt: string | null;
  archivedAt: string | null;
  isRead: boolean;
  isSeen: boolean;
  isArchived: boolean;
  actor: NotificationActor | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

export function mapEventTypeToCategory(eventType: string): Exclude<NotificationCategory, "all"> {
  const normalized = eventType.toLowerCase();
  if (normalized.includes("mention")) return "mentions";
  if (normalized.includes("comment") || normalized.includes("reply")) return "comments";
  if (normalized.includes("follow") || normalized.includes("friend")) return "follows";
  return "system";
}

export function getTimeAgo(dateString: string) {
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
}
