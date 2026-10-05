import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Ban, Check, History, MessageSquareText, Pencil, Plus, Trash2, UserPlus, Users, X } from "lucide-react";
import { getEvent, getOptions } from "@/lib/data";
import {
  addFeedback,
  addSponsorship,
  cancelEvent,
  deleteEvent,
  deleteFeedback,
  registerStudent,
  removeRegistration,
  removeSponsorship,
  setEventStatus,
  toggleAttendance,
  updateEvent,
} from "@/lib/actions";
import { eventFields } from "@/lib/forms";
import { EVENT_STATUSES } from "@/lib/types";
import { formatDate, formatDateTime, formatTaka, formatTime } from "@/lib/utils";
import { Avatar, Badge, Card, CardHeader, EmptyState, FillBar, PageHeader, Stars, StatCard, Table, Td, Th, Tr } from "@/components/ui";
import { CategoryBadge, StatusBadge } from "@/components/badges";
import { FormDialog } from "@/components/form-dialog";
import { ActionButton, ConfirmAction, InlineSelect } from "@/components/actions-ui";
import { SqlHint } from "@/components/sql-hint";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Event #${(await params).id}` };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [data, options] = await Promise.all([getEvent(id), getOptions()]);
  if (!data) notFound();
  const { event: e, registrations, feedback, sponsors, log } = data;
  const attendedPct = e.registrations ? Math.round((100 * e.attended) / e.registrations) : 0;

  const feedbackStudents = registrations
    .filter((r) => !r.has_feedback)
    .map((r) => ({ value: r.student_id, label: `${r.full_name} · ${r.attended ? "attended" : "did not attend"}` }));

  return (
    <>
      <PageHeader
        back={{ href: "/events", label: "Events" }}
        eyebrow={
          <>
            <StatusBadge status={e.status} />
            <CategoryBadge category={e.category} />
            <span className="font-mono text-xs text-muted-foreground">event_id = {e.event_id}</span>
          </>
        }
        title={e.title}
        description={
          <>
            Organised by{" "}
            <Link href={`/clubs/${e.club_id}`} className="font-medium text-foreground hover:text-primary">
              {e.club_name}
            </Link>{" "}
            · {formatDate(e.event_date)} at {formatTime(e.event_date)} · {e.venue_name ?? "No venue yet"}
          </>
        }
        actions={
          <>
            <InlineSelect label="Event status" value={e.status} options={EVENT_STATUSES} action={setEventStatus.bind(null, e.event_id)} />
            {e.status === "planned" && (
              <ConfirmAction
                trigger={
                  <>
                    <Ban /> Cancel event
                  </>
                }
                title="Cancel this event?"
                description="Runs CALL sp_cancel_event(id). The trigger trg_events_status_log records the change."
                confirmLabel="Cancel event"
                action={cancelEvent.bind(null, e.event_id)}
              />
            )}
            <FormDialog
              trigger={
                <>
                  <Pencil /> Edit
                </>
              }
              triggerVariant="outline"
              title="Edit event"
              fields={eventFields(options, e)}
              action={updateEvent.bind(null, e.event_id)}
            />
            <ConfirmAction
              trigger={<Trash2 />}
              size="icon"
              ariaLabel="Delete event"
              title="Delete this event?"
              description="Its registrations, feedback and sponsorships are removed too (ON DELETE CASCADE)."
              confirmLabel="Delete event"
              action={deleteEvent.bind(null, e.event_id)}
              redirectTo="/events"
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Seats filled · fn_fill_rate()"
          value={e.fill_rate === null ? "—" : `${e.fill_rate}%`}
          sub={<FillBar value={e.fill_rate} className="mt-1" />}
          icon={<Users />}
        />
        <StatCard
          label="Attendance"
          value={`${e.attended} / ${e.registrations}`}
          sub={`${attendedPct}% of registered students came`}
          icon={<Check />}
          accent="green"
        />
        <StatCard
          label="Rating · fn_avg_rating()"
          value={
            <span className="flex items-baseline gap-2">
              {Number(e.avg_rating).toFixed(2)} <Stars value={e.avg_rating} />
            </span>
          }
          sub={`${e.reviews} ${e.reviews === 1 ? "review" : "reviews"}`}
          icon={<MessageSquareText />}
          accent="pink"
        />
        <StatCard
          label="Sponsorship"
          value={formatTaka(e.sponsorship)}
          sub={`${sponsors.length} ${sponsors.length === 1 ? "sponsor" : "sponsors"} · fee ${e.fee > 0 ? formatTaka(e.fee) : "free"}`}
          icon={<Plus />}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              title={`Registrations (${e.registrations})`}
              description="Click the attendance badge to toggle it"
              action={
                <>
                  <SqlHint
                    label="CALL"
                    sql={`CALL sp_register_student(${e.event_id}, :student_id, @msg);
SELECT @msg;
-- Checks: event exists, student active, event planned,
-- not already registered, seats left.
-- Trigger trg_reg_seat_check also blocks a full event.`}
                  />
                  <FormDialog
                    trigger={
                      <>
                        <UserPlus /> Register
                      </>
                    }
                    triggerSize="sm"
                    title="Register a student"
                    description={`For “${e.title}”`}
                    fields={[{ name: "student_id", label: "Student", type: "select", required: true, options: options.students, full: true }]}
                    action={registerStudent.bind(null, e.event_id)}
                    submitLabel="Register"
                    note="This calls the stored procedure sp_register_student. It replies with a message instead of an error when it refuses, for example when the event is not planned, the student is inactive, or there are no seats left."
                  />
                </>
              }
            />
            {registrations.length === 0 ? (
              <EmptyState icon={<Users />} title="No one has registered yet" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th className="hidden sm:table-cell">Registered</Th>
                    <Th>Attendance</Th>
                    <Th className="hidden md:table-cell">Feedback</Th>
                    <Th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <Tr key={r.reg_id}>
                      <Td>
                        <Link href={`/students/${r.student_id}`} className="group flex items-center gap-3">
                          <Avatar name={r.full_name} />
                          <div>
                            <p className="font-medium group-hover:text-primary">{r.full_name}</p>
                            <p className="text-xs text-muted-foreground">{r.department}</p>
                          </div>
                        </Link>
                      </Td>
                      <Td className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">{formatDateTime(r.registered_on)}</Td>
                      <Td>
                        <ActionButton action={toggleAttendance.bind(null, r.reg_id)} title="Toggle attendance" className="h-auto px-0 hover:bg-transparent">
                          {r.attended ? (
                            <Badge tone="green">
                              <Check className="size-3" /> Attended
                            </Badge>
                          ) : (
                            <Badge tone="gray">
                              <X className="size-3" /> Absent
                            </Badge>
                          )}
                        </ActionButton>
                      </Td>
                      <Td className="hidden md:table-cell">
                        {r.has_feedback ? <Badge tone="amber">Given</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </Td>
                      <Td className="text-right">
                        <ConfirmAction
                          trigger={<Trash2 />}
                          variant="ghost"
                          size="icon"
                          ariaLabel={`Remove ${r.full_name}`}
                          title={`Remove ${r.full_name}?`}
                          description="Deletes the registration row."
                          confirmLabel="Remove"
                          action={removeRegistration.bind(null, r.reg_id)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader
              title={`Feedback (${feedback.length})`}
              description="One rating per student, only from people who attended"
              action={
                feedbackStudents.length > 0 && (
                  <FormDialog
                    trigger={
                      <>
                        <MessageSquareText /> Add feedback
                      </>
                    }
                    triggerSize="sm"
                    triggerVariant="outline"
                    title="Add feedback"
                    fields={[
                      { name: "student_id", label: "Student", type: "select", required: true, options: feedbackStudents, full: true },
                      {
                        name: "rating",
                        label: "Rating",
                        type: "select",
                        required: true,
                        defaultValue: 5,
                        options: [5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${"★".repeat(n)}  ${n}` })),
                      },
                      { name: "comment", label: "Comment", type: "textarea", placeholder: "Optional, up to 200 characters" },
                    ]}
                    action={addFeedback.bind(null, e.event_id)}
                    note="The trigger trg_feedback_attended rejects feedback from students who did not attend. Try it with one marked “did not attend”."
                  />
                )
              }
            />
            {feedback.length === 0 ? (
              <EmptyState icon={<MessageSquareText />} title="No feedback yet" />
            ) : (
              <ul className="divide-y divide-border">
                {feedback.map((f) => (
                  <li key={f.feedback_id} className="flex gap-3 px-5 py-4">
                    <Avatar name={f.full_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-sm font-medium">{f.full_name}</p>
                        <Stars value={f.rating} />
                        <span className="text-xs text-muted-foreground">{formatDate(f.given_on)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{f.comment ?? <em>No comment</em>}</p>
                    </div>
                    <ConfirmAction
                      trigger={<Trash2 />}
                      variant="ghost"
                      size="icon"
                      ariaLabel="Delete feedback"
                      title="Delete this feedback?"
                      confirmLabel="Delete"
                      action={deleteFeedback.bind(null, f.feedback_id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <dl className="divide-y divide-border text-sm">
              {[
                ["Club", <Link key="c" href={`/clubs/${e.club_id}`} className="font-medium hover:text-primary">{e.club_name}</Link>],
                ["Venue", e.venue_name ? `${e.venue_name}, ${e.building}` : "—"],
                ["Date", formatDateTime(e.event_date)],
                ["Fee", e.fee > 0 ? formatTaka(e.fee, 2) : "Free"],
                ["Seats", `${e.max_seats}`],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Sponsors"
              description="event_sponsors bridge table"
              action={
                <FormDialog
                  trigger={<Plus />}
                  triggerSize="icon"
                  triggerVariant="ghost"
                  title="Add sponsorship"
                  fields={[
                    { name: "sponsor_id", label: "Sponsor", type: "select", required: true, options: options.sponsors, full: true },
                    { name: "amount", label: "Amount (৳)", type: "number", required: true, min: 1, step: "0.01", hint: "CHECK amount > 0" },
                  ]}
                  action={addSponsorship.bind(null, e.event_id)}
                />
              }
            />
            {sponsors.length === 0 ? (
              <EmptyState title="No sponsors yet" />
            ) : (
              <ul className="divide-y divide-border">
                {sponsors.map((s) => (
                  <li key={s.sponsor_id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.sponsor_name}</p>
                      <p className="text-xs text-muted-foreground">{s.industry}</p>
                    </div>
                    <span className="tabular text-sm font-medium">{formatTaka(s.amount)}</span>
                    <ConfirmAction
                      trigger={<X />}
                      variant="ghost"
                      size="icon"
                      ariaLabel={`Remove ${s.sponsor_name}`}
                      title={`Remove ${s.sponsor_name}?`}
                      confirmLabel="Remove"
                      action={removeSponsorship.bind(null, e.event_id, s.sponsor_id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Status history" description="Rows written by trg_events_status_log" />
            {log.length === 0 ? (
              <EmptyState icon={<History />} title="No changes recorded">
                Change the status above to see the trigger at work.
              </EmptyState>
            ) : (
              <ol className="space-y-4 px-5 py-4">
                {log.map((l) => (
                  <li key={l.log_id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={l.old_status} />
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                      <StatusBadge status={l.new_status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(l.changed_on)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
