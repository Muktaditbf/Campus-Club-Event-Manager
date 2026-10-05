import { Handshake, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { listSponsors } from "@/lib/data";
import { createSponsor, deleteSponsor, updateSponsor } from "@/lib/actions";
import { sponsorFields } from "@/lib/forms";
import { formatTaka } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td, Th, Tr } from "@/components/ui";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmAction } from "@/components/actions-ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sponsors" };

export default async function SponsorsPage() {
  const sponsors = await listSponsors();
  const total = sponsors.reduce((s, x) => s + x.total, 0);
  const active = sponsors.filter((s) => s.events > 0).length;
  const top = sponsors[0];

  return (
    <>
      <PageHeader
        title="Sponsors"
        description="Companies that fund events. Amounts live in the event_sponsors bridge table; add them from an event's page."
        actions={
          <FormDialog
            trigger={
              <>
                <Plus /> Add sponsor
              </>
            }
            title="Add sponsor"
            fields={sponsorFields()}
            action={createSponsor}
            submitLabel="Add sponsor"
          />
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total sponsorship" value={formatTaka(total)} icon={<Handshake />} accent="amber" />
        <StatCard label="Active sponsors" value={`${active} / ${sponsors.length}`} sub="have funded at least one event" />
        <StatCard label="Top sponsor" value={top?.sponsor_name ?? "—"} sub={top ? formatTaka(top.total) : undefined} />
      </div>

      <Card>
        {sponsors.length === 0 ? (
          <EmptyState icon={<Handshake />} title="No sponsors yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Sponsor</Th>
                <Th className="hidden sm:table-cell">Industry</Th>
                <Th className="hidden md:table-cell">Contact</Th>
                <Th className="text-right">Events</Th>
                <Th className="text-right">Total</Th>
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {sponsors.map((s) => (
                <Tr key={s.sponsor_id}>
                  <Td className="font-medium">{s.sponsor_name}</Td>
                  <Td className="hidden sm:table-cell">
                    <Badge>{s.industry}</Badge>
                  </Td>
                  <Td className="hidden text-muted-foreground md:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {s.contact_email}
                    </span>
                  </Td>
                  <Td className="tabular text-right">{s.events}</Td>
                  <Td className="tabular text-right font-medium">{s.total > 0 ? formatTaka(s.total) : <span className="text-muted-foreground">—</span>}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <FormDialog
                        trigger={<Pencil />}
                        triggerVariant="ghost"
                        triggerSize="icon"
                        title={`Edit ${s.sponsor_name}`}
                        fields={sponsorFields(s)}
                        action={updateSponsor.bind(null, s.sponsor_id)}
                      />
                      <ConfirmAction
                        trigger={<Trash2 />}
                        variant="ghost"
                        size="icon"
                        ariaLabel={`Delete ${s.sponsor_name}`}
                        title={`Delete ${s.sponsor_name}?`}
                        description="Its sponsorship rows are deleted too (ON DELETE CASCADE)."
                        confirmLabel="Delete sponsor"
                        action={deleteSponsor.bind(null, s.sponsor_id)}
                      />
                    </div>
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
