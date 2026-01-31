"use client";

import Link from "next/link";
import Image from "next/image";
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
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { useLanguage } from "../contexts/LanguageContext";

type NavLink = { type: "link"; href: string; labelKey: string; icon: LucideIcon };
type NavGroup = {
  type: "group";
  labelKey: string;
  icon: LucideIcon;
  children: { href: string; labelKey: string }[];
};
type NavItem = NavLink | NavGroup;

type NavSection = {
  titleKey: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    titleKey: "sidebar.menu",
    items: [
      { type: "link", href: "/", labelKey: "sidebar.home", icon: Home },
      {
        type: "group",
        labelKey: "sidebar.meetups",
        icon: Calendar,
        children: [
          { href: "/events", labelKey: "sidebar.events" },
          { href: "/groups", labelKey: "sidebar.groups" },
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
      { type: "link", href: "/haberler", labelKey: "sidebar.news", icon: Newspaper },
      { type: "link", href: "/yasal-rehber", labelKey: "sidebar.legalGuide", icon: Scale },
      { type: "link", href: "/profile", labelKey: "sidebar.profile", icon: User },
      { type: "link", href: "/ayarlar", labelKey: "sidebar.settings", icon: Settings },
    ],
  },
];

function Tooltip({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;
  return (
    <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200 shadow-sm z-50">
      {text}
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "sidebar.meetups": false,
    "sidebar.realEstate": false,
    "sidebar.jobs": false,
  });

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const quickFilters = useMemo(() => ["#immigration", "#housing", "#jobs", "#nyc", "#events"], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    const matchItem = (i: NavItem) => {
      const label = t(i.labelKey).toLowerCase();
      if (i.type === "link") return label.includes(q);
      if (label.includes(q)) return true;
      return i.children.some((c) => t(c.labelKey).toLowerCase().includes(q));
    };
    return SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter(matchItem),
    })).filter((s) => s.items.length > 0);
  }, [query, t]);

  const IconBadge = ({ Icon, active }: { Icon: LucideIcon; active?: boolean }) => (
    <span
      className={cx(
        "grid h-9 w-9 place-items-center rounded-lg border",
        active
          ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );

  return (
    <aside
      className={cx(
        "sticky top-[65px] hidden h-[calc(100vh-65px)] md:block",
        "border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950",
        "transition-[width] duration-200 ease-out",
        open ? "w-[300px]" : "w-[76px]"
      )}
    >
      {/* Header */}
      <div className={cx("border-b border-neutral-200 dark:border-neutral-800 px-3 py-3", open ? "" : "px-2")}>
        <div className={cx("flex items-center gap-2", open ? "justify-between" : "justify-center")}>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
              <Image src="/logo.png" alt="Amerikala" width={36} height={36} />
            </div>
            {open && (
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                  Amerikala
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Community</div>
              </div>
            )}
          </div>

          <button
            type="button"
            className={cx(
              "relative grid h-9 w-9 place-items-center rounded-lg border",
              "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900",
              "hover:bg-neutral-50 dark:hover:bg-neutral-800",
              "text-neutral-700 dark:text-neutral-300 transition-smooth"
            )}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            title={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Search */}
        {open && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("sidebar.searchMenu")}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 py-2 pl-9 pr-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-smooth"
              />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cx("h-full overflow-y-auto scrollbar-hide", open ? "px-2 py-3" : "px-2 py-3")}>
        {filtered.map((section) => (
          <div key={section.titleKey} className="mb-4">
            <div className="space-y-1">
              {section.items.map((item) => {
                const label = t(item.labelKey);

                if (item.type === "link") {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <div key={item.href} className="relative">
                      <Link
                        href={item.href}
                        className={cx(
                          "group relative flex items-center gap-3 rounded-lg px-2 py-2",
                          "transition-smooth",
                          active
                            ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                            : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-50",
                          !open && "justify-center"
                        )}
                        title={!open ? label : undefined}
                      >
                        {/* Active indicator */}
                        <span
                          className={cx(
                            "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r",
                            active ? "bg-red-600" : "bg-transparent"
                          )}
                        />

                        <IconBadge Icon={Icon} active={active} />

                        {open && <span className="text-sm font-medium">{label}</span>}
                      </Link>

                      {/* Tooltip when collapsed */}
                      <Tooltip show={!open} text={label} />
                    </div>
                  );
                }

                const Icon = item.icon;
                const expanded = openGroups[item.labelKey] ?? false;

                return (
                  <div key={item.labelKey} className="relative">
                    <button
                      type="button"
                      className={cx(
                        "group relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left",
                        "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-50",
                        "transition-smooth",
                        !open && "justify-center"
                      )}
                      onClick={() => {
                        if (!open) {
                          setOpen(true);
                          setOpenGroups((m) => ({ ...m, [item.labelKey]: true }));
                          return;
                        }
                        setOpenGroups((m) => ({ ...m, [item.labelKey]: !expanded }));
                      }}
                      title={!open ? label : undefined}
                    >
                      <IconBadge Icon={Icon} />

                      {open && (
                        <>
                          <span className="flex-1 text-sm font-medium">{label}</span>
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                          )}
                        </>
                      )}
                    </button>

                    <Tooltip show={!open} text={label} />

                    {open && expanded && (
                      <div className="ml-[52px] mt-1 space-y-1">
                        {item.children.map((c) => {
                          const active = isActive(c.href);
                          const childLabel = t(c.labelKey);
                          return (
                            <Link
                              key={c.href}
                              href={c.href}
                              className={cx(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                                "transition-smooth",
                                active
                                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-50"
                              )}
                            >
                              <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                              <span>{childLabel}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick filters */}
        {open && (
          <div className="mt-6 px-2 pb-6">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t("sidebar.quickFilters")}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickFilters.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:border-red-500 cursor-pointer transition-smooth"
                >
                  <Hash className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                  {tag.replace("#", "")}
                </span>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
