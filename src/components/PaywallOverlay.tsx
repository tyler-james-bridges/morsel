interface PaywallOverlayProps {
  price: string;
  creatorName: string;
  recipeTitle: string;
  onUnlock: () => void;
}

export default function PaywallOverlay({
  price,
  creatorName,
  recipeTitle,
  onUnlock,
}: PaywallOverlayProps) {
  return (
    <div className="relative">
      {/* Blurred placeholder content */}
      <div className="blur-md opacity-30 select-none pointer-events-none">
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-16" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded w-1/3" />
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-5/6" />
            <div className="h-3 bg-gray-800 rounded w-4/5" />
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-3/4" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded w-1/4" />
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-5/6" />
            <div className="h-3 bg-gray-800 rounded w-full" />
          </div>
        </div>
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl shadow-black/50">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-100 mb-1">
            Unlock this recipe
          </h3>
          <p className="text-sm text-gray-500 mb-1">{recipeTitle}</p>
          <p className="text-sm text-gray-500 mb-6">by {creatorName}</p>

          <button
            onClick={onUnlock}
            className="w-full py-3 rounded-lg bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors text-sm"
          >
            Pay {price} with USDC
          </button>

          <p className="text-xs text-gray-600 mt-4 leading-relaxed">
            Instant payment on Base. No subscription.
            <br />
            Creator gets paid directly.
          </p>
        </div>
      </div>
    </div>
  );
}
