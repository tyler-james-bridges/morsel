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
    <div className="flex gap-1 border-b border-gray-800">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === key
              ? "text-amber-500"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {label}
          {activeTab === key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>
      ))}
    </div>
  );
}
