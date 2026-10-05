import { CLUB_CATEGORIES, MEMBER_ROLES, type ClubRow, type EventRow, type FieldDef, type Option, type SponsorRow, type StudentRow, type VenueRow } from "./types";
import { titleCase, toDateTimeInput } from "./utils";

const today = () => new Date().toISOString().slice(0, 10);
const asOptions = (values: string[]): Option[] => values.map((v) => ({ value: v, label: titleCase(v) }));

export const DEPARTMENTS = ["CSE", "EEE", "BBA", "Civil", "English", "Pharmacy", "Architecture", "Law"];

export function eventFields(opts: { clubs: Option[]; venues: Option[] }, e?: EventRow | null): FieldDef[] {
  return [
    { name: "title", label: "Title", type: "text", required: true, full: true, defaultValue: e?.title, placeholder: "e.g. Spring Code Sprint" },
    { name: "club_id", label: "Organising club", type: "select", required: true, options: opts.clubs, defaultValue: e?.club_id },
    { name: "venue_id", label: "Venue", type: "select", options: opts.venues, defaultValue: e?.venue_id ?? "" },
    { name: "event_date", label: "Date & time", type: "datetime-local", required: true, defaultValue: toDateTimeInput(e?.event_date) },
    { name: "fee", label: "Fee (৳)", type: "number", required: true, min: 0, step: "0.01", defaultValue: e?.fee ?? 0, hint: "0 = free" },
    { name: "max_seats", label: "Seats", type: "number", required: true, min: 1, defaultValue: e?.max_seats ?? 50 },
  ];
}

export function studentFields(s?: StudentRow | null): FieldDef[] {
  const departments = Array.from(new Set([...DEPARTMENTS, ...(s ? [s.department] : [])]));
  return [
    { name: "full_name", label: "Full name", type: "text", required: true, full: true, defaultValue: s?.full_name },
    { name: "email", label: "Email", type: "email", required: true, full: true, defaultValue: s?.email, placeholder: "name@campus.example" },
    { name: "department", label: "Department", type: "select", required: true, options: departments.map((d) => ({ value: d, label: d })),defaultValue: s?.department },
    { name: "batch_year", label: "Batch year", type: "number", required: true, min: 2000, max: 2100, defaultValue: s?.batch_year ?? new Date().getFullYear() },
    { name: "joined_on", label: "Joined on", type: "date", required: true, defaultValue: s?.joined_on ?? today() },
    {
      name: "is_active",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: 1, label: "Active" },
        { value: 0, label: "Inactive" },
      ],
      defaultValue: s?.is_active ?? 1,
    },
  ];
}

export function clubFields(c?: ClubRow | null): FieldDef[] {
  return [
    { name: "club_name", label: "Club name", type: "text", required: true, full: true, defaultValue: c?.club_name },
    { name: "category", label: "Category", type: "select", required: true, options: asOptions(CLUB_CATEGORIES), defaultValue: c?.category },
    { name: "founded_on", label: "Founded on", type: "date", required: true, defaultValue: c?.founded_on ?? today() },
    { name: "description", label: "Description", type: "textarea", defaultValue: c?.description ?? "", hint: "max 200 characters" },
  ];
}

export function membershipFields(pick: { name: "student_id" | "club_id"; label: string; options: Option[] }): FieldDef[] {
  return [
    { name: pick.name, label: pick.label, type: "select", required: true, options: pick.options, full: true },
    { name: "member_role", label: "Role", type: "select", required: true, options: asOptions(MEMBER_ROLES), defaultValue: "member" },
    { name: "joined_on", label: "Joined on", type: "date", required: true, defaultValue: today() },
  ];
}

export function venueFields(v?: VenueRow | null): FieldDef[] {
  return [
    { name: "venue_name", label: "Venue name", type: "text", required: true, full: true, defaultValue: v?.venue_name },
    { name: "building", label: "Building", type: "text", required: true, defaultValue: v?.building },
    { name: "capacity", label: "Capacity", type: "number", required: true, min: 1, defaultValue: v?.capacity ?? 100, hint: "CHECK > 0" },
  ];
}

export function sponsorFields(s?: SponsorRow | null): FieldDef[] {
  return [
    { name: "sponsor_name", label: "Sponsor name", type: "text", required: true, full: true, defaultValue: s?.sponsor_name },
    { name: "industry", label: "Industry", type: "text", required: true, defaultValue: s?.industry },
    { name: "contact_email", label: "Contact email", type: "email", required: true, defaultValue: s?.contact_email },
  ];
}
