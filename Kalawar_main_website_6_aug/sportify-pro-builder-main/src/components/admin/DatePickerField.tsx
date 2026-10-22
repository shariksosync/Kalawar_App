"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
  label?: string;
  value?: string;
  onChange: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  placeholder?: string;
  helperText?: string;
}

export function DatePickerField({
  label,
  value = "",
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  className,
  placeholder = "YYYY-MM-DD or e.g. January 10th, 2026",
  helperText,
}: DatePickerFieldProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Normalize any date string into YYYY-MM-DD for native calendar picker
  const getNormalizedDateValue = (raw: string): string => {
    if (!raw) return "";
    const clean = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean;
    }
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return "";
  };

  const handleOpenCalendar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || !dateInputRef.current) return;
    try {
      if (typeof dateInputRef.current.showPicker === "function") {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    } catch {
      dateInputRef.current.focus();
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="font-bold text-muted-foreground block text-xs">
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}

      <div
        className={cn(
          "relative flex items-center w-full bg-background border border-border rounded-xl transition-all hover:border-primary/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        {/* Manually Typable Text Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
        />

        {/* Hidden Native Date Input for Calendar GUI Picker */}
        <input
          ref={dateInputRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          min={min}
          max={max}
          value={getNormalizedDateValue(value)}
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          className="sr-only pointer-events-none opacity-0 absolute w-0 h-0"
        />

        {/* Interactive Calendar Icon Trigger Button */}
        <button
          type="button"
          tabIndex={0}
          onClick={handleOpenCalendar}
          disabled={disabled}
          title="Open calendar picker"
          className="px-3 py-2 text-primary/80 hover:text-primary transition-colors cursor-pointer border-l border-border/60 hover:bg-primary/10 rounded-r-xl flex items-center justify-center"
        >
          <CalendarDays className="size-4" />
        </button>
      </div>

      {helperText && (
        <p className="text-[10px] text-muted-foreground/80 pl-1">{helperText}</p>
      )}
    </div>
  );
}
