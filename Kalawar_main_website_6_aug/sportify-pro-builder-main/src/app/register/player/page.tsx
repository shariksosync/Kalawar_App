"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";

function PlayerRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "player");
    const target = `/register?${params.toString()}`;
    router.replace(target);
  }, [router, searchParams]);

  const params = new URLSearchParams(searchParams.toString());
  params.set("type", "player");
  const targetUrl = `/register?${params.toString()}`;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-medium">
        Redirecting to official Athlete Registration portal...
      </p>
      <Link
        href={targetUrl}
        className="text-xs text-primary underline hover:opacity-80"
      >
        Click here if you are not redirected automatically
      </Link>
    </div>
  );
}

export default function PlayerRegistrationRedirectPage() {
  return (
    <SiteLayout>
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <PlayerRedirectContent />
      </Suspense>
    </SiteLayout>
  );
}
