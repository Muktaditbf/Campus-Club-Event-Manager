"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Play, RotateCcw, Search, ShieldCheck, XCircle } from "lucide-react";
import { runSql } from "@/lib/actions";
import type { ResultSet, RunResult, SavedQuery } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, Input } from "./ui";

export function QueryLab({ queries }: { queries: SavedQuery[] }) {
  const [selected, setSelected] = useState<number>(queries[0]?.number ?? 0);
  const current = queries.find((q) => q.number === selected);
  const [sql, setSql] = useState(current?.sql ?? "");
  const [keep, setKeep] = useState(false);
  const [filter, setFilter] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [pending, startTransition] = useTransition();

  const groups = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const map = new Map<string, SavedQuery[]>();
    for (const q of queries) {
      if (f && !`q${q.number} ${q.title} ${q.sql}`.toLowerCase().includes(f)) continue;
      map.set(q.section, [...(map.get(q.section) ?? []), q]);
    }
    return [...map.entries()];
  }, [queries, filter]);

  function run(text = sql, commit = keep) {
    startTransition(async () => setResult(await runSql(text, commit)));
  }

  function choose(q: SavedQuery) {
    setSelected(q.number);
    setSql(q.sql);
    setResult(null);
    if (!q.mutates) run(q.sql, false);
  }

  // Run the first query when the page opens.
  useEffect(() => {
    if (current && !current.mutates) run(current.sql, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: end } = el;
      const next = `${sql.slice(0, s)}  ${sql.slice(end)}`;
      setSql(next);
      requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
    }
  }

  const edited = current !== undefined && sql !== current.sql;
  const label = current ? (current.number >= 100 ? "Demo" : `Q${current.number}`) : "SQL";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <Card className="flex max-h-[calc(100dvh-12rem)] flex-col overflow-hidden lg:sticky lg:top-8">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter queries…" className="h-8 pl-8 text-xs" />
          </div>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-2">
          {groups.map(([section, items]) => (
            <div key={section} className="mb-3">
              <p className="px-2 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">{section}</p>
              <ul className="space-y-0.5">
                {items.map((q) => (
                  <li key={q.number}>
                    <button
                      type="button"
                      onClick={() => choose(q)}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors",
                        q.number === selected ? "bg-primary-soft text-primary" : "text-foreground/85 hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "tabular mt-px w-8 shrink-0 font-mono text-[11px]",
                          q.number === selected ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {q.number >= 100 ? "•" : `Q${q.number}`}
                      </span>
                      <span className="leading-snug">
                        {q.title}
                        {q.mutates && (
                          <span className="ml-1.5 rounded bg-amber-100 px-1 py-px text-[10px] font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                            writes
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {groups.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">No queries match.</p>}
        </div>
      </Card>

      <div className="min-w-0 space-y-4">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Badge tone="indigo" className="font-mono">
                {label}
              </Badge>
              <h2 className="truncate text-sm font-semibold">{current?.title ?? "Custom SQL"}</h2>
              {edited && <Badge tone="amber">edited</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {edited && (
                <Button variant="ghost" size="sm" onClick={() => current && setSql(current.sql)}>
                  <RotateCcw /> Revert
                </Button>
              )}
              <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs">
                <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="size-3.5 accent-[var(--primary)]" />
                Keep changes
              </label>
              <Button size="sm" onClick={() => run()} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Play />}
                Run
                <kbd className="ml-1 hidden rounded bg-white/20 px-1 font-mono text-[10px] sm:inline-flex">
                  Ctrl ↵
                </kbd>
              </Button>
            </div>
          </div>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            aria-label="SQL editor"
            rows={Math.min(18, Math.max(6, sql.split("\n").length + 1))}
            className="scroll-thin block w-full resize-y bg-subtle px-5 py-4 font-mono text-[13px] leading-relaxed text-foreground outline-none"
          />
          <div className="flex items-center gap-2 border-t border-border px-5 py-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            {keep
              ? "Changes will be committed to the database."
              : "Runs inside a transaction that is rolled back, so the data stays as it was. (CREATE/DROP always commit in MySQL.)"}
          </div>
        </Card>

        <Results result={result} pending={pending} />
      </div>
    </div>
  );
}

function Results({ result, pending }: { result: RunResult | null; pending: boolean }) {
  if (!result) {
    return (
      <Card className="grid place-items-center px-6 py-16 text-center text-sm text-muted-foreground">
        {pending ? <Loader2 className="size-5 animate-spin" /> : "Press Run to execute the SQL above."}
      </Card>
    );
  }
  if (!result.ok) {
    return (
      <Card className="border-rose-200 bg-rose-50/60 p-5 dark:border-rose-500/30 dark:bg-rose-500/5">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">MySQL returned an error</p>
            <p className="mt-1 font-mono text-[13px] text-rose-700/90 dark:text-rose-300/90">{result.error}</p>
            <p className="mt-2 text-xs text-muted-foreground">Nothing was changed. The transaction was rolled back · {result.elapsedMs} ms</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4 transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" /> Success
        </span>
        <span>
          {result.sets.length} {result.sets.length === 1 ? "result" : "results"}
        </span>
        <span>{result.elapsedMs} ms</span>
        {result.mutated && !result.committed && (
          <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="size-3.5" /> Preview only: the changes were rolled back
          </span>
        )}
        {result.mutated && result.committed && <span className="text-primary">Changes committed</span>}
      </div>
      {result.sets.map((set, i) => (
        <ResultView key={i} set={set} />
      ))}
    </div>
  );
}

function ResultView({ set }: { set: ResultSet }) {
  // Right-align a column (header too) when its values are numbers.
  const numeric = set.kind === "rows" ? set.columns.map((_, c) => set.rows.some((r) => typeof r[c] === "number")) : [];
  if (set.kind === "status") {
    return (
      <Card className="px-5 py-3 font-mono text-xs text-muted-foreground">
        Query OK, {set.affectedRows} {set.affectedRows === 1 ? "row" : "rows"} affected
        {set.insertId ? ` · insert id ${set.insertId}` : ""}
        {set.info ? ` · ${set.info}` : ""}
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <div className="scroll-thin max-h-[32rem] overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr>
              {set.columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    "whitespace-nowrap border-b border-border bg-subtle px-4 py-2 text-left font-mono text-[11px] font-medium text-muted-foreground",
                    numeric[i] && "text-right",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {set.rows.map((row, r) => (
              <tr key={r} className="hover:bg-subtle">
                {row.map((v, c) => (
                  <td
                    key={c}
                    className={cn(
                      "whitespace-nowrap border-b border-border px-4 py-2",
                      numeric[c] && "tabular text-right",
                    )}
                  >
                    {v === null ? <span className="italic text-muted-foreground/60">NULL</span> : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {set.rowCount === 0 && <p className="px-5 py-6 text-center text-xs text-muted-foreground">Empty set (0 rows)</p>}
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        {set.rowCount} {set.rowCount === 1 ? "row" : "rows"}
        {set.truncated && " · showing the first 500"}
      </p>
    </Card>
  );
}
