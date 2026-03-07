import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

type GroupRow = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  member_count: number | null;
  isMember: boolean;
};

type GroupsListProps = {
  items: GroupRow[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

export function GroupsList({ items, loading, hasMore, onLoadMore }: GroupsListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">Henüz bir gruba katılmamış.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((group) => (
        <div key={group.id} className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium truncate">{group.name}</p>
            <p className="text-xs text-neutral-500 truncate">{group.description || "Topluluk grubu"}</p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1"><Users size={12} /> {group.member_count || 0} üye</p>
          </div>
          <Link href={`/groups/${group.slug || group.id}`}>
            <Button variant={group.isMember ? "secondary" : "primary"} size="sm">{group.isMember ? "Üye" : "Katıl"}</Button>
          </Link>
        </div>
      ))}
      {hasMore && (
        <Button variant="secondary" onClick={onLoadMore} className="w-full">Daha Fazla Yükle</Button>
      )}
    </div>
  );
}

export type { GroupRow };
