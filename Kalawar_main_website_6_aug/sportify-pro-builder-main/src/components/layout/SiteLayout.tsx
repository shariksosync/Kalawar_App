"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useSettings } from "@/lib/settings-context";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MaintenanceView } from "./MaintenanceView";
import { AIChatBot } from "@/components/chat/AIChatBot";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { settings, loading } = useSettings();
  const pathname = usePathname();

  // If in maintenance mode and not navigating admin routes
  const isMaintenanceActive =
    !loading && settings.maintenanceMode && !pathname.startsWith("/admin");

  if (isMaintenanceActive) {
    return <MaintenanceView />;
  }

  return (
    <div className="flex min-h-screen flex-col w-full max-w-full overflow-x-hidden relative">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full max-w-full overflow-x-hidden"
      >
        {children}
      </motion.main>
      <Footer />
      <AIChatBot />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  image,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  image: string;
}) {
  return (
    <section className="relative overflow-hidden pt-24 pb-10 sm:pt-36 sm:pb-16 lg:pt-44 lg:pb-20 w-full max-w-full print:hidden">
      <div className="absolute inset-0">
        <img src={image} alt="" className="size-full object-cover opacity-25" loading="lazy" />
        <div className="from-background via-background/80 to-background absolute inset-0 bg-gradient-to-b" />
      </div>
      <div className="shell relative min-w-0">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="eyebrow"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 sm:mt-4 max-w-4xl text-2xl sm:text-4xl lg:text-6xl leading-[1.15] sm:leading-[1.1] font-semibold tracking-tight text-balance break-words"
        >
          {title}
        </motion.h1>
        <div className="gold-rule mt-4 sm:mt-6" />
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.7 }}
            className="text-muted-foreground mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base lg:text-lg leading-relaxed break-words"
          >
            {description}
          </motion.p>
        )}
      </div>
    </section>
  );
}
