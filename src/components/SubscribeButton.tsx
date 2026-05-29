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
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-accent/10 border-[1.5px] border-accent/30 text-accent text-sm font-medium">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l4 4 10-11" />
        </svg>
        Subscribed
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="btn-ink px-5 py-2.5 text-sm inline-flex items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
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
        className="px-3 py-2 rounded-[4px] bg-card border-[1.5px] border-ink/30 text-ink text-sm placeholder:text-ink-4 focus:outline-none focus:border-ink w-56"
        autoFocus
      />
      <button
        onClick={handleSubscribe}
        disabled={submitting || !email.trim()}
        className="btn-ink px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "..." : "Go"}
      </button>
      <button
        onClick={() => { setExpanded(false); setError(""); }}
        className="px-2 py-2 text-ink-3 hover:text-ink text-sm transition-colors"
      >
        Cancel
      </button>
      {error && (
        <span className="text-red-700 text-xs">{error}</span>
      )}
    </div>
  );
}
