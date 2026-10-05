import { Eye, KeyRound, Link2, ShieldCheck, Sparkle, Zap } from "lucide-react";
import { getSchema } from "@/lib/data";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { SqlCode } from "@/components/sql-code";
import { ErDiagram } from "@/components/er-diagram";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schema" };

export default async function SchemaPage() {
  const { tables, routines, triggers } = await getSchema();
  const baseTables = tables.filter((t) => t.type === "BASE TABLE");
  const views = tables.filter((t) => t.type === "VIEW");
  const counts = Object.fromEntries(baseTables.map((t) => [t.name, t.rows]));

  const summary = [
    { label: "Tables", value: baseTables.length },
    { label: "Columns", value: baseTables.reduce((s, t) => s + t.columns.length, 0) },
    { label: "Foreign keys", value: baseTables.reduce((s, t) => s + t.foreignKeys.length, 0) },
    { label: "CHECK constraints", value: baseTables.reduce((s, t) => s + t.checks.length, 0) },
    { label: "Functions & procedures", value: routines.length },
    { label: "Triggers", value: triggers.length },
  ];

  return (
    <>
      <PageHeader
        title="Schema"
        description="Read live from MySQL's information_schema: tables, keys, constraints, stored routines and triggers in campus_events_db."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {summary.map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <p className="tabular text-xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader title="Relationships" description="Click a table to jump to its columns" />
        <div className="p-5">
          <ErDiagram counts={counts} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...baseTables, ...views].map((t) => {
          const fkColumns = new Set(t.foreignKeys.map((f) => f.column_name));
          return (
            <Card key={t.name} id={`table-${t.name}`} className="scroll-mt-20">
              <CardHeader
                title={<span className="font-mono">{t.name}</span>}
                description={
                  t.referencedBy.length > 0
                    ? `Referenced by ${[...new Set(t.referencedBy.map((r) => r.table_name))].join(", ")}`
                    : t.type === "VIEW"
                      ? "Created by Q29 in the Query Lab"
                      : "Not referenced by other tables"
                }
                action={
                  t.type === "VIEW" ? (
                    <Badge tone="violet">
                      <Eye className="size-3" /> View
                    </Badge>
                  ) : (
                    <Badge>{t.rows} rows</Badge>
                  )
                }
              />
              <ul className="divide-y divide-border">
                {t.columns.map((c) => (
                  <li key={c.column_name} className="flex items-center gap-3 px-5 py-2 text-[13px]">
                    <span className="grid w-4 place-items-center">
                      {c.column_key === "PRI" ? (
                        <KeyRound className="size-3.5 text-amber-500" aria-label="Primary key" />
                      ) : fkColumns.has(c.column_name) ? (
                        <Link2 className="size-3.5 text-indigo-500" aria-label="Foreign key" />
                      ) : c.column_key === "UNI" ? (
                        <Sparkle className="size-3.5 text-sky-500" aria-label="Unique" />
                      ) : null}
                    </span>
                    <span className="font-mono font-medium">{c.column_name}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{c.column_type}</span>
                    <span className="flex shrink-0 gap-1">
                      {c.extra.includes("auto_increment") && <Badge tone="amber">auto</Badge>}
                      {c.is_nullable === "YES" ? <Badge>null</Badge> : null}
                      {c.column_default !== null && <Badge tone="sky">= {c.column_default}</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
              {(t.foreignKeys.length > 0 || t.checks.length > 0) && (
                <div className="space-y-1.5 border-t border-border bg-subtle px-5 py-3 text-xs">
                  {t.foreignKeys.map((f) => (
                    <p key={f.constraint_name} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link2 className="size-3 text-indigo-500" />
                      <span className="font-mono">
                        {f.column_name} → {f.ref_table}.{f.ref_column}
                      </span>
                      <span className="text-muted-foreground">
                        ON DELETE {f.delete_rule} · ON UPDATE {f.update_rule}
                      </span>
                    </p>
                  ))}
                  {t.checks.map((c) => (
                    <p key={c.constraint_name} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <ShieldCheck className="size-3 text-emerald-500" />
                      <span className="font-mono">{c.constraint_name}</span>
                      <span className="font-mono text-muted-foreground">CHECK {c.check_clause}</span>
                    </p>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold tracking-tight">Stored routines</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {routines.map((r) => (
          <Card key={r.name} className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold">
                  {r.name}
                  <span className="font-normal text-muted-foreground">
                    ({r.params.map((p) => `${p.mode ? `${p.mode} ` : ""}${p.name} ${p.type}`).join(", ")})
                  </span>
                </p>
                {r.returns && <p className="mt-1 font-mono text-xs text-muted-foreground">RETURNS {r.returns}</p>}
              </div>
              <Badge tone={r.type === "FUNCTION" ? "pink" : "indigo"}>{r.type.toLowerCase()}</Badge>
            </div>
            {r.definition && (
              <details className="group border-t border-border">
                <summary className="cursor-pointer select-none px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                  Show body
                </summary>
                <SqlCode sql={r.definition} className="max-h-96 rounded-none" />
              </details>
            )}
          </Card>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold tracking-tight">Triggers</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {triggers.map((t) => (
          <Card key={t.name} className="overflow-hidden">
            <div className="px-5 py-4">
              <p className="flex items-center gap-2 font-mono text-sm font-semibold">
                <Zap className="size-3.5 text-amber-500" /> {t.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.timing} {t.event} ON <span className="font-mono">{t.table_name}</span> · FOR EACH ROW
              </p>
            </div>
            <details className="border-t border-border">
              <summary className="cursor-pointer select-none px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                Show body
              </summary>
              <SqlCode sql={t.body} className="max-h-80 rounded-none" />
            </details>
          </Card>
        ))}
      </div>
    </>
  );
}
