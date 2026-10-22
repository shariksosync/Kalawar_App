"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => reset()}
            className="bg-gold-gradient text-background inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold shadow-gold transition-transform hover:scale-[1.03]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-border/70 hover:border-primary inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
