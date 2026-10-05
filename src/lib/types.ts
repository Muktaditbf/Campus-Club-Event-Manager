export type EventStatus = "planned" | "completed" | "cancelled";
export type ClubCategory = "academic" | "cultural" | "sports" | "tech" | "social";
export type MemberRole = "member" | "executive" | "president";

export const EVENT_STATUSES: EventStatus[] = ["planned", "completed", "cancelled"];
export const CLUB_CATEGORIES: ClubCategory[] = ["academic", "cultural", "sports", "tech", "social"];
export const MEMBER_ROLES: MemberRole[] = ["member", "executive", "president"];

export type ActionResult = {
  ok: boolean;
  message: string;
  /** "warning" = the database politely refused (e.g. a procedure's validation message). */
  tone?: "success" | "warning" | "error";
};

export type Option = { value: string | number; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "datetime-local" | "select" | "textarea";
  options?: Option[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  defaultValue?: string | number | null;
  hint?: string;
  full?: boolean;
};

export interface EventRow {
  event_id: number;
  club_id: number;
  club_name: string;
  category: ClubCategory;
  venue_id: number | null;
  venue_name: string | null;
  building: string | null;
  title: string;
  event_date: string;
  fee: number;
  max_seats: number;
  status: EventStatus;
  registrations: number;
  attended: number;
  fill_rate: number | null;
  avg_rating: number;
  reviews: number;
  sponsorship: number;
}

export interface StudentRow {
  student_id: number;
  full_name: string;
  email: string;
  department: string;
  batch_year: number;
  joined_on: string;
  is_active: number;
  clubs: number;
  registrations: number;
  attended: number;
}

export interface ClubRow {
  club_id: number;
  club_name: string;
  category: ClubCategory;
  description: string | null;
  founded_on: string;
  members: number;
  events: number;
  president: string | null;
}

export interface VenueRow {
  venue_id: number;
  venue_name: string;
  building: string;
  capacity: number;
  events: number;
  upcoming: number;
  last_event: string | null;
}

export interface SponsorRow {
  sponsor_id: number;
  sponsor_name: string;
  industry: string;
  contact_email: string;
  events: number;
  total: number;
}

export interface RegistrationRow {
  reg_id: number;
  event_id: number;
  student_id: number;
  full_name: string;
  department: string;
  registered_on: string;
  attended: number;
  has_feedback: number;
}

export interface FeedbackRow {
  feedback_id: number;
  event_id: number;
  student_id: number;
  full_name: string;
  title: string;
  rating: number;
  comment: string | null;
  given_on: string;
}

export interface StatusLogRow {
  log_id: number;
  event_id: number;
  title: string | null;
  old_status: string;
  new_status: string;
  changed_on: string;
}

export type ResultSet =
  | { kind: "rows"; columns: string[]; rows: (string | number | null)[][]; rowCount: number; truncated: boolean }
  | { kind: "status"; affectedRows: number; insertId: number; info: string };

export type RunResult =
  | { ok: true; sets: ResultSet[]; elapsedMs: number; committed: boolean; mutated: boolean }
  | { ok: false; error: string; elapsedMs: number };

export type SavedQuery = {
  number: number;
  title: string;
  sql: string;
  section: string;
  mutates: boolean;
};
