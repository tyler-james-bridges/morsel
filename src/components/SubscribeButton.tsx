"use client";

import { useState } from "react";

interface SubscribeButtonProps {
  creatorAddress: string;
}

export default function SubscribeButton({ creatorAddress }: SubscribeButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    if (!email.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorAddress, email: email.trim() }),
      });

      if (res.status === 201) {
        setSuccess(true);
        setEmail("");
      } else if (res.status === 409) {
        setError("Already subscribed");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
        Subscribed
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="px-5 py-2.5 rounded-lg bg-amber-500 text-gray-950 font-semibold text-sm hover:bg-amber-400 transition-colors"
      >
        Subscribe
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
        placeholder="your@email.com"
        className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 w-56"
        autoFocus
      />
      <button
        onClick={handleSubscribe}
        disabled={submitting || !email.trim()}
        className="px-4 py-2 rounded-lg bg-amber-500 text-gray-950 font-semibold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "..." : "Go"}
      </button>
      <button
        onClick={() => { setExpanded(false); setError(""); }}
        className="px-2 py-2 text-gray-500 hover:text-gray-300 text-sm"
      >
        Cancel
      </button>
      {error && (
        <span className="text-red-400 text-xs">{error}</span>
      )}
    </div>
  );
}
