"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-3 sm:gap-5 w-full max-w-full",
        align === "center" && "items-center text-center",
        action && "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl min-w-0 w-full", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-2 sm:mt-3 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl leading-[1.15] font-semibold tracking-tight text-balance break-words">
          {title}
        </h2>
        <div className={cn("gold-rule mt-4 sm:mt-5", align === "center" && "mx-auto")} />
        {description && (
          <p className="mt-4 sm:mt-5 text-sm sm:text-base leading-relaxed text-muted-foreground break-words">{description}</p>
        )}
      </div>
      {action && <div className="self-start sm:self-auto shrink-0">{action}</div>}
    </Reveal>
  );
}
