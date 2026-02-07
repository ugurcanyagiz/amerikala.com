"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { Profile, UserRole, hasPermission, ROLE_PERMISSIONS } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isModerator: boolean;
  can: (permission: keyof typeof ROLE_PERMISSIONS.user) => boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  role: "user",
  isAdmin: false,
  isModerator: false,
  can: () => false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

const fetchProfileFromDB = async (userId: string): Promise<Profile | null> => {
  try {
    console.log("Fetching profile for:", userId);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, username, full_name, city, state, bio, avatar_url, role, created_at, updated_at, first_name, last_name, show_full_name, cover_image_url, website, is_verified, follower_count, following_count"
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile fetch error:", error.message);

      return {
        id: userId,
        username: null,
        full_name: null,
        first_name: null,
        last_name: null,
        show_full_name: true,
        city: null,
        state: null,
        bio: null,
        avatar_url: null,
        cover_image_url: null,
        website: null,
        role: "user",
        is_verified: false,
        follower_count: 0,
        following_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    if (!data) {
      console.log("No profile data found");
      return null;
    }

    console.log("Profile data received:", data);

    return {
      id: data.id,
      username: data.username ?? null,
      full_name: data.full_name ?? null,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      show_full_name: data.show_full_name ?? true,
      city: data.city ?? null,
      state: data.state ?? null,
      bio: data.bio ?? null,
      avatar_url: data.avatar_url ?? null,
      cover_image_url: data.cover_image_url ?? null,
      website: data.website ?? null,
      role: data.role ?? "user",
      is_verified: data.is_verified ?? false,
      follower_count: data.follower_count ?? 0,
      following_count: data.following_count ?? 0,
      created_at: data.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in fetchProfile:", error);
    return {
      id: userId,
      username: null,
      full_name: null,
      first_name: null,
      last_name: null,
      show_full_name: true,
      city: null,
      state: null,
      bio: null,
      avatar_url: null,
      cover_image_url: null,
      website: null,
      role: "user",
      is_verified: false,
      follower_count: 0,
      following_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const effectIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const newProfile = await fetchProfileFromDB(user.id);
    setProfile(newProfile);
  }, [user]);

  // Sign out - düzeltilmiş versiyon
  const signOut = useCallback(async () => {
    console.log("SignOut called - starting...");
    
    try {
      // Önce local state'i temizle
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Supabase'den çıkış yap - scope: 'global' ile tüm sekmelerde çıkış
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Supabase signOut error:", error.message);
      } else {
        console.log("Supabase signOut successful");
      }
      
      // LocalStorage'ı temizle (Supabase session)
      if (typeof window !== 'undefined') {
        // Supabase session key'lerini temizle
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
        console.log("LocalStorage cleaned");
      }
      
    } catch (error) {
      console.error("SignOut error:", error);
    }
    
    console.log("SignOut completed");
  }, []);

  // Initialize auth state
  useEffect(() => {
    const effectId = ++effectIdRef.current;
    setLoading(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (effectIdRef.current === effectId) {
        console.warn("Auth init timeout - forcing loading false");
        setLoading(false);
      }
    }, 4000);

    const applySession = async (newSession: Session | null) => {
      if (effectIdRef.current !== effectId) return;

      if (!newSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(newSession);
      setUser(newSession.user);
      const userProfile = await fetchProfileFromDB(newSession.user.id);
      if (effectIdRef.current !== effectId) return;
      setProfile(userProfile);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (effectIdRef.current !== effectId) return;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        console.log("Auth state changed:", event);

        if (event === "SIGNED_OUT") {
          await applySession(null);
          return;
        }

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await applySession(newSession);
        }
      }
    );

    return () => {
      effectIdRef.current += 1;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      subscription.unsubscribe();
    };
  }, []);

  // Computed values - with safe defaults
  const role: UserRole = profile?.role || "user";
  const isAdmin = role === "admin";
  const isModerator = role === "moderator" || role === "admin";

  // Permission checker
  const can = useCallback((permission: keyof typeof ROLE_PERMISSIONS.user): boolean => {
    return hasPermission(role, permission);
  }, [role]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    role,
    isAdmin,
    isModerator,
    can,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// Hook for requiring auth
export function useRequireAuth(redirectTo: string = "/login") {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo;
    }
  }, [user, loading, redirectTo]);

  return { user, loading };
}

// Hook for requiring specific role
export function useRequireRole(
  requiredRole: UserRole | UserRole[],
  redirectTo: string = "/"
) {
  const { user, role, loading } = useAuth();
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const hasAccess = roles.includes(role);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    } else if (!loading && user && !hasAccess) {
      window.location.href = redirectTo;
    }
  }, [user, loading, hasAccess, redirectTo]);

  return { user, role, loading, hasAccess };
}
