import Link from "next/link";
import { CalendarDays, Crown, Plus, Users } from "lucide-react";
import { listClubs } from "@/lib/data";
import { createClub } from "@/lib/actions";
import { clubFields } from "@/lib/forms";
import { CLUB_CATEGORIES } from "@/lib/types";
import { cn, formatDate, titleCase } from "@/lib/utils";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CategoryBadge } from "@/components/badges";
import { FormDialog } from "@/components/form-dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clubs" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const accent: Record<string, string> = {
  tech: "from-violet-500/15",
  academic: "from-sky-500/15",
  cultural: "from-pink-500/15",
  sports: "from-emerald-500/15",
  social: "from-orange-500/15",
};

export default async function ClubsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : "";
  const clubs = await listClubs({ category: category || undefined });

  return (
    <>
      <PageHeader
        title="Clubs"
        description="Student societies. A club that has organised events can't be deleted (ON DELETE RESTRICT)."
        actions={
          <FormDialog
            trigger={
              <>
                <Plus /> New club
              </>
            }
            title="Create club"
            fields={clubFields()}
            action={createClub}
            submitLabel="Create club"
          />
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {["", ...CLUB_CATEGORIES].map((c) => (
          <Link
            key={c || "all"}
            href={c ? `/clubs?category=${c}` : "/clubs"}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3.5 text-xs font-medium transition-colors",
              category === c
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c ? titleCase(c) : "All clubs"}
          </Link>
        ))}
      </div>

      {clubs.length === 0 ? (
        <Card>
          <EmptyState icon={<Users />} title="No clubs in this category" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clubs.map((c) => (
            <Link key={c.club_id} href={`/clubs/${c.club_id}`} className="group">
              <Card
                className={cn(
                  "relative h-full overflow-hidden bg-gradient-to-br to-transparent to-50% p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md",
                  accent[c.category],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold tracking-tight group-hover:text-primary">{c.club_name}</h2>
                  <CategoryBadge category={c.category} />
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">{c.description ?? "No description."}</p>
                <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" /> {c.members} members
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" /> {c.events} events
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Crown className="size-3.5 text-amber-500" />
                    {c.president ?? "No president"}
                  </span>
                  <span className="text-muted-foreground">Since {formatDate(c.founded_on).split(" ").slice(1).join(" ")}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
