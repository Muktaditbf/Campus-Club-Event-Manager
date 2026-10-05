"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Building2,
  CalendarDays,
  Handshake,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Table2,
  Terminal,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resetDatabase } from "@/lib/actions";
import { ConfirmAction } from "./actions-ui";

const NAV = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Manage",
    items: [
      { href: "/events", label: "Events", icon: CalendarDays },
      { href: "/students", label: "Students", icon: Users },
      { href: "/clubs", label: "Clubs", icon: Sparkles },
      { href: "/venues", label: "Venues", icon: Building2 },
      { href: "/sponsors", label: "Sponsors", icon: Handshake },
    ],
  },
  {
    label: "Database",
    items: [
      { href: "/queries", label: "Query Lab", icon: Terminal },
      { href: "/schema", label: "Schema", icon: Table2 },
    ],
  },
];

export function Sidebar({ mysqlVersion }: { mysqlVersion: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
          <CalendarDays className="size-[18px]" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Campus Events</p>
          <p className="text-[11px] text-muted-foreground">Club &amp; event manager</p>
        </div>
      </div>

      <nav className="scroll-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive(href)
                        ? "bg-primary-soft text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border p-4">
        <div className="flex items-center gap-2.5 rounded-lg bg-subtle px-3 py-2.5">
          <span className="relative flex size-2">
            {mysqlVersion && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
            <span className={cn("relative inline-flex size-2 rounded-full", mysqlVersion ? "bg-emerald-500" : "bg-rose-500")} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-medium">{mysqlVersion ? "MySQL connected" : "MySQL offline"}</p>
            <p className="truncate font-mono text-[10.5px] text-muted-foreground">
              {mysqlVersion ? `v${mysqlVersion} · campus_events_db` : "check DB_HOST / DB_PASSWORD"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <ThemeSwitch />
          <ConfirmAction
            trigger={
              <>
                <RotateCcw /> Reset data
              </>
            }
            variant="ghost"
            size="sm"
            title="Reset the database?"
            description="Drops every table and reloads 01_schema.sql, 02_data.sql and 03_routines.sql. All changes you made will be lost."
            confirmLabel="Reset database"
            action={resetDatabase}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-sidebar/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <CalendarDays className="size-4" />
          </div>
          <span className="text-sm font-semibold">Campus Events</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-zinc-950/40" onClick={() => setOpen(false)} />
          <aside className="animate-slide-in absolute inset-y-0 left-0 w-72 border-r border-border bg-sidebar shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
            {content}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-sidebar lg:block">{content}</aside>
    </>
  );
}

function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div className="flex items-center rounded-lg border border-border p-0.5" role="radiogroup" aria-label="Theme">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mounted && theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "grid size-7 cursor-pointer place-items-center rounded-md transition-colors",
            mounted && theme === value ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
