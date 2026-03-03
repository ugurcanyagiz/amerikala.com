"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Calendar,
  User,
  Settings,
  ChevronRight,
  Plus,
  type LucideIcon,
  UserRound,
  MessageSquare,
  Bell,
  Scale,
  Star,
  HandHelping,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const hasAuthenticatedUser = Boolean(user);

  return (
    <aside
      className={`sticky top-16 hidden h-[calc(100vh-64px)] flex-col border-r transition-[width,opacity,transform] duration-300 ease-in-out md:flex ${
        isExpanded ? "w-[260px]" : "w-16"
      } border-[var(--color-border-light)] bg-[var(--color-surface-raised)]`}
    >
      <div className="flex items-center justify-end border-b border-[var(--color-border-light)] p-2 transition-colors duration-200">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          title={isExpanded ? "Daralt" : "Genişlet"}
          aria-label={isExpanded ? "Sidebar daralt" : "Sidebar genişlet"}
        >
          <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      <>
        <nav className={`section-neutral flex-1 overflow-y-auto py-6 transition-[padding] duration-300 ${isExpanded ? "px-5" : "px-2"}`}>
            <SidebarSection title="Keşfet" icon={Star} collapsed={!isExpanded}>
              <SidebarItem href="/meetups" label="Etkinlikler" icon={Calendar} active={isActive("/meetups")} collapsed={!isExpanded} />
              <SidebarItem href="/groups" label="Gruplar" icon={UserRound} active={isActive("/groups")} collapsed={!isExpanded} />
              <SidebarItem href="/search" label="İnsanlar" icon={User} active={pathname.startsWith("/search")} collapsed={!isExpanded} />
            </SidebarSection>

            <SidebarSection title="Topluluk" icon={Home} collapsed={!isExpanded}>
              <SidebarItem href="/meetups" label="Buluşmalar" icon={Calendar} active={isActive("/meetups")} collapsed={!isExpanded} />
              <SidebarItem href="/messages" label="Mesajlar" icon={MessageSquare} active={isActive("/messages")} collapsed={!isExpanded} />
              <SidebarItem href="/yardimlasma" label="Yardımlaşma" icon={HandHelping} active={isActive("/yardimlasma")} collapsed={!isExpanded} />
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
    <div className={`section-surface mb-5 last:mb-0 ${collapsed ? "px-2 py-3" : "p-4"}`}>
      <p className={`mb-3 flex items-center text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-ink-tertiary)] transition-[opacity,transform] duration-200 ${collapsed ? "justify-center" : "gap-2"}`}>
        <Icon className={`shrink-0 transition-[width,height,opacity] duration-200 ${collapsed ? "h-0 w-0 opacity-0" : "h-3.5 w-3.5 opacity-100"}`} />
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
      className={`nav-pill group flex items-center text-base transition-[width,opacity,transform,color,background-color,border-color,padding] duration-200 ${active ? "nav-pill-active font-semibold" : ""} ${collapsed ? "justify-center gap-0 px-2 py-2" : "gap-3 px-3 py-2.5"}`}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      <span className={`inline-flex items-center justify-center rounded-lg transition-[width,height,background-color] duration-200 ${collapsed ? "h-9 w-9" : "h-8 w-8"} ${active ? "bg-white/80" : "group-hover:bg-white/70"}`}>
        <Icon className={`shrink-0 transition-[width,height] duration-200 ${collapsed ? "h-5 w-5" : "h-[18px] w-[18px]"}`} />
      </span>
      <span className={`overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ${collapsed ? "w-0 opacity-0 sr-only" : "w-auto opacity-100"}`}>{label}</span>
    </Link>
  );
}
