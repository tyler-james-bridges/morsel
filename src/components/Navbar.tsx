"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  function handleConnect() {
    const connector = connectors[0];
    if (connector) connect({ connector });
  }

  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-amber-500">morsel</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/recipe-box"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Recipe Box
            </Link>
            <Link
              href="/publish"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Publish
            </Link>

            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors font-mono"
                >
                  {truncated}
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
                    <Link
                      href={`/creator/${address}`}
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/recipe-box"
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      My Recipe Box
                    </Link>
                    <button
                      onClick={() => {
                        disconnect();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors border-t border-gray-800"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-gray-950 hover:bg-amber-400 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-800/50 pt-4 flex flex-col gap-4">
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/recipe-box"
              className="text-sm text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Recipe Box
            </Link>
            <Link
              href="/publish"
              className="text-sm text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Publish
            </Link>
            {isConnected ? (
              <>
                <Link
                  href={`/creator/${address}`}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    disconnect();
                    setMobileOpen(false);
                  }}
                  className="text-left text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Disconnect ({truncated})
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  handleConnect();
                  setMobileOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-gray-950 hover:bg-amber-400 transition-colors w-full"
              >
                Connect Wallet
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
