"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input, Select } from "./ui";
import { cn } from "@/lib/utils";

type FilterSelect = { name: string; label: string; options: { value: string; label: string }[] };

/** Search box + selects that keep their state in the URL (?q=...&status=...). */
export function ListFilters({
  values,
  placeholder = "Search…",
  selects = [],
  tabs,
}: {
  values: Record<string, string>;
  placeholder?: string;
  selects?: FilterSelect[];
  tabs?: { name: string; options: { value: string; label: string; count?: number }[] };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(values.q ?? "");

  function apply(changes: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...values, ...changes })) if (v) params.set(k, v);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Debounce typing in the search box.
  useEffect(() => {
    if (q === (values.q ?? "")) return;
    const t = setTimeout(() => apply({ q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-3 md:flex-row md:items-center md:justify-between">
      {tabs ? (
        <div className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1">
          {tabs.options.map((o) => {
            const active = (values[tabs.name] ?? "") === o.value;
            return (
              <button
                key={o.value || "all"}
                type="button"
                onClick={() => apply({ [tabs.name]: o.value })}
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-colors",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {o.label}
                {o.count !== undefined && (
                  <span className={cn("tabular rounded px-1 text-[10px]", active ? "bg-background/20" : "bg-muted")}>{o.count}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div />
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {selects.map((s) => (
          <Select
            key={s.name}
            aria-label={s.label}
            value={values[s.name] ?? ""}
            onChange={(e) => apply({ [s.name]: e.target.value })}
            className="h-8 text-xs sm:w-44"
          >
            <option value="">{s.label}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ))}
        <div className="relative sm:w-64">
          {pending ? (
            <Loader2 className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label="Search"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
