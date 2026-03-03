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
  Star,
  HandHelping,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const hasAuthenticatedUser = Boolean(user);
  const collapsed = !isExpanded;

  const sections: { title: string; icon: LucideIcon; items: NavItem[] }[] = [
    {
      title: "Keşfet",
      icon: Star,
      items: [
        { href: "/meetups", label: "Etkinlikler", icon: Calendar },
        { href: "/groups", label: "Gruplar", icon: UserRound },
        { href: "/search", label: "İnsanlar", icon: User },
      ],
    },
    {
      title: "Topluluk",
      icon: Home,
      items: [
        { href: "/meetups", label: "Buluşmalar", icon: Calendar },
        { href: "/messages", label: "Mesajlar", icon: MessageSquare },
        { href: "/yardimlasma", label: "Yardımlaşma", icon: HandHelping },
        { href: "/notifications", label: "Bildirimler", icon: Bell },
      ],
    },
  ];

  const footerItems: NavItem[] = [
    { href: "/profile", label: "Profil", icon: User },
    { href: "/ayarlar", label: "Ayarlar", icon: Settings },
  ];

  return (
    <aside
      className={`sticky top-16 hidden h-[calc(100vh-64px)] shrink-0 flex-col border-r border-[var(--color-border-light)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(247,248,250,0.98)_100%)] transition-[width] duration-300 ease-[var(--ease-out-expo)] md:flex ${
        isExpanded ? "w-[272px]" : "w-[72px]"
      }`}
    >
      <header className={`sticky top-0 z-10 border-b border-[var(--color-border-light)]/90 bg-[var(--color-surface-raised)]/90 backdrop-blur transition-[padding] duration-300 ${isExpanded ? "px-5 py-4" : "px-3 py-4"}`}>
        <div className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-tertiary)] transition-opacity duration-200 ${collapsed ? "pointer-events-none w-0 opacity-0" : "opacity-100"}`}>
            Navigasyon
          </p>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-xl border border-transparent p-2 text-[var(--color-ink-secondary)] transition-all duration-200 hover:border-[var(--color-border-light)] hover:bg-white hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)]/40"
            title={isExpanded ? "Daralt" : "Genişlet"}
            aria-label={isExpanded ? "Sidebar daralt" : "Sidebar genişlet"}
          >
            <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </header>

      <nav className={`flex-1 overflow-y-auto py-4 transition-[padding] duration-300 ${isExpanded ? "px-4" : "px-2"}`}>
        {sections.map((section) => (
          <SidebarSection key={section.title} title={section.title} icon={section.icon} collapsed={collapsed}>
            {section.items.map((item) => (
              <SidebarItem
                key={`${section.title}-${item.href}-${item.label}`}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
                collapsed={collapsed}
                badge={item.badge}
              />
            ))}
          </SidebarSection>
        ))}
      </nav>

      <footer className={`sticky bottom-0 space-y-3 border-t border-[var(--color-border-light)] bg-[var(--color-surface-raised)]/95 pb-4 pt-3 backdrop-blur transition-[padding] duration-300 ${isExpanded ? "px-4" : "px-2"}`}>
        <div className="space-y-1">
          {footerItems.map((item) => (
            <SidebarItem
              key={`footer-${item.href}`}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>

        <Link
          href={hasAuthenticatedUser ? "/emlak/ilan-ver" : "/login"}
          className={`group relative flex h-12 items-center justify-center overflow-visible rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)] text-white shadow-[0_12px_24px_-18px_rgba(196,55,55,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 ${
            isExpanded ? "gap-2 px-4" : "mx-auto w-12"
          }`}
          title="İlan Ver"
          aria-label="İlan Ver"
        >
          <Plus className="h-5 w-5 shrink-0" />
          <span className={`text-[15px] font-semibold transition-[width,opacity] duration-200 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 sr-only"}`}>
            İlan Ver
          </span>
          {collapsed && <CollapsedTooltip label="İlan Ver" />}
        </Link>
      </footer>
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
    <section className="mb-5 last:mb-0">
      <p className={`mb-2 flex items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-tertiary)] transition-all duration-200 ${collapsed ? "justify-center" : "gap-2 px-3"}`}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className={`${collapsed ? "sr-only" : ""}`}>{title}</span>
      </p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  badge,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex h-11 items-center overflow-visible rounded-xl border px-3 text-[14px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action)]/40 ${
        active
          ? "border-[var(--color-border-light)] bg-[rgba(30,42,56,0.08)] text-[var(--color-navy)]"
          : "border-transparent text-[var(--color-ink-secondary)] hover:border-[var(--color-border-light)] hover:bg-white/70 hover:text-[var(--color-ink)]"
      } ${collapsed ? "justify-center px-2" : "gap-3"}`}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      <span className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[var(--color-navy)] transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`} />
      <span className={`inline-flex items-center justify-center rounded-lg transition-colors duration-200 ${collapsed ? "h-9 w-9" : "h-8 w-8"} ${active ? "bg-white text-[var(--color-navy)]" : "bg-white/0 text-inherit group-hover:bg-white/80"}`}>
        <Icon className="h-[19px] w-[19px] shrink-0" strokeWidth={2} />
      </span>
      <span className={`min-w-0 flex-1 truncate whitespace-nowrap text-[14px] leading-none transition-[width,opacity] duration-200 ${collapsed ? "w-0 opacity-0 sr-only" : "w-auto opacity-100"}`}>
        {label}
      </span>
      {!collapsed && badge ? (
        <span className="rounded-full bg-[var(--color-primary-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
          {badge}
        </span>
      ) : null}
      {collapsed && <CollapsedTooltip label={label} />}
    </Link>
  );
}

function CollapsedTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-ink)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
      {label}
    </span>
  );
}
