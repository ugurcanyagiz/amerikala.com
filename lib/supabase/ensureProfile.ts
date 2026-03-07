import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const readMeta = (user: User, key: string) => {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export const ensureProfileExists = async (user: User) => {
  const fullName = readMeta(user, "full_name") || readMeta(user, "name");
  const firstName = readMeta(user, "first_name");
  const lastName = readMeta(user, "last_name");
  const username = readMeta(user, "username") || user.email?.split("@")[0] || null;
  const avatarUrl = readMeta(user, "avatar_url") || readMeta(user, "picture");

  return supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    );
};
