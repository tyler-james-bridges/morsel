"use client";

import SubscribeButton from "./SubscribeButton";

interface CreatorHeaderProps {
  address: string;
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  subscriberCount: number;
  socialLinks: Record<string, string>;
  recipeCount?: number;
  joinedDate?: string;
}

const SOCIAL_LABELS: Record<string, string> = {
  twitter: "X",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  website: "Website",
};

export default function CreatorHeader({
  address,
  name,
  bio,
  avatarUrl,
  bannerUrl,
  socialLinks,
  recipeCount,
  joinedDate,
}: CreatorHeaderProps) {
  const socialEntries = Object.entries(socialLinks).filter(
    ([, url]) => url && url.length > 0,
  );

  return (
    <div className="mb-12">
      {/* Banner */}
      <div className="relative overflow-hidden mb-[-3.5rem]" style={{ height: "clamp(180px, 26vw, 300px)" }}>
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 via-paper-2 to-paper" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
      </div>

      {/* Avatar + Info */}
      <div className="relative px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-wrap">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-[108px] h-[108px] rounded-[4px] object-cover shadow-[0_0_0_4px_var(--color-paper)]"
            />
          ) : (
            <div className="w-[108px] h-[108px] rounded-[4px] bg-paper-2 grid place-items-center shadow-[0_0_0_4px_var(--color-paper)]">
              <span className="display text-4xl text-ink-2">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0 pb-1.5">
            <h1 className="display text-4xl flex items-center gap-2">
              {name}
            </h1>
            <p className="font-mono text-[13px] text-ink-3 mt-0.5">
              {address.slice(0, 6)}...{address.slice(-4)}
              {joinedDate && <> &middot; joined {joinedDate}</>}
            </p>
          </div>

          <div className="sm:self-center">
            <SubscribeButton creatorAddress={address} />
          </div>
        </div>

        <p className="text-[18px] text-ink-2 max-w-[600px] leading-relaxed mt-[22px]">{bio}</p>

        {/* Social links + address chip */}
        {socialEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {socialEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-[3px] border-[1.5px] border-ink/30 text-[12.5px] font-semibold text-ink-2 hover:border-ink hover:text-ink transition-colors inline-flex items-center gap-1.5"
              >
                {SOCIAL_LABELS[platform.toLowerCase()] || platform}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M19 13v5a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h5" />
                </svg>
              </a>
            ))}
          </div>
        )}

        {/* Stats — honest: only recipe count + joined date */}
        {(recipeCount !== undefined || joinedDate) && (
          <div className="grid grid-cols-2 gap-px bg-ink/15 border border-ink/15 rounded-[4px] overflow-hidden mt-7 max-w-[420px]">
            {recipeCount !== undefined && (
              <div className="bg-card p-[18px_16px]">
                <div className="display text-[26px]">{recipeCount}</div>
                <div className="font-mono text-[10.5px] text-ink-4 uppercase tracking-[0.1em] mt-1">Recipes</div>
              </div>
            )}
            {joinedDate && (
              <div className="bg-card p-[18px_16px]">
                <div className="display text-[26px]">{joinedDate}</div>
                <div className="font-mono text-[10.5px] text-ink-4 uppercase tracking-[0.1em] mt-1">On Morsel since</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
