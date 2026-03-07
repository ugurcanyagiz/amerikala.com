"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Archive, Search, Loader2 } from "lucide-react";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Modal } from "@/app/components/ui/Modal";
import { getTimeAgo, type NotificationCategory, type NotificationItem, type NotificationListResponse } from "@/lib/notifications";
import { useNotifications } from "@/app/contexts/NotificationContext";

const TABS: Array<{ value: NotificationCategory; label: string }> = [
  { value: "all", label: "Tümü" },
  { value: "mentions", label: "Bahsetmeler" },
  { value: "comments", label: "Yorumlar" },
  { value: "follows", label: "Takipler" },
  { value: "system", label: "Sistem" },
];

function dateBucket(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return "Bugün";
  if (diffDays < 7) return "Bu hafta";
  return "Daha eski";
}

function getFriendRequestId(item: NotificationItem) {
  const value = item.metadata?.friend_request_id;
  return typeof value === "string" ? value : null;
}

export default function NotificationsCenter({ initialData }: { initialData: NotificationListResponse }) {
  const { unreadCount, refreshNotifications } = useNotifications();
  const [items, setItems] = useState(initialData.items);
  const [total, setTotal] = useState(initialData.total);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [tab, setTab] = useState<NotificationCategory>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [activeFriendRequestNotification, setActiveFriendRequestNotification] = useState<NotificationItem | null>(null);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const tabMatch = tab === "all" ? true : item.category === tab;
      const textMatch = q.length < 2 ? true : `${item.title} ${item.body}`.toLowerCase().includes(q);
      return tabMatch && textMatch;
    });
  }, [items, query, tab]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, NotificationItem[]>>((acc, item) => {
      const bucket = dateBucket(item.createdAt);
      acc[bucket] = acc[bucket] ?? [];
      acc[bucket].push(item);
      return acc;
    }, {});
  }, [filtered]);

  const loadPage = async (offset: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notifications?limit=20&offset=${offset}&tab=${tab}&q=${encodeURIComponent(query)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Bildirimler alınamadı.");
      const payload = (await response.json()) as NotificationListResponse;
      setItems((prev) => (append ? [...prev, ...payload.items] : payload.items));
      setTotal(payload.total);
      setHasMore(payload.hasMore);
      setSelected(new Set());
    } catch {
      setError("Bildirimler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action: "mark_all_read" | "mark_read" | "archive_selected", ids?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      if (!response.ok) throw new Error("Aksiyon başarısız");
      await loadPage(0, false);
      await refreshNotifications();
    } catch {
      setError("İşlem tamamlanamadı.");
      setLoading(false);
    }
  };

  const respondFriendRequest = async (decision: "accept" | "reject") => {
    if (!activeFriendRequestNotification) return;

    setFriendRequestLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond_friend_request",
          notificationId: activeFriendRequestNotification.id,
          decision,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Arkadaşlık isteği güncellenemedi.");
      }

      setActiveFriendRequestNotification(null);
      await loadPage(0, false);
      await refreshNotifications();
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Arkadaşlık isteği güncellenemedi.");
      }
    } finally {
      setFriendRequestLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2"><Bell className="w-6 h-6 text-red-500" /> Bildirimler</h1>
              <p className="text-sm text-neutral-500 mt-1">{unreadCount} okunmamış · toplam {total}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => void runAction("mark_all_read")} disabled={loading || items.length === 0}>
                <CheckCheck className="w-4 h-4 mr-2" /> Tümünü okundu yap
              </Button>
              <Button variant="secondary" onClick={() => void runAction("archive_selected", Array.from(selected))} disabled={loading || selected.size === 0}>
                <Archive className="w-4 h-4 mr-2" /> Seçilenleri arşivle
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTab(t.value);
                  void loadPage(0, false);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border ${tab === t.value ? "bg-red-500 text-white border-red-500" : "border-neutral-300 text-neutral-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                void loadPage(0, false);
              }}
              placeholder="Bildirimlerde ara"
              className="w-full rounded-lg border border-neutral-300 pl-10 pr-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <Card><CardContent className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Yükleniyor...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-neutral-500">Bildirim bulunamadı.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([bucket, bucketItems]) => (
          <section key={bucket} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{bucket}</h2>
            {bucketItems.map((item) => {
              const hasFriendRequestAction = item.eventType === "social.friend_request" && Boolean(getFriendRequestId(item));

              return (
                <Card key={item.id} className={item.isRead ? "" : "border-l-4 border-l-red-500"}>
                  <CardContent className="p-4 flex gap-3">
                    <input
                      type="checkbox"
                      aria-label="Bildirimi seç"
                      checked={selected.has(item.id)}
                      onChange={(event) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (event.target.checked) next.add(item.id);
                          else next.delete(item.id);
                          return next;
                        });
                      }}
                      className="mt-1"
                    />
                    <Avatar src={item.actor?.avatarUrl ?? undefined} fallback={item.actor?.name ?? "S"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-sm text-neutral-600 mt-0.5">{item.body}</p>
                          <p className="text-xs text-neutral-400 mt-1">{getTimeAgo(item.createdAt)}</p>
                        </div>
                        {!item.isRead && <Badge variant="primary">Yeni</Badge>}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void runAction("mark_read", [item.id])} disabled={item.isRead || loading}>Okundu yap</Button>
                        <Button size="sm" variant="secondary" onClick={() => void runAction("archive_selected", [item.id])} disabled={loading}>Arşivle</Button>
                        {hasFriendRequestAction ? (
                          <button
                            type="button"
                            onClick={() => setActiveFriendRequestNotification(item)}
                            className="text-sm text-blue-600 hover:underline inline-flex items-center"
                          >
                            Görüntüle
                          </button>
                        ) : (
                          <Link href={item.actionUrl ?? "/notifications"} className="text-sm text-blue-600 hover:underline inline-flex items-center">Görüntüle</Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        ))
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => void loadPage(items.length, true)} disabled={loading}>
            {loading ? "Yükleniyor..." : "Daha fazla yükle"}
          </Button>
        </div>
      )}

      <Modal
        open={Boolean(activeFriendRequestNotification)}
        onClose={() => {
          if (!friendRequestLoading) {
            setActiveFriendRequestNotification(null);
          }
        }}
        title="Arkadaşlık isteği"
        description="Bu isteği kabul edebilir veya reddedebilirsiniz."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">{activeFriendRequestNotification?.title}</p>
            <p className="text-sm text-slate-600 mt-1">{activeFriendRequestNotification?.body}</p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setActiveFriendRequestNotification(null)}
              disabled={friendRequestLoading}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void respondFriendRequest("reject")}
              loading={friendRequestLoading}
            >
              Reddet
            </Button>
            <Button
              type="button"
              onClick={() => void respondFriendRequest("accept")}
              loading={friendRequestLoading}
            >
              Kabul et
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
