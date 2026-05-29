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
        <h1 className="display text-[40px] mb-2">Not found</h1>
        <p className="text-ink-3">That page seems to have been eaten.</p>
        <Link
          href="/"
          className="btn-ink inline-block px-5 py-2.5 text-sm mt-4"
        >
          Back to browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-80 bg-card-2 rounded-[4px] mb-8" />
      <div className="h-8 bg-card-2 rounded-[4px] w-2/3 mb-4" />
      <div className="h-4 bg-card-2 rounded-[4px] w-1/3 mb-8" />
    </div>
  );
}
