import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarCheck2, HandCoins, History, Star, Users } from "lucide-react";
import { getDashboard } from "@/lib/data";
import { formatDate, formatDateTime, formatNumber, formatTaka } from "@/lib/utils";
import { Card, CardHeader, EmptyState, FillBar, PageHeader, StatCard, Stars } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { CategoryChart, RegistrationsChart, RevenueChart } from "@/components/charts";
import { SqlHint } from "@/components/sql-hint";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { stats, monthly, categories, revenue, upcoming, topRated, activity } = await getDashboard();
  const attendance = stats.registrations ? Math.round((100 * stats.attended) / stats.registrations) : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A live view of clubs, events, registrations and sponsorship. Every number below is calculated by MySQL."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active students"
          value={formatNumber(stats.active_students)}
          sub={`${stats.total_students} enrolled in total`}
          icon={<Users />}
          accent="indigo"
        />
        <StatCard
          label="Events"
          value={formatNumber(stats.events)}
          sub={`${stats.completed} completed · ${stats.planned} planned · ${stats.cancelled} cancelled`}
          icon={<CalendarCheck2 />}
          accent="green"
        />
        <StatCard
          label="Sponsorship raised"
          value={formatTaka(stats.sponsorship)}
          sub={`across ${stats.clubs} clubs`}
          icon={<HandCoins />}
          accent="amber"
        />
        <StatCard
          label="Average rating"
          value={
            <span className="flex items-baseline gap-2">
              {Number(stats.avg_rating).toFixed(2)} <Stars value={stats.avg_rating} />
            </span>
          }
          sub={`${stats.feedback_count} reviews · ${attendance}% attendance`}
          icon={<Star />}
          accent="pink"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="Registrations by month"
            description="Sign-ups versus actual attendance"
            action={
              <SqlHint
                sql={`SELECT DATE_FORMAT(e.event_date, '%Y-%m') AS month,
       COUNT(r.reg_id) AS registrations,
       IFNULL(SUM(r.attended), 0) AS attended
  FROM events e
  LEFT JOIN registrations r ON r.event_id = e.event_id
 GROUP BY month
 ORDER BY month;`}
              />
            }
          />
          <div className="px-3 pb-3 pt-4">
            <RegistrationsChart data={monthly} />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader
            title="Sign-ups by club category"
            description="Which kinds of clubs draw the most students"
            action={
              <SqlHint
                sql={`SELECT c.category, COUNT(r.reg_id) AS registrations
  FROM clubs c
  JOIN events e ON e.club_id = c.club_id
  LEFT JOIN registrations r ON r.event_id = e.event_id
 GROUP BY c.category
 ORDER BY registrations DESC;`}
              />
            }
          />
          <div className="p-5">
            <CategoryChart data={categories} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="Club revenue"
            description="Ticket fees from attendees plus sponsorship, per club"
            action={<SqlHint label="CALL" sql={`-- Stored procedure with a CURSOR over clubs\nCALL sp_club_revenue_report();`} />}
          />
          <div className="px-3 pb-3 pt-4">
            <RevenueChart data={revenue} />
          </div>
        </Card>

        <Card className="flex flex-col xl:col-span-2">
          <CardHeader
            title="Upcoming events"
            description="Planned events and how full they are"
            action={
              <Link href="/events?status=planned" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState icon={<CalendarCheck2 />} title="No planned events">
              Create one from the Events page.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((e) => (
                <li key={e.event_id}>
                  <Link href={`/events/${e.event_id}`} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-subtle">
                    <DateTile value={e.event_date} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.club_name} · {e.venue_name ?? "No venue"}
                      </p>
                      <FillBar value={e.fill_rate} className="mt-2" />
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Top rated events"
            description="Uses the stored function fn_avg_rating()"
            action={<SqlHint sql={`SELECT title, fn_avg_rating(event_id) AS avg_rating\n  FROM events\n ORDER BY avg_rating DESC\n LIMIT 5;`} />}
          />
          <ul className="divide-y divide-border">
            {topRated.map((e, i) => (
              <li key={e.event_id}>
                <Link href={`/events/${e.event_id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-subtle">
                  <span className="tabular w-4 text-xs font-medium text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.club_name} · {e.reviews} {e.reviews === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-semibold">{Number(e.avg_rating).toFixed(2)}</p>
                    <Stars value={e.avg_rating} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Status changes"
            description="Written automatically by the trigger trg_events_status_log"
            action={
              <SqlHint
                sql={`SELECT l.*, e.title
  FROM event_status_log l
  LEFT JOIN events e ON e.event_id = l.event_id
 ORDER BY l.changed_on DESC
 LIMIT 6;`}
              />
            }
          />
          {activity.length === 0 ? (
            <EmptyState icon={<History />} title="No status changes yet">
              Open an event and change its status, or cancel it. The trigger will log it here.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((a) => (
                <li key={a.log_id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <Link href={`/events/${a.event_id}`} className="truncate font-medium hover:text-primary">
                      {a.title ?? `Event #${a.event_id}`}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.changed_on)}</p>
                  </div>
                  <StatusBadge status={a.old_status} />
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <StatusBadge status={a.new_status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function DateTile({ value }: { value: string }) {
  const [day, month] = formatDate(value).split(" ");
  return (
    <div className="grid w-11 shrink-0 place-items-center rounded-lg border border-border bg-subtle py-1.5 text-center leading-none">
      <span className="text-[10px] font-medium uppercase text-primary">{month}</span>
      <span className="tabular mt-1 text-base font-semibold">{day}</span>
    </div>
  );
}
