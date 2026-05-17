"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function RecipeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!cancelled && data.creator?.slug && data.slug) {
          router.replace(`/${data.creator.slug}/${data.slug}`);
        } else if (!cancelled) {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">Recipe not found.</p>
        <Link
          href="/"
          className="text-amber-500 hover:text-amber-400 text-sm mt-2 inline-block"
        >
          Back to browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-80 bg-gray-900 rounded-xl mb-8" />
      <div className="h-8 bg-gray-900 rounded w-2/3 mb-4" />
      <div className="h-4 bg-gray-900 rounded w-1/3 mb-8" />
    </div>
  );
}
