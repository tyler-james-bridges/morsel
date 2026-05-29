"use client";

type Tab = "featured" | "latest" | "trending";

interface FeedTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "latest", label: "Latest" },
  { key: "trending", label: "Trending" },
];

export default function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <div className="flex gap-1 border-b border-ink/15">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`px-1 py-3 text-[15px] font-medium transition-colors relative mr-[22px] ${
            activeTab === key
              ? "text-ink font-semibold"
              : "text-ink-3 hover:text-ink-2"
          }`}
        >
          {label}
          {activeTab === key && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
