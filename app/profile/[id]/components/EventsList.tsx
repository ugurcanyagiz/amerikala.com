import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  city: string | null;
  location_name: string | null;
  cover_image_url: string | null;
  joined: boolean;
};

type EventsListProps = {
  items: EventRow[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

export function EventsList({ items, loading, hasMore, onLoadMore }: EventsListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">Henüz etkinliğe katılmamış.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((event) => (
        <div key={event.id} className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative shrink-0">
              {event.cover_image_url ? (
                <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{event.title}</p>
              <p className="text-xs text-neutral-500 flex items-center gap-1"><CalendarDays size={12} /> {new Date(event.event_date).toLocaleDateString("tr-TR")}</p>
              <p className="text-xs text-neutral-500 flex items-center gap-1 truncate"><MapPin size={12} /> {[event.location_name, event.city].filter(Boolean).join(" · ") || "Konum yok"}</p>
            </div>
          </div>
          <Link href={`/events/${event.id}`}>
            <Button variant={event.joined ? "outline" : "primary"} size="sm">{event.joined ? "Katıldın" : "Detay"}</Button>
          </Link>
        </div>
      ))}
      {hasMore && (
        <Button variant="secondary" onClick={onLoadMore} className="w-full">Daha Fazla Yükle</Button>
      )}
    </div>
  );
}

export type { EventRow };
