"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CreatorRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!address) return;

    async function lookupAndRedirect() {
      try {
        const res = await fetch(`/api/creators/${address}`);
        if (res.ok) {
          const data = await res.json();
          if (data.creator?.slug) {
            router.replace(`/${data.creator.slug}`);
            return;
          }
        }
        setNotFound(true);
      } catch {
        setNotFound(true);
      }
    }

    lookupAndRedirect();
  }, [address, router]);

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Creator not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-500 text-lg">Redirecting...</p>
    </div>
  );
}
