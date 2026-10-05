import { Badge, type Tone } from "./ui";
import { titleCase } from "@/lib/utils";

const statusTone: Record<string, Tone> = { planned: "indigo", completed: "green", cancelled: "red" };
const categoryTone: Record<string, Tone> = { tech: "violet", academic: "sky", cultural: "pink", sports: "green", social: "orange" };
const roleTone: Record<string, Tone> = { president: "amber", executive: "indigo", member: "gray" };

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTone[status] ?? "gray"} dot>
      {titleCase(status)}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return <Badge tone={categoryTone[category] ?? "gray"}>{titleCase(category)}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={roleTone[role] ?? "gray"}>{titleCase(role)}</Badge>;
}

export function ActiveBadge({ active }: { active: number | boolean }) {
  return active ? (
    <Badge tone="green" dot>
      Active
    </Badge>
  ) : (
    <Badge tone="gray" dot>
      Inactive
    </Badge>
  );
}
