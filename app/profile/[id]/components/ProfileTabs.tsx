import { PROFILE_TABS, ProfileTab } from "./types";

type ProfileTabsProps = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PROFILE_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
