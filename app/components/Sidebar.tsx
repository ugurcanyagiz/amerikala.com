"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Calendar,
  Building2,
  Briefcase,
  ShoppingBag,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Plus,
  List,
  type LucideIcon,
  UserRound,
  MessageSquare,
  Bell,
  Scale,
  Star,
} from "lucide-react";

type NavLink = {
  type: "link";
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

type NavGroup = {
  type: "group";
  labelKey: string;
  icon: LucideIcon;
  children: { href: string; labelKey: string; icon?: LucideIcon }[];
};

type NavAction = {
  type: "action";
  labelKey: string;
  icon: LucideIcon;
  onClick: () => Promise<void> | void;
};

type NavItem = NavLink | NavGroup | NavAction;

const LABELS: Record<string, string> = {
  "sidebar.home": "Anasayfa",
  "sidebar.meetups": "Buluşmalar",
  "sidebar.events": "Etkinlikler",
  "sidebar.groups": "Gruplar",
  "sidebar.myEvents": "Etkinliklerim",
  "sidebar.createEvent": "Etkinlik Oluştur",
  "sidebar.realEstate": "Emlak",
  "sidebar.forRent": "Kiralık",
  "sidebar.forSale": "Satılık",
  "sidebar.postListing": "İlan Ver",
  "sidebar.myListings": "İlanlarım",
  "sidebar.jobs": "İş İlanları",
  "sidebar.lookingForJob": "İş Arayanlar",
  "sidebar.hiring": "İşçi Arayanlar",
  "sidebar.postJob": "İlan Ver",
  "sidebar.myJobListings": "İlanlarım",
  "sidebar.marketplace": "Alışveriş",
  "sidebar.allProducts": "Tüm İlanlar",
  "sidebar.postProduct": "İlan Ver",
  "sidebar.myProducts": "İlanlarım",
  "sidebar.profile": "Profilim",
  "sidebar.settings": "Ayarlar",
  "sidebar.logout": "Çıkış Yap",
};

function getDisplayName(
  profile: { first_name?: string | null; last_name?: string | null; full_name?: string | null; username?: string | null } | null | undefined,
  user?: { email?: string | null; user_metadata?: unknown } | null
) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataFullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const metadataName = typeof metadata.name === "string" ? metadata.name.trim() : "";

  const explicitFullName = profile?.full_name?.trim();
  if (explicitFullName) return explicitFullName;
  if (metadataFullName) return metadataFullName;
  if (metadataName) return metadataName;

  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (profileName) return profileName;

  const metadataFirstName = typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const metadataLastName = typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  const metadataCombinedName = [metadataFirstName, metadataLastName].filter(Boolean).join(" ").trim();
  if (metadataCombinedName) return metadataCombinedName;

  const metadataUsername = typeof metadata.username === "string" ? metadata.username.trim() : "";
  const emailLocalPart = user?.email?.split("@")[0]?.trim();

  return profile?.username || metadataUsername || emailLocalPart || "Kullanıcı";
}

function getAvatarUrl(
  profile: { avatar_url?: string | null } | null | undefined,
  user?: { user_metadata?: unknown } | null
) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataAvatar = typeof metadata.avatar_url === "string" ? metadata.avatar_url : typeof metadata.picture === "string" ? metadata.picture : null;

  return profile?.avatar_url || metadataAvatar || null;
}

function getUsernameLabel(
  profile: { username?: string | null } | null | undefined,
  user?: { email?: string | null; user_metadata?: unknown } | null
) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataUsername = typeof metadata.username === "string" ? metadata.username.trim() : "";
  const username = profile?.username?.trim() || metadataUsername;

  if (username) return username.startsWith("@") ? username : `@${username}`;

  const emailLocalPart = user?.email?.split("@")[0]?.trim();
  if (emailLocalPart) return `@${emailLocalPart}`;

  return "@user";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const t = (key: string) => LABELS[key] || key;

  const navItems = useMemo<NavItem[]>(() => [
    { type: "link", href: "/", labelKey: "sidebar.home", icon: Home },
    {
      type: "group",
      labelKey: "sidebar.meetups",
      icon: Calendar,
      children: [
        { href: "/meetups", labelKey: "sidebar.events" },
        { href: "/groups", labelKey: "sidebar.groups" },
        { href: "/meetups/my-events", labelKey: "sidebar.myEvents", icon: List },
        { href: "/meetups/create", labelKey: "sidebar.createEvent", icon: Plus },
      ],
    },
    {
      type: "group",
      labelKey: "sidebar.realEstate",
      icon: Building2,
      children: [
        { href: "/emlak/kiralik", labelKey: "sidebar.forRent" },
        { href: "/emlak/satilik", labelKey: "sidebar.forSale" },
        { href: "/emlak/ilan-ver", labelKey: "sidebar.postListing", icon: Plus },
        { href: "/emlak/ilanlarim", labelKey: "sidebar.myListings", icon: List },
      ],
    },
    {
      type: "group",
      labelKey: "sidebar.jobs",
      icon: Briefcase,
      children: [
        { href: "/is/ariyorum", labelKey: "sidebar.lookingForJob" },
        { href: "/is/isci-ariyorum", labelKey: "sidebar.hiring" },
        { href: "/is/ilan-ver", labelKey: "sidebar.postJob", icon: Plus },
        { href: "/is/ilanlarim", labelKey: "sidebar.myJobListings", icon: List },
      ],
    },
    {
      type: "group",
      labelKey: "sidebar.marketplace",
      icon: ShoppingBag,
      children: [
        { href: "/alisveris", labelKey: "sidebar.allProducts" },
        { href: "/alisveris/ilan-ver", labelKey: "sidebar.postProduct", icon: Plus },
        { href: "/alisveris/ilanlarim", labelKey: "sidebar.myProducts", icon: List },
      ],
    },
    { type: "link", href: "/profile", labelKey: "sidebar.profile", icon: User },
    { type: "link", href: "/ayarlar", labelKey: "sidebar.settings", icon: Settings },
    { type: "action", labelKey: "sidebar.logout", icon: LogOut, onClick: signOut },
  ], [signOut]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const toggleGroup = (key: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setOpenGroups((prev) => ({ ...prev, [key]: true }));
      return;
    }

    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAuthenticatedUser = Boolean(user);
  const displayName = getDisplayName(profile, user);
  const avatarUrl = getAvatarUrl(profile, user);
  const username = getUsernameLabel(profile, user);
  const isHomePage = pathname === "/";

  return (
    <aside
      className={`sticky top-16 hidden h-[calc(100vh-64px)] flex-col border-r transition-[width,opacity,transform] duration-300 ease-in-out md:flex ${
        isExpanded ? "w-[260px]" : "w-16"
      } ${
        isHomePage
          ? "border-[var(--color-border-light)] bg-[var(--color-surface-raised)]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex items-center justify-end border-b p-2 transition-colors duration-200 ${
          isHomePage ? "border-[var(--color-border-light)]" : "border-slate-200"
        }`}
      >
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          title={isExpanded ? "Daralt" : "Genişlet"}
          aria-label={isExpanded ? "Sidebar daralt" : "Sidebar genişlet"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isHomePage ? (
        <>
          <nav className={`flex-1 overflow-y-auto py-8 transition-[padding] duration-300 ${isExpanded ? "px-5" : "px-2"}`}>
            <SidebarSection title="Keşfet" icon={Star} collapsed={!isExpanded}>
              <SidebarItem href="/meetups" label="Etkinlikler" icon={Calendar} active={isActive("/meetups")} collapsed={!isExpanded} />
              <SidebarItem href="/groups" label="Gruplar" icon={UserRound} active={isActive("/groups")} collapsed={!isExpanded} />
              <SidebarItem href="/search" label="İnsanlar" icon={User} active={pathname.startsWith("/search")} collapsed={!isExpanded} />
            </SidebarSection>

            <SidebarSection title="Topluluk" icon={Home} collapsed={!isExpanded}>
              <SidebarItem href="/meetups" label="Buluşmalar" icon={Calendar} active={isActive("/meetups")} collapsed={!isExpanded} />
              <SidebarItem href="/messages" label="Mesajlar" icon={MessageSquare} active={isActive("/messages")} collapsed={!isExpanded} />
              <SidebarItem href="/notifications" label="Bildirimler" icon={Bell} active={isActive("/notifications")} collapsed={!isExpanded} />
            </SidebarSection>

            <SidebarSection title="Yasal" icon={Scale} collapsed={!isExpanded}>
              <SidebarItem href="/profile" label="Profil" icon={User} active={isActive("/profile")} collapsed={!isExpanded} />
              <SidebarItem href="/ayarlar" label="Ayarlar" icon={Settings} active={isActive("/ayarlar")} collapsed={!isExpanded} />
            </SidebarSection>
          </nav>

          <div className={`border-t p-3 transition-[padding] duration-300 ${isExpanded ? "px-5" : "px-2"} border-[var(--color-border-light)]`}>
            <Link
              href={hasAuthenticatedUser ? "/emlak/ilan-ver" : "/login"}
              className={`flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-white shadow-[0_18px_28px_-20px_rgba(229,57,53,0.95)] transition-[width,opacity,transform,padding] duration-300 hover:bg-[var(--color-primary-hover)] ${
                isExpanded ? "px-4 py-3 text-lg font-semibold" : "mx-auto h-10 w-10"
              }`}
              title="İlan Ver"
              aria-label="İlan Ver"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className={`overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 sr-only"}`}>
                İlan Ver
              </span>
            </Link>
          </div>
        </>
      ) : (
        <>

          {hasAuthenticatedUser && isExpanded && (
            <div className="border-b border-slate-200 px-6 py-8 text-center transition-[opacity,transform] duration-300 ease-out">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xl font-semibold text-slate-500">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span>{getInitials(displayName)}</span>
                )}
              </div>
              <p className="text-xl font-semibold text-slate-900">{displayName}</p>
              <p className="mt-1 text-sm text-slate-500">{username}</p>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const label = t(item.labelKey);
                const Icon = item.icon;

                if (item.type === "link") {
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[width,opacity,transform,color,background-color] duration-200 ${
                          active
                            ? "bg-slate-100 font-medium text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        } ${!isExpanded ? "justify-center" : ""}`}
                        title={!isExpanded ? label : undefined}
                        aria-label={!isExpanded ? label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className={`flex-1 truncate overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 sr-only"}`}>
                          {label}
                        </span>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-[opacity,transform] duration-200 ${isExpanded ? "opacity-100" : "opacity-0 -translate-x-1"}`} />
                      </Link>
                    </li>
                  );
                }

                if (item.type === "action") {
                  return (
                    <li key={item.labelKey}>
                      <button
                        onClick={item.onClick}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-[width,opacity,transform,color,background-color] duration-200 hover:bg-red-50 hover:text-red-600 ${
                          !isExpanded ? "justify-center" : ""
                        }`}
                        title={!isExpanded ? label : undefined}
                        aria-label={!isExpanded ? label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className={`flex-1 overflow-hidden whitespace-nowrap text-left transition-[width,opacity] duration-200 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 sr-only"}`}>
                          {label}
                        </span>
                      </button>
                    </li>
                  );
                }

                const groupExpanded = openGroups[item.labelKey] ?? false;
                const hasActiveChild = item.children.some((c) => isActive(c.href));

                return (
                  <li key={item.labelKey}>
                    <button
                      onClick={() => toggleGroup(item.labelKey)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[width,opacity,transform,color,background-color] duration-200 ${
                        hasActiveChild
                          ? "bg-slate-100 font-medium text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      } ${!isExpanded ? "justify-center" : ""}`}
                      title={!isExpanded ? label : undefined}
                      aria-label={!isExpanded ? label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className={`flex-1 overflow-hidden whitespace-nowrap text-left transition-[width,opacity] duration-200 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 sr-only"}`}>
                        {label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-[opacity,transform] duration-200 ${isExpanded ? "opacity-100" : "opacity-0 -translate-x-1"} ${groupExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isExpanded && groupExpanded && (
                      <ul className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-4">
                        {item.children.map((child) => {
                          const active = isActive(child.href);
                          const childLabel = t(child.labelKey);
                          const ChildIcon = child.icon;

                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                  active
                                    ? "bg-slate-100 font-medium text-slate-900"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                {ChildIcon ? <ChildIcon className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                                <span className="flex-1 truncate">{childLabel}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </aside>
  );
}

function SidebarSection({
  title,
  icon: Icon,
  children,
  collapsed,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  collapsed: boolean;
}) {
  return (
    <div className="mb-8 border-b border-[var(--color-border-light)] pb-6 last:border-none">
      <p className={`mb-3 flex items-center text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-ink-tertiary)] transition-[opacity,transform] duration-200 ${collapsed ? "justify-center gap-0" : "gap-2"}`}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className={`overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ${collapsed ? "w-0 opacity-0 sr-only" : "w-auto opacity-100"}`}>{title}</span>
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-xl px-3 py-2.5 text-base transition-[width,opacity,transform,color,background-color] duration-200 ${
        active ? "bg-[var(--color-surface)] font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-overlay)]"
      } ${collapsed ? "justify-center gap-0" : "gap-3"}`}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={`overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ${collapsed ? "w-0 opacity-0 sr-only" : "w-auto opacity-100"}`}>{label}</span>
    </Link>
  );
}
