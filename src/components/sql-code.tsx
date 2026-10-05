import { Fragment } from "react";
import { cn } from "@/lib/utils";

const KEYWORDS = new Set(
  `select from where and or not in is null as on join inner left right outer group by order having limit union all exists
   insert into values update set delete create replace view distinct case when then else end between like asc desc count sum
   avg min max round call begin declare if elseif return returns trigger procedure function for each row after before cursor
   open fetch close loop leave signal sqlstate start transaction commit rollback any some with using`
    .split(/\s+/)
    .filter(Boolean),
);

// Splits SQL into comments, strings, numbers, words and everything else.
const TOKEN = /(--[^\n]*)|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+|[^\sA-Za-z0-9_']+)/g;

/** Lightweight SQL syntax colouring (no extra dependency). */
export function SqlCode({ sql, className }: { sql: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let i = 0;
  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(sql)) !== null) {
    const [text, comment, str, num, word] = match;
    let cls = "";
    if (comment) cls = "text-muted-foreground italic";
    else if (str) cls = "text-emerald-600 dark:text-emerald-400";
    else if (num) cls = "text-amber-600 dark:text-amber-300";
    else if (word && KEYWORDS.has(word.toLowerCase())) cls = "text-indigo-600 dark:text-indigo-300 font-medium";
    else if (word && /^(fn|sp|trg|v)_/.test(word)) cls = "text-pink-600 dark:text-pink-300";
    parts.push(cls ? <span key={i++} className={cls}>{text}</span> : <Fragment key={i++}>{text}</Fragment>);
  }
  return (
    <pre
      className={cn(
        "scroll-thin overflow-auto rounded-lg bg-subtle p-4 font-mono text-[12.5px] leading-relaxed text-foreground/90",
        className,
      )}
    >
      <code>{parts}</code>
    </pre>
  );
}
