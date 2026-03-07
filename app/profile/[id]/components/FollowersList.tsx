import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/Button";
import { UserListItem, getDisplayName } from "./types";

type FollowersListProps = {
  items: UserListItem[];
  loading: boolean;
  hasMore: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
};

export function FollowersList({ items, loading, hasMore, search, onSearchChange, onLoadMore }: FollowersListProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Takipçi ara (isim veya kullanıcı adı)"
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz takipçisi yok.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={`/profile/${item.username || item.id}`} className="flex items-center justify-between rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={item.avatar_url ?? undefined} fallback={getDisplayName(item)} size="md" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{getDisplayName(item)}</p>
                  <p className="text-xs text-neutral-500 truncate">@{item.username || "kullanici"}</p>
                </div>
              </div>
            </Link>
          ))}
          {hasMore && (
            <Button variant="secondary" onClick={onLoadMore} className="w-full">Daha Fazla Yükle</Button>
          )}
        </div>
      )}
    </div>
  );
}
