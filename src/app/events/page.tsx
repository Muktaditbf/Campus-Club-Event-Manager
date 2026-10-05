import Link from "next/link";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { getOptions, listEvents } from "@/lib/data";
import { query } from "@/lib/db";
import { createEvent } from "@/lib/actions";
import { eventFields } from "@/lib/forms";
import { formatDate, formatTaka, formatTime } from "@/lib/utils";
import { Card, EmptyState, FillBar, PageHeader, Stars, Table, Td, Th, Tr } from "@/components/ui";
import { CategoryBadge, StatusBadge } from "@/components/badges";
import { FormDialog } from "@/components/form-dialog";
import { ListFilters } from "@/components/list-filters";
import { SqlHint } from "@/components/sql-hint";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q : "";

  const [events, counts, options] = await Promise.all([
    listEvents({ status: status || undefined, q: q || undefined }),
    query<{ status: string; n: number }>(`SELECT status, COUNT(*) AS n FROM events GROUP BY status`),
    getOptions(),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const total = counts.reduce((sum, c) => sum + c.n, 0);

  return (
    <>
      <PageHeader
        title="Events"
        description="Everything clubs organise. Seat fill and ratings come from the stored functions fn_fill_rate() and fn_avg_rating()."
        actions={
          <FormDialog
            trigger={
              <>
                <Plus /> New event
              </>
            }
            title="Create event"
            description="New events start as planned. Registration opens once it exists."
            fields={eventFields(options)}
            action={createEvent}
            submitLabel="Create event"
          />
        }
      />

      <Card>
        <ListFilters
          values={{ status, q }}
          placeholder="Search title or club…"
          tabs={{
            name: "status",
            options: [
              { value: "", label: "All", count: total },
              { value: "planned", label: "Planned", count: count("planned") },
              { value: "completed", label: "Completed", count: count("completed") },
              { value: "cancelled", label: "Cancelled", count: count("cancelled") },
            ],
          }}
        />
        {events.length === 0 ? (
          <EmptyState icon={<CalendarDays />} title="No events match">
            Try a different search or status.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Event</Th>
                <Th>Date</Th>
                <Th className="hidden md:table-cell">Venue</Th>
                <Th className="text-right">Fee</Th>
                <Th className="w-44">
                  <span className="inline-flex items-center gap-2">
                    Seats filled
                    <SqlHint sql={`SELECT fn_fill_rate(event_id) FROM events;\n-- 100 * registrations / max_seats`} align="left" />
                  </span>
                </Th>
                <Th className="hidden lg:table-cell">Rating</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <Tr key={e.event_id}>
                  <Td>
                    <Link href={`/events/${e.event_id}`} className="group block min-w-48">
                      <p className="font-medium group-hover:text-primary">{e.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {e.club_name} <CategoryBadge category={e.category} />
                      </p>
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <p>{formatDate(e.event_date)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(e.event_date)}</p>
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {e.venue_name ?? "—"}
                    </span>
                  </Td>
                  <Td className="tabular whitespace-nowrap text-right">{e.fee > 0 ? formatTaka(e.fee) : <span className="text-emerald-600 dark:text-emerald-400">Free</span>}</Td>
                  <Td>
                    <FillBar value={e.fill_rate} />
                    <p className="tabular mt-1 text-[11px] text-muted-foreground">
                      {e.registrations} / {e.max_seats} seats
                    </p>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {e.reviews > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Stars value={e.avg_rating} />
                        <span className="tabular text-xs text-muted-foreground">{Number(e.avg_rating).toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={e.status} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
