import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { listVenues } from "@/lib/data";
import { createVenue, deleteVenue, updateVenue } from "@/lib/actions";
import { venueFields } from "@/lib/forms";
import { formatDate, formatNumber } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from "@/components/ui";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmAction } from "@/components/actions-ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Venues" };

export default async function VenuesPage() {
  const venues = await listVenues();
  const maxCapacity = Math.max(1, ...venues.map((v) => v.capacity));

  return (
    <>
      <PageHeader
        title="Venues"
        description="Rooms and grounds events can book. Deleting a venue keeps its events but clears their venue (ON DELETE SET NULL)."
        actions={
          <FormDialog
            trigger={
              <>
                <Plus /> Add venue
              </>
            }
            title="Add venue"
            fields={venueFields()}
            action={createVenue}
            submitLabel="Add venue"
          />
        }
      />

      <Card>
        {venues.length === 0 ? (
          <EmptyState icon={<Building2 />} title="No venues yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Venue</Th>
                <Th className="w-56">Capacity</Th>
                <Th className="text-right">Events</Th>
                <Th className="hidden md:table-cell">Last booked</Th>
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <Tr key={v.venue_id}>
                  <Td>
                    <p className="font-medium">{v.venue_name}</p>
                    <p className="text-xs text-muted-foreground">{v.building}</p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${(100 * v.capacity) / maxCapacity}%` }} />
                      </div>
                      <span className="tabular w-12 text-right text-xs">{formatNumber(v.capacity)}</span>
                    </div>
                  </Td>
                  <Td className="text-right">
                    {v.events === 0 ? (
                      <Badge>Never booked</Badge>
                    ) : (
                      <span className="tabular">
                        {v.events}
                        {v.upcoming > 0 && <span className="ml-1 text-xs text-primary">({v.upcoming} upcoming)</span>}
                      </span>
                    )}
                  </Td>
                  <Td className="hidden whitespace-nowrap text-muted-foreground md:table-cell">{formatDate(v.last_event)}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <FormDialog
                        trigger={<Pencil />}
                        triggerVariant="ghost"
                        triggerSize="icon"
                        title={`Edit ${v.venue_name}`}
                        fields={venueFields(v)}
                        action={updateVenue.bind(null, v.venue_id)}
                      />
                      <ConfirmAction
                        trigger={<Trash2 />}
                        variant="ghost"
                        size="icon"
                        ariaLabel={`Delete ${v.venue_name}`}
                        title={`Delete ${v.venue_name}?`}
                        description={
                          v.events > 0
                            ? `${v.events} event(s) use this venue. They will keep existing with venue_id = NULL.`
                            : "No events use this venue."
                        }
                        confirmLabel="Delete venue"
                        action={deleteVenue.bind(null, v.venue_id)}
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
