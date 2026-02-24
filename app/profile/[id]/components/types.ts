export type ProfileTab = "followers" | "following" | "groups" | "events";

export type PublicProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  is_verified?: boolean | null;
  is_blocked?: boolean | null;
};

export type ProfileStats = {
  followers: number;
  following: number;
  groups: number;
  events: number;
};

export type UserListItem = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: "followers", label: "Takipçi" },
  { key: "following", label: "Takip" },
  { key: "groups", label: "Gruplar" },
  { key: "events", label: "Etkinlikler" },
];

export const getDisplayName = (profile: Pick<UserListItem, "full_name" | "first_name" | "last_name" | "username"> | null) => {
  if (!profile) return "Kullanıcı";
  return profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username || "Kullanıcı";
};
