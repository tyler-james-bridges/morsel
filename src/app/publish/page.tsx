"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAccount, useChainId, useSwitchChain, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { createCreatorPublishHeaders } from "@/lib/wallet-auth";

const CUISINES = [
  "italian", "mexican", "japanese", "indian", "thai",
  "french", "american", "mediterranean", "chinese", "korean", "filipino",
];

const MEAL_TYPES = [
  "breakfast", "lunch", "dinner", "dessert", "snack", "drink",
];

const DIETARY = [
  "vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "paleo", "nut-free",
];

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const PRICES = ["$0.25", "$0.50", "$0.75"];

export default function PublishPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [submitting, setSubmitting] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [introContent, setIntroContent] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("$0.50");
  const [cuisine, setCuisine] = useState("american");
  const [mealType, setMealType] = useState("dinner");
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState("15");
  const [cookTime, setCookTime] = useState("30");
  const [servings, setServings] = useState("4");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [creatorName, setCreatorName] = useState("");

  function toggleDietary(tag: string) {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((d) => d !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      if (!address || !walletClient) {
        throw new Error("Connect your wallet to publish");
      }

      if (chainId !== base.id) {
        setSwitchingNetwork(true);
        try {
          await switchChainAsync({ chainId: base.id });
        } catch {
          throw new Error("Switch to Base to publish this recipe.");
        }
        return;
      }

      const authHeaders = await createCreatorPublishHeaders(address, (params) =>
        walletClient.signMessage(params),
      );

      const res = await fetch("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          title,
          slug: slug || undefined,
          introContent: introContent || undefined,
          isFree,
          description,
          imageUrl,
          price,
          cuisine,
          mealType,
          dietaryTags,
          prepTime: parseInt(prepTime),
          cookTime: parseInt(cookTime),
          servings: parseInt(servings),
          difficulty,
          ingredients: ingredients.split("\n").filter(Boolean),
          steps: steps.split("\n").filter(Boolean),
          notes: notes || undefined,
          creatorAddress: address,
          creatorName: creatorName || undefined,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unable to publish recipe");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to publish recipe");
    } finally {
      setSubmitting(false);
      setSwitchingNetwork(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-[4px] bg-accent/10 grid place-items-center">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l4 4 10-11" />
          </svg>
        </div>
        <h1 className="display text-2xl mb-3">Recipe Published</h1>
        <p className="text-ink-2 mb-6">
          Your recipe is now live and ready to be discovered.
        </p>
        <Link href="/" className="text-accent hover:text-accent-deep text-sm transition-colors">
          Back to browse
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-[4px] bg-card border-[1.5px] border-ink/30 text-ink placeholder-ink-4 focus:outline-none focus:border-ink text-sm font-sans transition-colors";
  const labelClass = "block text-[13.5px] font-semibold text-ink-2 mb-2";

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="press-card p-[60px_30px] inline-block">
          <div className="w-14 h-14 mx-auto mb-[18px] rounded-[4px] bg-accent/10 grid place-items-center text-accent">
            <svg className="w-[26px] h-[26px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14h2" />
            </svg>
          </div>
          <h1 className="display text-2xl mb-2">Sign in to publish</h1>
          <p className="text-ink-3 text-[15px] max-w-[380px] mx-auto mb-[22px] leading-relaxed">
            Publishing is wallet-authenticated — your recipes and earnings are tied to your address. No gas to sign in.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9">
      <div className="mb-7">
        <span className="eyebrow mb-2 block">Publish &middot; {address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <h1 className="display text-[clamp(32px,5vw,46px)]">Share a recipe</h1>
        <p className="text-ink-3 text-[16px] mt-1.5">Set your price. Keep 95% of every unlock, paid instantly in USDC.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-[26px]">
          {/* Creator name */}
          <div>
            <label className={labelClass}>Display Name</label>
            <input
              type="text"
              placeholder="Chef Tyler"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              placeholder="Burnt Honey & Harissa Chicken"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugManuallyEdited) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")
                  );
                }
              }}
              className={inputClass}
              required
            />
          </div>

          {/* One-line hook */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[13.5px] font-semibold text-ink-2">One-line hook</span>
              <span className="text-[11.5px] text-ink-4">Shown free in the feed</span>
            </div>
            <input
              type="text"
              placeholder="Sticky, smoky, dangerously good."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className={labelClass}>URL Slug</label>
            <input
              type="text"
              placeholder="burnt-honey-harissa-chicken"
              value={slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-|-$/g, "")
                );
              }}
              className={inputClass}
            />
            {slug && (
              <p className="font-mono text-[11px] text-ink-4 mt-1.5">
                morsel.xyz/{creatorName ? creatorName.toLowerCase().replace(/\s+/g, "-") : "you"}/{slug}
              </p>
            )}
          </div>

          {/* Cuisine + Meal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cuisine</label>
              <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={inputClass}>
                {CUISINES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Meal</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)} className={inputClass}>
                {MEAL_TYPES.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prep / Cook / Serves / Difficulty */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Prep (min)</label>
              <input type="number" min="0" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Cook (min)</label>
              <input type="number" min="0" value={cookTime} onChange={(e) => setCookTime(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Serves</label>
              <input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")} className={inputClass}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dietary tags */}
          <div>
            <label className={labelClass}>Dietary tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDietary(d)}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors capitalize border-[1.5px] ${
                    dietaryTags.includes(d)
                      ? "bg-accent text-accent-ink border-ink"
                      : "bg-card border-ink/30 text-ink-2 hover:border-ink hover:text-ink"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className={labelClass}>Image URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Intro */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[13.5px] font-semibold text-ink-2">Intro</span>
              <span className="text-[11.5px] text-ink-4">The free teaser — always visible</span>
            </div>
            <textarea
              rows={4}
              placeholder="There's a moment when honey tips from sweet into something deeper..."
              value={introContent}
              onChange={(e) => setIntroContent(e.target.value)}
              className={`${inputClass} text-base leading-relaxed resize-y`}
            />
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[13.5px] font-semibold text-ink-2">Ingredients (one per line)</span>
              <span className="text-[11.5px] text-ink-4">Locked behind your paywall</span>
            </div>
            <textarea
              rows={8}
              placeholder={"2 cups all-purpose flour\n1 tsp salt\n3 large eggs\n..."}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className={`${inputClass} font-mono text-xs`}
              required
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[13.5px] font-semibold text-ink-2">Method (one per line)</span>
              <span className="text-[11.5px] text-ink-4">Locked behind your paywall</span>
            </div>
            <textarea
              rows={8}
              placeholder={"Preheat oven to 375F.\nMix dry ingredients in a large bowl.\n..."}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className={`${inputClass} font-mono text-xs`}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              rows={3}
              placeholder="Any tips, substitutions, or serving suggestions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Free recipe toggle */}
          <div className="flex items-center justify-between px-4 py-3 rounded-[4px] bg-card border-[1.5px] border-ink/15">
            <div>
              <p className="text-sm font-semibold text-ink">Free recipe</p>
              <p className="text-xs text-ink-3">Anyone can view this recipe without paying</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFree(!isFree)}
              className={`relative w-11 h-6 rounded-[3px] transition-colors ${
                isFree ? "bg-accent" : "bg-ink-4"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-[3px] bg-paper transition-transform ${
                  isFree ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Price — mobile only (sticky preview handles desktop) */}
          {!isFree && (
            <div className="lg:hidden">
              <label className={labelClass}>Unlock price</label>
              <div className="flex flex-wrap gap-2">
                {PRICES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrice(p)}
                    className={`font-mono text-[13.5px] px-3.5 py-2 rounded-[3px] border-[1.5px] transition-colors ${
                      price === p
                        ? "bg-accent text-accent-ink border-ink"
                        : "bg-card border-ink/30 text-ink-2 hover:border-ink"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[11px] text-ink-4 mt-3.5 leading-relaxed">
                You keep {price} - ~5% &middot; settled in USDC on Base
              </p>
            </div>
          )}

          {/* Submit — mobile only (sticky preview handles desktop) */}
          <div className="lg:hidden">
            {submitError && (
              <p className="text-sm text-red-700 bg-red-100 rounded-[4px] px-3 py-2 mb-4 border border-red-200">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || switchingNetwork}
              className="btn-ink w-full py-3.5 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {switchingNetwork
                ? "Switching..."
                : submitting
                ? "Publishing..."
                : isConnected && chainId !== base.id
                  ? "Switch to Base"
                  : "Publish recipe"}
            </button>
          </div>
        </form>

        {/* Sticky preview + price — desktop */}
        <div className="hidden lg:flex flex-col gap-5 sticky top-[86px]">
          {/* Price selector */}
          <div className="press-card p-[18px]">
            <span className="eyebrow mb-3.5 block">Unlock price</span>
            <div className="flex flex-wrap gap-2">
              {PRICES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrice(p)}
                  className={`font-mono text-[13.5px] px-3.5 py-2 rounded-[3px] border-[1.5px] transition-colors ${
                    price === p
                      ? "bg-accent text-accent-ink border-ink"
                      : "bg-card border-ink/30 text-ink-2 hover:border-ink"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="font-mono text-[11px] text-ink-4 mt-3.5 leading-relaxed">
              You keep {price} - ~5% &middot; settled in USDC on Base
            </p>
          </div>

          {/* Live preview */}
          <div>
            <span className="eyebrow mb-3 block">Live preview</span>
            <div className="press-card">
              {imageUrl ? (
                <div className="relative aspect-[16/9]">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    sizes="360px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[16/9] bg-paper-2 grid place-items-center text-ink-4 text-[13px] font-mono">
                  Add photo URL
                </div>
              )}
              <div className="p-4">
                <h3 className="display text-[21px] mb-1.5">{title || "Your recipe title"}</h3>
                <p className="text-[13.5px] text-ink-3 mb-3 min-h-[18px]">{description || "Your one-line hook appears here."}</p>
                <div className="flex items-center gap-3 text-[12px] text-ink-3">
                  <span className="px-2 py-[3px] rounded-[3px] border-[1.5px] border-ink/30 text-ink-2 font-semibold capitalize">
                    {cuisine}
                  </span>
                  <span>{(parseInt(prepTime) || 0) + (parseInt(cookTime) || 0)}m</span>
                  <span className="price-badge ml-auto">{price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          {submitError && (
            <p className="text-sm text-red-700 bg-red-100 rounded-[4px] px-3 py-2 border border-red-200">
              {submitError}
            </p>
          )}
          <button
            type="submit"
            form=""
            disabled={submitting || switchingNetwork}
            onClick={handleSubmit as unknown as () => void}
            className="btn-ink w-full py-3.5 text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {switchingNetwork
              ? "Switching..."
              : submitting
              ? "Publishing..."
              : isConnected && chainId !== base.id
                ? "Switch to Base"
                : <>Publish recipe <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></>}
          </button>
        </div>
      </div>
    </div>
  );
}
