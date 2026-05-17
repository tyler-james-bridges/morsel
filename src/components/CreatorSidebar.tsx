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
      <div className="bg-gray-900 rounded-xl border border-gray-800/50 p-5">
        <div className="h-5 bg-gray-800 rounded w-2/3 mb-4 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-800 rounded w-3/4 animate-pulse" />
              <div className="h-2 bg-gray-800 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800/50 p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Creators to follow
      </h3>
      <div className="space-y-1">
        {creators.map((creator) => (
          <Link
            key={creator.address}
            href={`/creator/${creator.address}`}
            className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-400 ring-1 ring-gray-700">
                {creator.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 truncate group-hover:text-amber-400 transition-colors">
                {creator.name}
              </p>
              <p className="text-xs text-gray-500">
                {creator.recipeCount} recipe{creator.recipeCount !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
