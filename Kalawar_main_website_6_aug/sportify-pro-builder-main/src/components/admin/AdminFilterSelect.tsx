"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface AdminFilterSelectProps {
  label?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: (string | FilterOption)[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  align?: "left" | "right";
  minWidth?: string;
}

export function AdminFilterSelect({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  searchable = false,
  align = "left",
  minWidth = "min-w-[190px]",
}: AdminFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: FilterOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const activeOption = useMemo(() => {
    return normalizedOptions.find((o) => o.value === value);
  }, [normalizedOptions, value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, search]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const shouldShowSearch = searchable || normalizedOptions.length > 8;

  return (
    <div ref={containerRef} className={cn("relative inline-block text-xs", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearch("");
        }}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm cursor-pointer",
          isOpen
            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
            : value && value !== "all" && value !== "All"
            ? "border-primary/60 bg-primary/10 text-primary hover:border-primary"
            : "border-border/80 bg-background/80 text-foreground hover:border-border hover:bg-accent/40"
        )}
      >
        {icon && <span className="text-primary shrink-0">{icon}</span>}
        {label && <span className="text-muted-foreground font-medium shrink-0">{label}</span>}
        <span className="font-bold truncate max-w-[170px] text-left">
          {activeOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 max-h-72 overflow-hidden rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 flex flex-col",
            minWidth,
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {/* Quick search if many items */}
          {shouldShowSearch && (
            <div className="relative mb-1.5 px-1 pt-0.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search options..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background/80 border border-border/70 focus:border-primary rounded-lg pl-7 pr-6 py-1 text-[11px] text-foreground placeholder:text-muted-foreground outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto max-h-60 space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-muted-foreground">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer font-medium",
                      isSelected
                        ? "bg-primary/20 text-primary font-bold"
                        : "text-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.count !== undefined && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                            isSelected
                              ? "bg-primary text-background"
                              : "bg-accent text-muted-foreground"
                          )}
                        >
                          {opt.count}
                        </span>
                      )}
                      {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
