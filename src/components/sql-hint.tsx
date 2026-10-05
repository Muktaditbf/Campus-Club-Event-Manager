"use client";

import { useEffect, useRef, useState } from "react";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { SqlCode } from "./sql-code";

/** A small "SQL" chip that reveals the statement a part of the UI runs. */
export function SqlHint({ sql, label = "SQL", align = "right" }: { sql: string; label?: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-border px-1.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
          open && "border-primary/40 text-primary",
        )}
      >
        <Database className="size-3" />
        {label}
      </button>
      {open && (
        <div
          className={cn(
            "animate-pop-in absolute top-8 z-40 w-[min(34rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-1 shadow-xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <SqlCode sql={sql} className="max-h-80" />
        </div>
      )}
    </div>
  );
}
