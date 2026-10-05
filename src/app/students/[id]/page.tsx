import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Mail, MessageSquareText, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { getOptions, getStudent } from "@/lib/data";
import { addMembership, deleteStudent, removeMembership, updateMembershipRole, updateStudent } from "@/lib/actions";
import { membershipFields, studentFields } from "@/lib/forms";
import { MEMBER_ROLES } from "@/lib/types";
import { formatDate, formatTaka } from "@/lib/utils";
import { Avatar, Badge, Card, CardHeader, EmptyState, PageHeader, Stars, Table, Td, Th, Tr } from "@/components/ui";
import { ActiveBadge, CategoryBadge, StatusBadge } from "@/components/badges";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmAction, InlineSelect } from "@/components/actions-ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Student #${(await params).id}` };
}

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [data, options] = await Promise.all([getStudent(id), getOptions()]);
  if (!data) notFound();
  const { student: s, memberships, registrations, feedback } = data;

  const joinedClubIds = new Set(memberships.map((m) => m.club_id));
  const availableClubs = options.clubs.filter((c) => !joinedClubIds.has(Number(c.value)));
  const attended = registrations.filter((r) => r.attended).length;

  return (
    <>
      <PageHeader
        back={{ href: "/students", label: "Students" }}
        title={
          <span className="flex items-center gap-4">
            <Avatar name={s.full_name} className="size-12 text-sm" />
            {s.full_name}
          </span>
        }
        eyebrow={
          <>
            <ActiveBadge active={s.is_active} />
            <Badge>{s.department}</Badge>
            <span className="font-mono text-xs text-muted-foreground">student_id = {s.student_id}</span>
          </>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" /> {s.email}
            </span>
            <span>Batch {s.batch_year}</span>
            <span>Joined {formatDate(s.joined_on)}</span>
          </span>
        }
        actions={
          <>
            <FormDialog
              trigger={
                <>
                  <Pencil /> Edit
                </>
              }
              triggerVariant="outline"
              title="Edit student"
              fields={studentFields(s)}
              action={updateStudent.bind(null, s.student_id)}
            />
            <ConfirmAction
              trigger={<Trash2 />}
              size="icon"
              ariaLabel="Delete student"
              title={`Delete ${s.full_name}?`}
              description="Memberships, registrations and feedback for this student are deleted too (ON DELETE CASCADE)."
              confirmLabel="Delete student"
              action={deleteStudent.bind(null, s.student_id)}
              redirectTo="/students"
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader
            title={`Clubs (${memberships.length})`}
            description="memberships bridge table"
            action={
              availableClubs.length > 0 && (
                <FormDialog
                  trigger={<Plus />}
                  triggerSize="icon"
                  triggerVariant="ghost"
                  title="Join a club"
                  fields={membershipFields({ name: "club_id", label: "Club", options: availableClubs })}
                  action={addMembership.bind(null, { studentId: s.student_id })}
                />
              )
            }
          />
          {memberships.length === 0 ? (
            <EmptyState icon={<Sparkles />} title="Not in any club yet" />
          ) : (
            <ul className="divide-y divide-border">
              {memberships.map((m) => (
                <li key={m.club_id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/clubs/${m.club_id}`} className="block truncate text-sm font-medium hover:text-primary">
                      {m.club_name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <CategoryBadge category={m.category} /> since {formatDate(m.joined_on)}
                    </div>
                  </div>
                  <InlineSelect
                    label="Role"
                    value={m.member_role}
                    options={MEMBER_ROLES}
                    action={updateMembershipRole.bind(null, s.student_id, m.club_id)}
                  />
                  <ConfirmAction
                    trigger={<X />}
                    variant="ghost"
                    size="icon"
                    ariaLabel={`Leave ${m.club_name}`}
                    title={`Remove from ${m.club_name}?`}
                    confirmLabel="Remove"
                    action={removeMembership.bind(null, s.student_id, m.club_id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title={`Events (${registrations.length})`}
            description={`${attended} attended · register from an event's page`}
          />
          {registrations.length === 0 ? (
            <EmptyState icon={<CalendarDays />} title="No registrations yet" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Event</Th>
                  <Th>Date</Th>
                  <Th className="hidden text-right sm:table-cell">Fee</Th>
                  <Th>Status</Th>
                  <Th>Attended</Th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <Tr key={r.reg_id}>
                    <Td>
                      <Link href={`/events/${r.event_id}`} className="font-medium hover:text-primary">
                        {r.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{r.club_name}</p>
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{formatDate(r.event_date)}</Td>
                    <Td className="tabular hidden text-right sm:table-cell">{r.fee > 0 ? formatTaka(r.fee) : "Free"}</Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td>{r.attended ? <Badge tone="green">Yes</Badge> : <Badge>No</Badge>}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title={`Feedback given (${feedback.length})`} />
        {feedback.length === 0 ? (
          <EmptyState icon={<MessageSquareText />} title="No feedback from this student" />
        ) : (
          <ul className="divide-y divide-border">
            {feedback.map((f) => (
              <li key={f.feedback_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <Link href={`/events/${f.event_id}`} className="font-medium hover:text-primary">
                  {f.title}
                </Link>
                <Stars value={f.rating} />
                <span className="flex-1 text-muted-foreground">{f.comment ?? ""}</span>
                <span className="text-xs text-muted-foreground">{formatDate(f.given_on)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
