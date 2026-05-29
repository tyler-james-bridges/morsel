"use client";

import { useState } from "react";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <section className="px-4 pt-16 pb-12 text-center max-w-2xl mx-auto">
        <p className="text-lg text-accent font-medium">
          You are in. We will send you the good stuff.
        </p>
      </section>
    );
  }

  return (
    <section className="px-4 pt-16 pb-12 text-center max-w-2xl mx-auto">
      <h1 className="display text-[clamp(30px,5vw,40px)] mb-3">
        Get the best recipes
        <br />
        <span className="knockout">in your inbox.</span>
      </h1>
      <p className="text-ink-2 text-base max-w-lg mx-auto mb-6">
        Curated picks from top creators. No spam, just great food worth making.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 max-w-md mx-auto"
      >
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 px-4 py-2.5 rounded-[4px] bg-card border-[1.5px] border-ink/30 text-ink placeholder-ink-4 focus:outline-none focus:border-ink text-sm transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-ink px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-700 text-sm mt-2">
          Something went wrong. Try again.
        </p>
      )}
    </section>
  );
}
