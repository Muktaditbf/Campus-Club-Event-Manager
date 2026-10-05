import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, HandCoins, Pencil, Plus, Ticket, Trash2, UserPlus, Users, X } from "lucide-react";
import { getClub, getOptions } from "@/lib/data";
import { addMembership, createEvent, deleteClub, removeMembership, updateClub, updateMembershipRole } from "@/lib/actions";
import { clubFields, eventFields, membershipFields } from "@/lib/forms";
import { MEMBER_ROLES } from "@/lib/types";
import { formatDate, formatTaka } from "@/lib/utils";
import { Avatar, Card, CardHeader, EmptyState, FillBar, PageHeader, StatCard, Table, Td, Th, Tr } from "@/components/ui";
import { CategoryBadge, StatusBadge } from "@/components/badges";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmAction, InlineSelect } from "@/components/actions-ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Club #${(await params).id}` };
}

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [data, options] = await Promise.all([getClub(id), getOptions()]);
  if (!data) notFound();
  const { club: c, members, events, revenue } = data;

  const memberIds = new Set(members.map((m) => m.student_id));
  const candidates = options.students.filter((s) => !memberIds.has(Number(s.value)));

  return (
    <>
      <PageHeader
        back={{ href: "/clubs", label: "Clubs" }}
        eyebrow={
          <>
            <CategoryBadge category={c.category} />
            <span className="font-mono text-xs text-muted-foreground">club_id = {c.club_id}</span>
          </>
        }
        title={c.club_name}
        description={`${c.description ?? "No description."} Founded ${formatDate(c.founded_on)}.`}
        actions={
          <>
            <FormDialog
              trigger={
                <>
                  <Pencil /> Edit
                </>
              }
              triggerVariant="outline"
              title="Edit club"
              fields={clubFields(c)}
              action={updateClub.bind(null, c.club_id)}
            />
            <ConfirmAction
              trigger={<Trash2 />}
              size="icon"
              ariaLabel="Delete club"
              title={`Delete ${c.club_name}?`}
              description={
                c.events > 0
                  ? "This club has events. The foreign key fk_event_club uses ON DELETE RESTRICT, so MySQL will refuse. Try it to see."
                  : "Memberships are removed with it (ON DELETE CASCADE)."
              }
              confirmLabel="Delete club"
              action={deleteClub.bind(null, c.club_id)}
              redirectTo="/clubs"
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={c.members} sub={c.president ? `President: ${c.president}` : "No president"} icon={<Users />} />
        <StatCard label="Events" value={c.events} sub={`${events.filter((e) => e.status === "planned").length} planned`} icon={<CalendarDays />} accent="green" />
        <StatCard label="Ticket income" value={formatTaka(revenue.fee_income)} sub="fee × attended, completed events" icon={<Ticket />} accent="sky" />
        <StatCard label="Sponsorship" value={formatTaka(revenue.sponsorship)} sub="from event_sponsors" icon={<HandCoins />} accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Members"
            description="Change roles inline"
            action={
              candidates.length > 0 && (
                <FormDialog
                  trigger={
                    <>
                      <UserPlus /> Add
                    </>
                  }
                  triggerSize="sm"
                  triggerVariant="outline"
                  title={`Add member to ${c.club_name}`}
                  fields={membershipFields({ name: "student_id", label: "Student", options: candidates })}
                  action={addMembership.bind(null, { clubId: c.club_id })}
                />
              )
            }
          />
          {members.length === 0 ? (
            <EmptyState icon={<Users />} title="No members yet" />
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => (
                <li key={m.student_id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={m.full_name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/students/${m.student_id}`} className="block truncate text-sm font-medium hover:text-primary">
                      {m.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {m.department} · {m.batch_year}
                    </p>
                  </div>
                  <InlineSelect
                    label="Role"
                    value={m.member_role}
                    options={MEMBER_ROLES}
                    action={updateMembershipRole.bind(null, m.student_id, c.club_id)}
                  />
                  <ConfirmAction
                    trigger={<X />}
                    variant="ghost"
                    size="icon"
                    ariaLabel={`Remove ${m.full_name}`}
                    title={`Remove ${m.full_name} from the club?`}
                    confirmLabel="Remove"
                    action={removeMembership.bind(null, m.student_id, c.club_id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader
            title="Events"
            action={
              <FormDialog
                trigger={
                  <>
                    <Plus /> New event
                  </>
                }
                triggerSize="sm"
                triggerVariant="outline"
                title="Create event"
                fields={eventFields(options, null).map((f) => (f.name === "club_id" ? { ...f, defaultValue: c.club_id } : f))}
                action={createEvent}
              />
            }
          />
          {events.length === 0 ? (
            <EmptyState icon={<CalendarDays />} title="This club hasn't organised any events" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Event</Th>
                  <Th>Date</Th>
                  <Th className="hidden w-36 sm:table-cell">Seats filled</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <Tr key={e.event_id}>
                    <Td>
                      <Link href={`/events/${e.event_id}`} className="font-medium hover:text-primary">
                        {e.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{e.venue_name ?? "No venue"}</p>
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{formatDate(e.event_date)}</Td>
                    <Td className="hidden sm:table-cell">
                      <FillBar value={e.fill_rate} />
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
      </div>
    </>
  );
}
