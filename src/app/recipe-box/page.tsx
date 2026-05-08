"use client";

export default function RecipeBoxPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-100 mb-3">Recipe Box</h1>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Connect your wallet to see your unlocked recipes. Every recipe you
        purchase is saved here for easy access.
      </p>

      <button className="px-6 py-3 rounded-lg bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors text-sm">
        Connect Wallet
      </button>

      <p className="text-xs text-gray-600 mt-4">
        Your wallet address is used to look up your purchase history on Base.
      </p>
    </div>
  );
}
