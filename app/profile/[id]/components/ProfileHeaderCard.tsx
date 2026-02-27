import { Check, Copy, Heart, MapPin, MessageCircle, Send, Briefcase } from "lucide-react";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { ProfileStats, ProfileTab, PublicProfile, getDisplayName } from "./types";

type ProfileHeaderCardProps = {
  profile: PublicProfile;
  stats: ProfileStats;
  isFollowing: boolean;
  followLoading: boolean;
  dmLoading: boolean;
  copied: boolean;
  canInteract: boolean;
  onStatClick: (tab: ProfileTab) => void;
  onToggleFollow: () => void;
  onSendMessage: () => void;
  onCopyProfile: () => void;
  onQuickMessage: () => void;
};

export function ProfileHeaderCard({
  profile,
  stats,
  isFollowing,
  followLoading,
  dmLoading,
  copied,
  canInteract,
  onStatClick,
  onToggleFollow,
  onSendMessage,
  onCopyProfile,
  onQuickMessage,
}: ProfileHeaderCardProps) {
  return (
    <Card className="glass">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar src={profile.avatar_url ?? undefined} fallback={getDisplayName(profile)} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{getDisplayName(profile)}</h1>
              {profile.is_verified && <Badge variant="primary" size="sm">Doğrulanmış</Badge>}
            </div>
            <p className="text-neutral-500">@{profile.username || "kullanici"}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-1"><MapPin size={14} />{[profile.city, profile.state].filter(Boolean).join(", ") || "Konum yok"}</span>
              <span className="flex items-center gap-1"><Briefcase size={14} />Topluluk üyesi</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { key: "followers" as const, label: "Takipçi", value: stats.followers },
            { key: "following" as const, label: "Takip", value: stats.following },
            { key: "groups" as const, label: "Gruplar", value: stats.groups },
            { key: "events" as const, label: "Etkinlikler", value: stats.events },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onStatClick(item.key)}
              className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 text-center transition hover:bg-neutral-50 dark:hover:bg-neutral-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <p className="text-lg font-semibold">{item.value}</p>
              <p className="text-xs text-neutral-500">{item.label}</p>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <Button
            variant={isFollowing ? "secondary" : "primary"}
            onClick={onToggleFollow}
            disabled={!canInteract || followLoading}
            className="gap-2"
          >
            <Heart size={16} />
            {isFollowing ? "Takipten Çıkar" : "Arkadaş Ekle / Takip Et"}
          </Button>
          <Button
            variant="secondary"
            onClick={onSendMessage}
            disabled={!canInteract || dmLoading}
            className="gap-2"
          >
            <MessageCircle size={16} />
            Özel Mesaj Gönder
          </Button>
          <Button variant="secondary" onClick={onCopyProfile} className="gap-2">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Kopyalandı" : "Profil Linkini Kopyala"}
          </Button>
          <Button variant="secondary" onClick={onQuickMessage} className="gap-2">
            <Send size={16} />
            Hızlı Mesaj
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
