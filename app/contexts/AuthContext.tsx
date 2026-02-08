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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const normalizeRole = (value: unknown): UserRole | undefined => {
    if (value === "user" || value === "moderator" || value === "admin") {
      return value;
    }
    return undefined;
  };

  // Fetch profile - sadece mevcut alanları al, eksik olanlar için varsayılan değer kullan
  const fetchProfile = useCallback(
    async (userId: string, fallbackRole?: UserRole): Promise<Profile | null> => {
      try {
        console.log("Fetching profile for:", userId);

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, city, state, profession, bio, avatar_url, role, created_at, updated_at, first_name, last_name, show_full_name, cover_image_url, website, is_verified, follower_count, following_count"
          )
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Profile fetch error:", error.message);

          // Hata durumunda minimal profile döndür
          return {
            id: userId,
            username: null,
            full_name: null,
            first_name: null,
            last_name: null,
            show_full_name: true,
            city: null,
            state: null,
            profession: null,
            bio: null,
            avatar_url: null,
            cover_image_url: null,
            website: null,
            role: fallbackRole ?? "user",
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

        // Varsayılan değerlerle profile döndür
        const profileWithDefaults: Profile = {
          id: data.id,
          username: data.username ?? null,
          full_name: data.full_name ?? null,
          first_name: data.first_name ?? null,
          last_name: data.last_name ?? null,
          show_full_name: data.show_full_name ?? true,
          city: data.city ?? null,
          state: data.state ?? null,
          profession: data.profession ?? null,
          bio: data.bio ?? null,
          avatar_url: data.avatar_url ?? null,
          cover_image_url: data.cover_image_url ?? null,
          website: data.website ?? null,
          role: normalizeRole(data.role) ?? fallbackRole ?? "user",
          is_verified: data.is_verified ?? false,
          follower_count: data.follower_count ?? 0,
          following_count: data.following_count ?? 0,
          created_at: data.created_at ?? new Date().toISOString(),
          updated_at: data.updated_at ?? new Date().toISOString(),
        };

        return profileWithDefaults;
      } catch (error) {
        console.error("Error in fetchProfile:", error);
        // Hata durumunda minimal profile döndür
        return {
          id: userId,
          username: null,
          full_name: null,
          first_name: null,
          last_name: null,
          show_full_name: true,
          city: null,
          state: null,
          profession: null,
          bio: null,
          avatar_url: null,
          cover_image_url: null,
          website: null,
          role: fallbackRole ?? "user",
          is_verified: false,
          follower_count: 0,
          following_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    },
    []
  );

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user && mountedRef.current) {
      const newProfile = await fetchProfile(
        user.id,
        normalizeRole(user.app_metadata?.role) ?? normalizeRole(user.user_metadata?.role)
      );
      if (mountedRef.current) {
        setProfile(newProfile);
      }
    }
  }, [user, fetchProfile]);

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
    mountedRef.current = true;
    let isInitialized = false;

    const initAuth = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      try {
        console.log("Initializing auth...");
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error.message);
          if (mountedRef.current) setLoading(false);
          return;
        }

        console.log("Session found:", !!currentSession);

        if (mountedRef.current) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }

        if (currentSession?.user && mountedRef.current) {
          console.log("Fetching profile for user:", currentSession.user.id);
          const userProfile = await fetchProfile(
            currentSession.user.id,
            normalizeRole(currentSession.user.app_metadata?.role) ??
              normalizeRole(currentSession.user.user_metadata?.role)
          );
          console.log("Profile fetched:", !!userProfile);
          if (mountedRef.current) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mountedRef.current) {
          console.log("Auth initialization complete, setting loading to false");
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);

        if (!mountedRef.current) return;

        if (event === "SIGNED_OUT") {
          console.log("User signed out - clearing state");
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          console.log("User signed in or token refreshed");
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);

          if (newSession?.user) {
            const userProfile = await fetchProfile(
              newSession.user.id,
              normalizeRole(newSession.user.app_metadata?.role) ??
                normalizeRole(newSession.user.user_metadata?.role)
            );
            if (mountedRef.current) {
              setProfile(userProfile);
            }
          } else if (mountedRef.current) {
            setProfile(null);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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
