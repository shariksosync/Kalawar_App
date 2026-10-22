"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RefereeRegistrationRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/register?type=referee");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
      Redirecting to Unified Referee Registration...
    </div>
  );
}
