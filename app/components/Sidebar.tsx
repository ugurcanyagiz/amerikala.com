"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Home,
  Calendar,
  Building2,
  Briefcase,
  ShoppingBag,
  Newspaper,
  Scale,
  User,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
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
  children: { href: string; labelKey: string }[];
};

type NavItem = NavLink | NavGroup;

// Static labels (Turkish)
const LABELS: Record<string, string> = {
  "sidebar.home": "Anasayfa",
  "sidebar.meetups": "Buluşmalar",
  "sidebar.events": "Etkinlikler",
  "sidebar.groups": "Gruplar",
  "sidebar.myEvents": "Etkinliklerim",
  "sidebar.createEvent": "Etkinlik Oluştur",
  "sidebar.realEstate": "Emlak İlanları",
  "sidebar.forRent": "Kiralık",
  "sidebar.forSale": "Satılık",
  "sidebar.roommate": "Ev Arkadaşı",
  "sidebar.postListing": "İlan Ver",
  "sidebar.jobs": "İş İlanları",
  "sidebar.lookingForJob": "İş Arıyorum",
  "sidebar.hiring": "İşçi Arıyorum",
  "sidebar.marketplace": "Alışveriş",
  "sidebar.legalGuide": "Yasal Rehber",
  "sidebar.profile": "Profilim",
  "sidebar.settings": "Ayarlar",
};

const NAV_ITEMS: NavItem[] = [
  { type: "link", href: "/", labelKey: "sidebar.home", icon: Home },
  {
    type: "group",
    labelKey: "sidebar.meetups",
    icon: Calendar,
    children: [
      { href: "/meetups", labelKey: "sidebar.events" },
      { href: "/groups", labelKey: "sidebar.groups" },
      { href: "/meetups/my-events", labelKey: "sidebar.myEvents" },
      { href: "/meetups/create", labelKey: "sidebar.createEvent" },
    ],
  },
  {
    type: "group",
    labelKey: "sidebar.realEstate",
    icon: Building2,
    children: [
      { href: "/emlak/kiralik", labelKey: "sidebar.forRent" },
      { href: "/emlak/satilik", labelKey: "sidebar.forSale" },
      { href: "/emlak/ev-arkadasi", labelKey: "sidebar.roommate" },
      { href: "/emlak/ilan-ver", labelKey: "sidebar.postListing" },
    ],
  },
  {
    type: "group",
    labelKey: "sidebar.jobs",
    icon: Briefcase,
    children: [
      { href: "/is/ariyorum", labelKey: "sidebar.lookingForJob" },
      { href: "/is/isci-ariyorum", labelKey: "sidebar.hiring" },
    ],
  },
  { type: "link", href: "/alisveris", labelKey: "sidebar.marketplace", icon: ShoppingBag },
  { type: "link", href: "/yasal-rehber", labelKey: "sidebar.legalGuide", icon: Scale },
  { type: "link", href: "/profile", labelKey: "sidebar.profile", icon: User },
  { type: "link", href: "/ayarlar", labelKey: "sidebar.settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Use static labels
  const t = (key: string) => LABELS[key] || key;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const toggleGroup = (key: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setOpenGroups((prev) => ({ ...prev, [key]: true }));
    } else {
      setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  return (
    <aside
      className={`
        sticky top-16 h-[calc(100vh-64px)]
        hidden md:flex flex-col
        border-r border-[var(--color-border-light)]
        bg-[var(--color-surface)]
        transition-all duration-200 ease-out
        ${isExpanded ? "w-60" : "w-16"}
      `}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-end p-2 border-b border-[var(--color-border-light)]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="
            p-2 rounded-lg
            text-[var(--color-ink-tertiary)]
            hover:text-[var(--color-ink)]
            hover:bg-[var(--color-surface-sunken)]
            transition-colors
          "
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const label = t(item.labelKey);
            const Icon = item.icon;

            if (item.type === "link") {
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={!isExpanded ? label : undefined}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-colors duration-150
                      ${active
                        ? "text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                      }
                      ${!isExpanded ? "justify-center" : ""}
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-primary)] rounded-r" />
                    )}
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isExpanded && (
                      <span className="text-sm font-medium truncate">{label}</span>
                    )}
                  </Link>
                </li>
              );
            }

            // Group
            const groupExpanded = openGroups[item.labelKey] ?? false;
            const hasActiveChild = item.children.some((c) => isActive(c.href));

            return (
              <li key={item.labelKey}>
                <button
                  onClick={() => toggleGroup(item.labelKey)}
                  title={!isExpanded ? label : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors duration-150
                    ${hasActiveChild
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                    }
                    ${!isExpanded ? "justify-center" : ""}
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium truncate">
                        {label}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-[var(--color-ink-tertiary)] transition-transform ${
                          groupExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </>
                  )}
                </button>

                {/* Submenu */}
                {isExpanded && groupExpanded && (
                  <ul className="mt-1 ml-5 pl-3 border-l border-[var(--color-border-light)] space-y-1">
                    {item.children.map((child) => {
                      const active = isActive(child.href);
                      const childLabel = t(child.labelKey);

                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`
                              block px-3 py-2 rounded-lg text-sm
                              transition-colors duration-150
                              ${active
                                ? "text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                                : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)]"
                              }
                            `}
                          >
                            {childLabel}
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
    </aside>
  );
}
