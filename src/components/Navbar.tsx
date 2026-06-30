"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

/*
  Navbar — "Test Kitchen Press" treatment.
  Key changes from the old dark navbar:
  - sticky cream masthead with a heavy 2px ink bottom rule (not a faint gray border)
  - wordmark is `font-display` (Bricolage) with a small accent "morsel mark"
  - links are ink, hover → ink (no amber)
  - Use `aria-current`/active styling in your router as needed
*/
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isConnected } = useAccount();

  const links = [
    { href: "/", label: "Browse" },
    { href: "/recipe-box", label: "Recipe Box" },
    { href: "/publish", label: "Publish" },
    { href: "/developers", label: "Developers" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/85 backdrop-blur-md border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-accent border-[1.5px] border-ink -rotate-[8deg] rounded-[50%_50%_50%_2px]" />
            <span className="display display-tight text-2xl">morsel</span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-2 hover:text-ink transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <ConnectButton
              accountStatus="address"
              chainStatus={isConnected ? "icon" : "none"}
              showBalance={false}
            />
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-ink-2 hover:text-ink"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t-2 border-ink pt-4 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-base font-medium text-ink-2 hover:text-ink transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              <ConnectButton accountStatus="address" chainStatus="none" showBalance={false} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
