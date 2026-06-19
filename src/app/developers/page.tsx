"use client";

import { useState } from "react";
import Link from "next/link";

const ENDPOINT = "https://morsel.0x402.sh/api/tool";

const ACTIONS = [
  { name: "search", price: "free", desc: "Search recipes by query, cuisine, dietary tags. Returns previews." },
  { name: "feed", price: "free", desc: "Browse the recipe feed by tab (featured, latest, trending). Paginated." },
  { name: "recipe", price: "free", desc: "Get a single recipe's public metadata by ID." },
  { name: "recipe_full", price: "$0.50", desc: "Get the full recipe (ingredients, steps, notes). Requires x402 payment." },
  { name: "creators", price: "free", desc: "List top creators on the platform." },
  { name: "creator", price: "free", desc: "Get a creator's profile and recipe list by address." },
];

const EXAMPLES: Record<string, { req: string; res: string; resLabel?: string }> = {
  search: {
    req: `POST ${ENDPOINT}\nContent-Type: application/json\n\n{\n  "action": "search",\n  "query": "weeknight",\n  "cuisine": "Thai",\n  "dietary": "vegan"\n}`,
    res: `200 OK\n\n{\n  "recipes": [\n    {\n      "id": "r8",\n      "title": "20-Minute Green Curry",\n      "creator": "Amara Singh",\n      "price": "$0.25",\n      "cuisine": "Thai",\n      "locked": true\n    }\n  ]\n}`,
  },
  recipe_full: {
    req: `POST ${ENDPOINT}\nContent-Type: application/json\n\n{\n  "action": "recipe_full",\n  "recipeId": "r1"\n}`,
    res: `402 Payment Required\n\n{\n  "x402Version": 1,\n  "accepts": [{\n    "scheme": "exact",\n    "network": "base",\n    "asset": "USDC",\n    "maxAmountRequired": "500000",\n    "payTo": "0x7a3f...9c21"\n  }],\n  "error": "Price: 0.50 USDC on Base"\n}`,
    resLabel: "RESPONSE — payment required",
  },
  feed: {
    req: `POST ${ENDPOINT}\nContent-Type: application/json\n\n{\n  "action": "feed",\n  "tab": "trending",\n  "limit": 10\n}`,
    res: `200 OK\n\n{\n  "recipes": [ /* 10 recipes */ ],\n  "nextCursor": "eyJpZCI6InI1In0"\n}`,
  },
};

function CodeBlock({ label, children }: { label: string; children: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="bg-ink border-2 border-ink rounded-[4px] overflow-hidden shadow-[5px_5px_0_var(--color-ink-4)]">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[.14] bg-white/[.04]">
        <span className="font-mono text-[11px] text-ink-4 tracking-[0.08em] uppercase">{label}</span>
        <button
          onClick={() => { navigator.clipboard?.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
          className="flex items-center gap-1.5 text-[11.5px] font-mono transition-colors"
          style={{ color: copied ? "var(--color-accent)" : "var(--color-paper)" }}
        >
          {copied ? (
            <svg className="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-11" /></svg>
          ) : (
            <svg className="w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M9 8l-4 4 4 4M15 8l4 4-4 4" /></svg>
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="font-mono text-[12.5px] leading-[1.7] p-4 overflow-x-auto" style={{ color: "var(--color-paper)" }}>
        {children}
      </pre>
    </div>
  );
}

export default function DevelopersPage() {
  const [action, setAction] = useState("search");
  const ex = EXAMPLES[action] || EXAMPLES.search;

  return (
    <div className="pb-5">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[52px] pb-10">
        <div className="max-w-[880px]">
          <div className="flex items-center gap-3 mb-[22px] flex-wrap">
            <span className="agent-badge">
              <span className="diamond" />
              ERC-8257 &middot; registered tool
            </span>
            <span className="eyebrow no-rule whitespace-nowrap">Section 04 — for machines</span>
          </div>
          <h1 className="display display-tight text-[clamp(44px,8vw,104px)] mb-[22px] leading-[0.9]">
            Recipes,<br />made for agents.
          </h1>
          <p className="text-[19px] text-ink-2 leading-relaxed max-w-[640px] mb-7">
            Morsel is a discoverable ERC-8257 tool. AI agents can search the catalog, read public metadata for free, and pay to unlock full recipes autonomously over x402 — no API keys, no accounts, settlement in USDC on Base.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#actions" className="btn-ink px-6 py-3 text-[15px] inline-flex items-center gap-2">
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M9 8l-4 4 4 4M15 8l4 4-4 4" /></svg>
              Read the spec
            </a>
            <a
              href="/.well-known/ai-tool/morsel.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-[4px] border-[1.5px] border-ink/30 text-[15px] font-bold text-ink hover:border-ink transition-colors inline-flex items-center gap-2"
            >
              View manifest
              <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M19 13v5a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h5" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Endpoint strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-11">
        <div className="press-card p-[22px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[22px]">
          {[
            ["Tool endpoint", ENDPOINT.replace("https://", "")],
            ["Manifest", "/.well-known/ai-tool/morsel.json"],
            ["Chain", "Base \u00b7 USDC"],
            ["Payment", "x402 \u00b7 HTTP 402"],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="eyebrow mb-2 block">{label}</span>
              <div className="font-mono text-[13px] text-ink break-all">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions + example */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-11" id="actions">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-8 items-start">
          <div>
            <span className="eyebrow mb-4 block">Actions</span>
            <div className="flex flex-col gap-2">
              {ACTIONS.map((a) => {
                const sel = action === a.name;
                const hasEx = !!EXAMPLES[a.name];
                return (
                  <button
                    key={a.name}
                    onClick={() => hasEx && setAction(a.name)}
                    className={`press-card text-left p-3.5 transition-colors ${sel ? "bg-accent/5 border-accent/30" : ""}`}
                    style={{ cursor: hasEx ? "pointer" : "default" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-[13.5px] font-semibold ${sel ? "text-accent" : "text-ink"}`}>{a.name}</span>
                      <span className={`font-mono text-[11px] ${a.price === "free" ? "text-accent" : "text-accent"}`}>{a.price}</span>
                    </div>
                    <div className="text-[12.5px] text-ink-3 leading-[1.45]">{a.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <CodeBlock label="REQUEST">{ex.req}</CodeBlock>
            <CodeBlock label={ex.resLabel || "RESPONSE"}>{ex.res}</CodeBlock>
          </div>
        </div>
      </section>

      {/* x402 flow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <span className="eyebrow mb-5 block">How payment works</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["01", "Request", "Agent calls recipe_full for a locked recipe."],
            ["02", "402", "Server returns HTTP 402 with x402 payment terms."],
            ["03", "Pay", "Agent signs a USDC transfer on Base & retries with the payment header."],
            ["04", "Unlock", "Full ingredients & steps return. Creator is paid directly."],
          ].map(([n, t, d]) => (
            <div key={n} className="press-card p-5">
              <div className="font-mono text-[12px] text-accent mb-3">{n}</div>
              <div className="display text-[19px] mb-1.5">{t}</div>
              <p className="text-[13.5px] text-ink-3 m-0 leading-[1.5]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Manifest preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <span className="eyebrow mb-4 block">Tool manifest</span>
            <p className="text-[15px] text-ink-2 leading-relaxed mt-0 mb-[18px]">
              Any ERC-8257-aware agent can discover Morsel by fetching the well-known manifest. It advertises every action, its price, and the payment rails — no registration required.
            </p>
            <div className="flex gap-3">
              <a
                href="/.well-known/ai-tool/morsel.json"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink transition-colors"
              >
                <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M19 13v5a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h5" />
                </svg>
                Open manifest
              </a>
              <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-medium text-ink-2 hover:border-ink hover:text-ink transition-colors">
                Browse the catalog
              </Link>
            </div>
          </div>
          <CodeBlock label="GET /.well-known/ai-tool/morsel.json">
{`{
  "name": "morsel",
  "description": "Marketplace of paid recipes",
  "version": "1.0",
  "endpoint": "${ENDPOINT}",
  "payment": { "protocol": "x402", "chain": "base", "asset": "USDC" },
  "actions": [
    "search", "feed", "recipe",
    "recipe_full", "creators", "creator"
  ]
}`}
          </CodeBlock>
        </div>
      </section>
    </div>
  );
}
