"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import type { Connection } from "mysql2/promise";
import { dbErrorMessage, execute, openMultiStatementConnection, withConnection, type Param } from "./db";
import type { ActionResult, ResultSet, RunResult } from "./types";

/* ---------------------------------------------------------------- helpers */

class InputError extends Error {}

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function required(fd: FormData, key: string, label: string) {
  const value = text(fd, key);
  if (!value) throw new InputError(`${label} is required.`);
  return value;
}

function optional(fd: FormData, key: string) {
  const value = text(fd, key);
  return value === "" ? null : value;
}

function int(fd: FormData, key: string, label: string) {
  const value = Number(required(fd, key, label));
  if (!Number.isInteger(value)) throw new InputError(`${label} must be a whole number.`);
  return value;
}

function decimal(fd: FormData, key: string, label: string) {
  const value = Number(required(fd, key, label));
  if (!Number.isFinite(value)) throw new InputError(`${label} must be a number.`);
  return value;
}

/** "2026-02-10T10:00" -> "2026-02-10 10:00:00" */
function dateTime(fd: FormData, key: string, label: string) {
  const value = required(fd, key, label).replace("T", " ");
  return value.length === 16 ? `${value}:00` : value;
}

async function run(work: () => Promise<string>): Promise<ActionResult> {
  try {
    const message = await work();
    revalidatePath("/", "layout");
    return { ok: true, message, tone: "success" };
  } catch (error) {
    if (error instanceof InputError) return { ok: false, message: error.message, tone: "error" };
    const fromTrigger = (error as { sqlState?: string }).sqlState === "45000";
    return { ok: false, message: dbErrorMessage(error), tone: fromTrigger ? "warning" : "error" };
  }
}

function affected(count: number, what: string) {
  if (count === 0) throw new InputError(`No ${what} matched. It may already have been removed.`);
}

/* --------------------------------------------------------------- students */

function studentValues(fd: FormData): Param[] {
  return [
    required(fd, "full_name", "Full name"),
    required(fd, "email", "Email"),
    required(fd, "department", "Department"),
    int(fd, "batch_year", "Batch year"),
    required(fd, "joined_on", "Joined on"),
    int(fd, "is_active", "Status"),
  ];
}

export async function createStudent(fd: FormData) {
  return run(async () => {
    await execute(
      `INSERT INTO students (full_name, email, department, batch_year, joined_on, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      studentValues(fd),
    );
    return "Student added.";
  });
}

export async function updateStudent(id: number, fd: FormData) {
  return run(async () => {
    await execute(
      `UPDATE students SET full_name = ?, email = ?, department = ?, batch_year = ?, joined_on = ?, is_active = ? WHERE student_id = ?`,
      [...studentValues(fd), id],
    );
    return "Student updated.";
  });
}

export async function deleteStudent(id: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM students WHERE student_id = ?`, [id]);
    affected(res.affectedRows, "student");
    return "Student deleted. Their memberships, registrations and feedback were removed by ON DELETE CASCADE.";
  });
}

/* ------------------------------------------------------------------ clubs */

function clubValues(fd: FormData): Param[] {
  return [
    required(fd, "club_name", "Club name"),
    required(fd, "category", "Category"),
    optional(fd, "description"),
    required(fd, "founded_on", "Founded on"),
  ];
}

export async function createClub(fd: FormData) {
  return run(async () => {
    await execute(`INSERT INTO clubs (club_name, category, description, founded_on) VALUES (?, ?, ?, ?)`, clubValues(fd));
    return "Club created.";
  });
}

export async function updateClub(id: number, fd: FormData) {
  return run(async () => {
    await execute(`UPDATE clubs SET club_name = ?, category = ?, description = ?, founded_on = ? WHERE club_id = ?`, [
      ...clubValues(fd),
      id,
    ]);
    return "Club updated.";
  });
}

export async function deleteClub(id: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM clubs WHERE club_id = ?`, [id]);
    affected(res.affectedRows, "club");
    return "Club deleted.";
  });
}

/* ------------------------------------------------------------ memberships */

export async function addMembership(fixed: { studentId?: number; clubId?: number }, fd: FormData) {
  return run(async () => {
    const studentId = fixed.studentId ?? int(fd, "student_id", "Student");
    const clubId = fixed.clubId ?? int(fd, "club_id", "Club");
    await execute(`INSERT INTO memberships (student_id, club_id, member_role, joined_on) VALUES (?, ?, ?, ?)`, [
      studentId,
      clubId,
      required(fd, "member_role", "Role"),
      required(fd, "joined_on", "Joined on"),
    ]);
    return "Membership added.";
  });
}

export async function updateMembershipRole(studentId: number, clubId: number, role: string) {
  return run(async () => {
    await execute(`UPDATE memberships SET member_role = ? WHERE student_id = ? AND club_id = ?`, [role, studentId, clubId]);
    return `Role changed to ${role}.`;
  });
}

export async function removeMembership(studentId: number, clubId: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM memberships WHERE student_id = ? AND club_id = ?`, [studentId, clubId]);
    affected(res.affectedRows, "membership");
    return "Membership removed.";
  });
}

/* ----------------------------------------------------------------- events */

function eventValues(fd: FormData): Param[] {
  const venue = optional(fd, "venue_id");
  return [
    int(fd, "club_id", "Club"),
    venue === null ? null : Number(venue),
    required(fd, "title", "Title"),
    dateTime(fd, "event_date", "Date"),
    decimal(fd, "fee", "Fee"),
    int(fd, "max_seats", "Seats"),
  ];
}

export async function createEvent(fd: FormData) {
  return run(async () => {
    await execute(
      `INSERT INTO events (club_id, venue_id, title, event_date, fee, max_seats, status) VALUES (?, ?, ?, ?, ?, ?, 'planned')`,
      eventValues(fd),
    );
    return "Event created as planned.";
  });
}

export async function updateEvent(id: number, fd: FormData) {
  return run(async () => {
    await execute(
      `UPDATE events SET club_id = ?, venue_id = ?, title = ?, event_date = ?, fee = ?, max_seats = ? WHERE event_id = ?`,
      [...eventValues(fd), id],
    );
    return "Event updated.";
  });
}

export async function deleteEvent(id: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM events WHERE event_id = ?`, [id]);
    affected(res.affectedRows, "event");
    return "Event deleted. Registrations, feedback and sponsorships went with it (ON DELETE CASCADE).";
  });
}

export async function setEventStatus(id: number, status: string) {
  return run(async () => {
    const res = await execute(`UPDATE events SET status = ? WHERE event_id = ? AND status <> ?`, [status, id, status]);
    if (res.affectedRows === 0) throw new InputError(`Event is already ${status}.`);
    return `Status set to ${status}. Trigger trg_events_status_log recorded the change.`;
  });
}

export async function cancelEvent(id: number) {
  return run(async () => {
    const cancelled = await withConnection(async (conn) => {
      const [sets] = await conn.query(`CALL sp_cancel_event(?)`, [id]);
      const first = (sets as unknown as { events_cancelled: number }[][])[0];
      return Number(first?.[0]?.events_cancelled ?? 0);
    });
    if (cancelled === 0) throw new InputError("Only planned events can be cancelled.");
    return "sp_cancel_event cancelled the event and the trigger logged it.";
  });
}

/* ---------------------------------------------------------- registrations */

export async function registerStudent(eventId: number, fd: FormData): Promise<ActionResult> {
  try {
    const studentId = int(fd, "student_id", "Student");
    const message = await withConnection(async (conn) => {
      await conn.query(`CALL sp_register_student(?, ?, @reg_message)`, [eventId, studentId]);
      const [rows] = await conn.query(`SELECT @reg_message AS message`);
      return String((rows as { message: string }[])[0]?.message ?? "");
    });
    const ok = message === "Registration successful";
    if (ok) revalidatePath("/", "layout");
    return { ok, message: `sp_register_student: ${message}`, tone: ok ? "success" : "warning" };
  } catch (error) {
    if (error instanceof InputError) return { ok: false, message: error.message, tone: "error" };
    const fromTrigger = (error as { sqlState?: string }).sqlState === "45000";
    return { ok: false, message: dbErrorMessage(error), tone: fromTrigger ? "warning" : "error" };
  }
}

export async function toggleAttendance(regId: number) {
  return run(async () => {
    const res = await execute(`UPDATE registrations SET attended = 1 - attended WHERE reg_id = ?`, [regId]);
    affected(res.affectedRows, "registration");
    return "Attendance updated.";
  });
}

export async function removeRegistration(regId: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM registrations WHERE reg_id = ?`, [regId]);
    affected(res.affectedRows, "registration");
    return "Registration removed.";
  });
}

/* --------------------------------------------------------------- feedback */

export async function addFeedback(eventId: number, fd: FormData) {
  return run(async () => {
    await execute(`INSERT INTO feedback (event_id, student_id, rating, comment, given_on) VALUES (?, ?, ?, ?, CURDATE())`, [
      eventId,
      int(fd, "student_id", "Student"),
      int(fd, "rating", "Rating"),
      optional(fd, "comment"),
    ]);
    return "Feedback saved.";
  });
}

export async function deleteFeedback(id: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM feedback WHERE feedback_id = ?`, [id]);
    affected(res.affectedRows, "feedback");
    return "Feedback deleted.";
  });
}

/* ------------------------------------------------------------ sponsorship */

export async function addSponsorship(eventId: number, fd: FormData) {
  return run(async () => {
    await execute(`INSERT INTO event_sponsors (event_id, sponsor_id, amount) VALUES (?, ?, ?)`, [
      eventId,
      int(fd, "sponsor_id", "Sponsor"),
      decimal(fd, "amount", "Amount"),
    ]);
    return "Sponsorship added.";
  });
}

export async function removeSponsorship(eventId: number, sponsorId: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM event_sponsors WHERE event_id = ? AND sponsor_id = ?`, [eventId, sponsorId]);
    affected(res.affectedRows, "sponsorship");
    return "Sponsorship removed.";
  });
}

/* ----------------------------------------------------------------- venues */

function venueValues(fd: FormData): Param[] {
  return [required(fd, "venue_name", "Venue name"), required(fd, "building", "Building"), int(fd, "capacity", "Capacity")];
}

export async function createVenue(fd: FormData) {
  return run(async () => {
    await execute(`INSERT INTO venues (venue_name, building, capacity) VALUES (?, ?, ?)`, venueValues(fd));
    return "Venue added.";
  });
}

export async function updateVenue(id: number, fd: FormData) {
  return run(async () => {
    await execute(`UPDATE venues SET venue_name = ?, building = ?, capacity = ? WHERE venue_id = ?`, [...venueValues(fd), id]);
    return "Venue updated.";
  });
}

export async function deleteVenue(id: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM venues WHERE venue_id = ?`, [id]);
    affected(res.affectedRows, "venue");
    return "Venue deleted. Its events now have no venue (ON DELETE SET NULL).";
  });
}

/* --------------------------------------------------------------- sponsors */

function sponsorValues(fd: FormData): Param[] {
  return [
    required(fd, "sponsor_name", "Sponsor name"),
    required(fd, "industry", "Industry"),
    required(fd, "contact_email", "Contact email"),
  ];
}

export async function createSponsor(fd: FormData) {
  return run(async () => {
    await execute(`INSERT INTO sponsors (sponsor_name, industry, contact_email) VALUES (?, ?, ?)`, sponsorValues(fd));
    return "Sponsor added.";
  });
}

export async function updateSponsor(id: number, fd: FormData) {
  return run(async () => {
    await execute(`UPDATE sponsors SET sponsor_name = ?, industry = ?, contact_email = ? WHERE sponsor_id = ?`, [
      ...sponsorValues(fd),
      id,
    ]);
    return "Sponsor updated.";
  });
}

export async function deleteSponsor(id: number) {
  return run(async () => {
    const res = await execute(`DELETE FROM sponsors WHERE sponsor_id = ?`, [id]);
    affected(res.affectedRows, "sponsor");
    return "Sponsor deleted along with its sponsorships (ON DELETE CASCADE).";
  });
}

/* -------------------------------------------------------------- SQL runner */

type Header = { affectedRows?: number; insertId?: number; info?: string };
type Field = { name: string };

const MAX_ROWS = 500;

function isHeader(value: unknown): value is Header {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "affectedRows" in value;
}

function isFieldList(value: unknown): value is Field[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    !Array.isArray(value[0]) &&
    "name" in value[0]
  );
}

function cell(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "bigint" || typeof value === "boolean") return String(value);
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8");
  return JSON.stringify(value);
}

function toStatus(header: Header): ResultSet {
  return { kind: "status", affectedRows: header.affectedRows ?? 0, insertId: header.insertId ?? 0, info: header.info ?? "" };
}

function toRows(rows: unknown[], fields: Field[] | undefined): ResultSet {
  const columns = (fields ?? []).map((f) => f.name);
  return {
    kind: "rows",
    columns,
    rows: rows.slice(0, MAX_ROWS).map((row) => (Array.isArray(row) ? row : Object.values(row as object)).map(cell)),
    rowCount: rows.length,
    truncated: rows.length > MAX_ROWS,
  };
}

/** mysql2 returns one result for a single statement and a list for several. */
function normalize(results: unknown, fields: unknown): ResultSet[] {
  if (isHeader(results)) return [toStatus(results)];
  if (!Array.isArray(results)) return [];
  if (isFieldList(fields)) return [toRows(results, fields)];
  const fieldSets = Array.isArray(fields) ? fields : [];
  return results.map((r, i) =>
    isHeader(r) ? toStatus(r) : toRows(Array.isArray(r) ? r : [], fieldSets[i] as Field[] | undefined),
  );
}

/**
 * Runs SQL from the Query Lab inside a transaction. Unless `commit` is true the
 * transaction is rolled back, so UPDATE/DELETE can be tried without losing data.
 * (DDL such as CREATE VIEW always commits in MySQL.)
 */
export async function runSql(sql: string, commit: boolean): Promise<RunResult> {
  const started = performance.now();
  const elapsed = () => Math.round((performance.now() - started) * 10) / 10;
  if (!sql.trim()) return { ok: false, error: "Write a query first.", elapsedMs: 0 };

  let conn: Connection | undefined;
  try {
    conn = await openMultiStatementConnection();
    await conn.query("START TRANSACTION");
    const [results, fields] = await conn.query({ sql, rowsAsArray: true });
    await conn.query(commit ? "COMMIT" : "ROLLBACK");
    const sets = normalize(results, fields);
    const mutated = sets.some((s) => s.kind === "status" && s.affectedRows > 0);
    if (commit && mutated) revalidatePath("/", "layout");
    return { ok: true, sets, elapsedMs: elapsed(), committed: commit, mutated };
  } catch (error) {
    await conn?.query("ROLLBACK").catch(() => undefined);
    return { ok: false, error: dbErrorMessage(error), elapsedMs: elapsed() };
  } finally {
    await conn?.end().catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ reset */

/** The server understands BEGIN ... END bodies on its own; DELIMITER is only for the mysql client. */
function forServer(sql: string) {
  return sql.replace(/^DELIMITER .*$/gm, "").replaceAll("$$", ";");
}

export async function resetDatabase(): Promise<ActionResult> {
  let conn: Connection | undefined;
  try {
    const dir = path.join(process.cwd(), "database");
    const files = ["01_schema.sql", "02_data.sql", "03_routines.sql"];
    const parts = await Promise.all(files.map((f) => readFile(path.join(dir, f), "utf8")));
    conn = await openMultiStatementConnection(false);
    await conn.query(parts.map(forServer).join("\n"));
    revalidatePath("/", "layout");
    return { ok: true, message: "Database rebuilt from 01_schema.sql, 02_data.sql and 03_routines.sql.", tone: "success" };
  } catch (error) {
    return { ok: false, message: dbErrorMessage(error), tone: "error" };
  } finally {
    await conn?.end().catch(() => undefined);
  }
}
