import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { listDepartments, listStudents } from "@/lib/data";
import { createStudent } from "@/lib/actions";
import { studentFields } from "@/lib/forms";
import { Avatar, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from "@/components/ui";
import { ActiveBadge } from "@/components/badges";
import { FormDialog } from "@/components/form-dialog";
import { ListFilters } from "@/components/list-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "Students" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const filters = { q: pick("q"), department: pick("department"), active: pick("active") };

  const [students, departments] = await Promise.all([
    listStudents({ q: filters.q || undefined, department: filters.department || undefined, active: filters.active || undefined }),
    listDepartments(),
  ]);

  return (
    <>
      <PageHeader
        title="Students"
        description="Everyone who can join clubs and register for events. Email is UNIQUE, so duplicates are rejected by MySQL."
        actions={
          <FormDialog
            trigger={
              <>
                <Plus /> Add student
              </>
            }
            title="Add student"
            fields={studentFields()}
            action={createStudent}
            submitLabel="Add student"
          />
        }
      />

      <Card>
        <ListFilters
          values={filters}
          placeholder="Search name or email…"
          selects={[
            { name: "department", label: "All departments", options: departments.map((d) => ({ value: d, label: d })) },
            {
              name: "active",
              label: "Any status",
              options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ],
            },
          ]}
        />
        {students.length === 0 ? (
          <EmptyState icon={<Users />} title="No students match" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Department</Th>
                <Th className="hidden sm:table-cell">Batch</Th>
                <Th className="text-right">Clubs</Th>
                <Th className="hidden text-right md:table-cell">Events</Th>
                <Th className="hidden text-right md:table-cell">Attended</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <Tr key={s.student_id}>
                  <Td>
                    <Link href={`/students/${s.student_id}`} className="group flex items-center gap-3">
                      <Avatar name={s.full_name} />
                      <div className="min-w-0">
                        <p className="font-medium group-hover:text-primary">{s.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </Link>
                  </Td>
                  <Td>{s.department}</Td>
                  <Td className="tabular hidden text-muted-foreground sm:table-cell">{s.batch_year}</Td>
                  <Td className="tabular text-right">{s.clubs}</Td>
                  <Td className="tabular hidden text-right md:table-cell">{s.registrations}</Td>
                  <Td className="tabular hidden text-right md:table-cell">{s.attended}</Td>
                  <Td>
                    <ActiveBadge active={s.is_active} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {students.length} {students.length === 1 ? "student" : "students"}
        </p>
      </Card>
    </>
  );
}
