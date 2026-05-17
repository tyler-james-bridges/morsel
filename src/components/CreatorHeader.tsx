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
  subscriberCount,
  socialLinks,
}: CreatorHeaderProps) {
  const socialEntries = Object.entries(socialLinks).filter(
    ([, url]) => url && url.length > 0,
  );

  return (
    <div className="mb-12">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden mb-[-3rem]">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-gray-900 to-gray-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
      </div>

      {/* Avatar + Info */}
      <div className="relative px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-950 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center border-4 border-gray-950 shadow-xl">
              <span className="text-3xl font-bold text-amber-500">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
              {name}
            </h1>
            <p className="text-gray-400 mt-1 max-w-lg">{bio}</p>

            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="text-sm text-gray-500">
                {subscriberCount} {subscriberCount === 1 ? "subscriber" : "subscribers"}
              </span>

              {socialEntries.length > 0 && (
                <div className="flex items-center gap-3">
                  {socialEntries.map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
                    >
                      {SOCIAL_LABELS[platform.toLowerCase()] || platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sm:self-center">
            <SubscribeButton creatorAddress={address} />
          </div>
        </div>
      </div>
    </div>
  );
}
