"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CreatorInfo {
  address: string;
  name: string;
  avatarUrl: string;
  recipeCount: number;
}

export default function CreatorSidebar() {
  const [creators, setCreators] = useState<CreatorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCreators() {
      try {
        const res = await fetch("/api/creators/top");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCreators(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCreators();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="press-card p-5">
        <div className="h-5 bg-paper-2 rounded-[3px] w-2/3 mb-4 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-[34px] h-[34px] rounded-[3px] bg-paper-2 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-paper-2 rounded-[3px] w-3/4 animate-pulse" />
              <div className="h-2 bg-paper-2 rounded-[3px] w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Creators card */}
      <div className="press-card p-5">
        <span className="eyebrow mb-4 block">Creators on Morsel</span>
        <div className="flex flex-col gap-3.5">
          {creators.map((creator) => (
            <Link
              key={creator.address}
              href={`/creator/${creator.address}`}
              className="flex items-center justify-between gap-2.5 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.name}
                    className="w-[34px] h-[34px] rounded-[3px] object-cover"
                  />
                ) : (
                  <div className="w-[34px] h-[34px] rounded-[3px] bg-paper-2 grid place-items-center display text-sm text-ink-2">
                    {creator.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-ink truncate group-hover:text-accent transition-colors">
                    {creator.name}
                  </p>
                  <p className="font-mono text-[11px] text-ink-4">
                    {creator.recipeCount} {creator.recipeCount === 1 ? "recipe" : "recipes"}
                  </p>
                </div>
              </div>
              <span className="px-3 py-[5px] rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-medium text-ink-2 hover:border-ink hover:text-ink transition-colors shrink-0">
                View
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular tags card */}
      <div className="press-card p-5">
        <span className="eyebrow mb-4 block">Popular tags</span>
        <div className="flex flex-wrap gap-2">
          {["Weeknight", "30 min", "Vegan", "Comfort", "Spicy", "Baking", "One-pot", "Gluten-free"].map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-semibold text-ink-2 capitalize">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Developer CTA card */}
      <div className="press-card p-5 bg-gradient-to-br from-accent/8 to-transparent border-accent/30">
        <div className="flex items-center gap-2 mb-3.5 text-accent">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />
          </svg>
          <span className="eyebrow no-rule" style={{ color: "var(--color-accent)" }}>For developers</span>
        </div>
        <h4 className="display text-[19px] mb-2">Build with the recipe API</h4>
        <p className="text-[13.5px] text-ink-2 leading-relaxed mb-4">
          Morsel is a registered ERC-8257 tool. Agents can search, read, and pay to unlock recipes autonomously.
        </p>
        <Link
          href="/developers"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink transition-colors"
        >
          Read the docs
          <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
