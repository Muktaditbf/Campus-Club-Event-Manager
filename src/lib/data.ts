import { readFile } from "node:fs/promises";
import path from "node:path";
import { callProcedure, query, queryOne, type Param } from "./db";
import type {
  ClubRow,
  EventRow,
  FeedbackRow,
  Option,
  RegistrationRow,
  SavedQuery,
  SponsorRow,
  StatusLogRow,
  StudentRow,
  VenueRow,
} from "./types";

/* ------------------------------------------------------------------ events */

export const EVENT_SELECT = `SELECT e.event_id, e.club_id, c.club_name, c.category, e.venue_id, v.venue_name, v.building,
       e.title, e.event_date, e.fee, e.max_seats, e.status,
       (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.event_id) AS registrations,
       (SELECT IFNULL(SUM(r.attended), 0) FROM registrations r WHERE r.event_id = e.event_id) AS attended,
       fn_fill_rate(e.event_id) AS fill_rate,
       fn_avg_rating(e.event_id) AS avg_rating,
       (SELECT COUNT(*) FROM feedback f WHERE f.event_id = e.event_id) AS reviews,
       (SELECT IFNULL(SUM(es.amount), 0) FROM event_sponsors es WHERE es.event_id = e.event_id) AS sponsorship
  FROM events e
  JOIN clubs c ON c.club_id = e.club_id
  LEFT JOIN venues v ON v.venue_id = e.venue_id`;

export async function listEvents(filters: { status?: string; q?: string; clubId?: number; venueId?: number } = {}) {
  const where: string[] = [];
  const params: Param[] = [];
  if (filters.status) {
    where.push("e.status = ?");
    params.push(filters.status);
  }
  if (filters.q) {
    where.push("(e.title LIKE ? OR c.club_name LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.clubId) {
    where.push("e.club_id = ?");
    params.push(filters.clubId);
  }
  if (filters.venueId) {
    where.push("e.venue_id = ?");
    params.push(filters.venueId);
  }
  const sql = `${EVENT_SELECT}${where.length ? `\n WHERE ${where.join(" AND ")}` : ""}\n ORDER BY e.event_date DESC`;
  return query<EventRow>(sql, params);
}

export async function getEvent(id: number) {
  const event = await queryOne<EventRow>(`${EVENT_SELECT} WHERE e.event_id = ?`, [id]);
  if (!event) return null;
  const [registrations, feedback, sponsors, log] = await Promise.all([
    query<RegistrationRow>(
      `SELECT r.reg_id, r.event_id, r.student_id, s.full_name, s.department, r.registered_on, r.attended,
              (f.feedback_id IS NOT NULL) AS has_feedback
         FROM registrations r
         JOIN students s ON s.student_id = r.student_id
         LEFT JOIN feedback f ON f.event_id = r.event_id AND f.student_id = r.student_id
        WHERE r.event_id = ?
        ORDER BY r.registered_on`,
      [id],
    ),
    query<FeedbackRow>(
      `SELECT f.feedback_id, f.event_id, f.student_id, s.full_name, e.title, f.rating, f.comment, f.given_on
         FROM feedback f
         JOIN students s ON s.student_id = f.student_id
         JOIN events e ON e.event_id = f.event_id
        WHERE f.event_id = ?
        ORDER BY f.given_on DESC, f.feedback_id DESC`,
      [id],
    ),
    query<{ sponsor_id: number; sponsor_name: string; industry: string; amount: number }>(
      `SELECT es.sponsor_id, sp.sponsor_name, sp.industry, es.amount
         FROM event_sponsors es
         JOIN sponsors sp ON sp.sponsor_id = es.sponsor_id
        WHERE es.event_id = ?
        ORDER BY es.amount DESC`,
      [id],
    ),
    query<StatusLogRow>(
      `SELECT l.log_id, l.event_id, NULL AS title, l.old_status, l.new_status, l.changed_on
         FROM event_status_log l
        WHERE l.event_id = ?
        ORDER BY l.changed_on DESC, l.log_id DESC`,
      [id],
    ),
  ]);
  return { event, registrations, feedback, sponsors, log };
}

/* ---------------------------------------------------------------- students */

export async function listStudents(filters: { q?: string; department?: string; active?: string } = {}) {
  const where: string[] = [];
  const params: Param[] = [];
  if (filters.q) {
    where.push("(s.full_name LIKE ? OR s.email LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.department) {
    where.push("s.department = ?");
    params.push(filters.department);
  }
  if (filters.active === "active" || filters.active === "inactive") {
    where.push("s.is_active = ?");
    params.push(filters.active === "active" ? 1 : 0);
  }
  return query<StudentRow>(
    `SELECT s.*,
            (SELECT COUNT(*) FROM memberships m WHERE m.student_id = s.student_id) AS clubs,
            (SELECT COUNT(*) FROM registrations r WHERE r.student_id = s.student_id) AS registrations,
            (SELECT IFNULL(SUM(r.attended), 0) FROM registrations r WHERE r.student_id = s.student_id) AS attended
       FROM students s
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY s.full_name`,
    params,
  );
}

export async function getStudent(id: number) {
  const student = await queryOne<StudentRow>(
    `SELECT s.*, 0 AS clubs, 0 AS registrations, 0 AS attended FROM students s WHERE s.student_id = ?`,
    [id],
  );
  if (!student) return null;
  const [memberships, registrations, feedback] = await Promise.all([
    query<{ club_id: number; club_name: string; category: string; member_role: string; joined_on: string }>(
      `SELECT m.club_id, c.club_name, c.category, m.member_role, m.joined_on
         FROM memberships m JOIN clubs c ON c.club_id = m.club_id
        WHERE m.student_id = ?
        ORDER BY FIELD(m.member_role, 'president', 'executive', 'member'), c.club_name`,
      [id],
    ),
    query<{ reg_id: number; event_id: number; title: string; club_name: string; event_date: string; status: string; fee: number; attended: number; registered_on: string }>(
      `SELECT r.reg_id, e.event_id, e.title, c.club_name, e.event_date, e.status, e.fee, r.attended, r.registered_on
         FROM registrations r
         JOIN events e ON e.event_id = r.event_id
         JOIN clubs c ON c.club_id = e.club_id
        WHERE r.student_id = ?
        ORDER BY e.event_date DESC`,
      [id],
    ),
    query<FeedbackRow>(
      `SELECT f.feedback_id, f.event_id, f.student_id, s.full_name, e.title, f.rating, f.comment, f.given_on
         FROM feedback f
         JOIN students s ON s.student_id = f.student_id
         JOIN events e ON e.event_id = f.event_id
        WHERE f.student_id = ?
        ORDER BY f.given_on DESC`,
      [id],
    ),
  ]);
  return { student, memberships, registrations, feedback };
}

export async function listDepartments() {
  const rows = await query<{ department: string }>(`SELECT DISTINCT department FROM students ORDER BY department`);
  return rows.map((r) => r.department);
}

/* ------------------------------------------------------------------- clubs */

const CLUB_SELECT = `SELECT c.*,
       (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.club_id) AS members,
       (SELECT COUNT(*) FROM events e WHERE e.club_id = c.club_id) AS events,
       (SELECT s.full_name FROM memberships m JOIN students s ON s.student_id = m.student_id
         WHERE m.club_id = c.club_id AND m.member_role = 'president' LIMIT 1) AS president
  FROM clubs c`;

export async function listClubs(filters: { category?: string } = {}) {
  if (filters.category) {
    return query<ClubRow>(`${CLUB_SELECT} WHERE c.category = ? ORDER BY c.club_name`, [filters.category]);
  }
  return query<ClubRow>(`${CLUB_SELECT} ORDER BY c.club_name`);
}

export async function getClub(id: number) {
  const club = await queryOne<ClubRow>(`${CLUB_SELECT} WHERE c.club_id = ?`, [id]);
  if (!club) return null;
  const [members, events, revenue] = await Promise.all([
    query<{ student_id: number; full_name: string; department: string; batch_year: number; member_role: string; joined_on: string }>(
      `SELECT s.student_id, s.full_name, s.department, s.batch_year, m.member_role, m.joined_on
         FROM memberships m JOIN students s ON s.student_id = m.student_id
        WHERE m.club_id = ?
        ORDER BY FIELD(m.member_role, 'president', 'executive', 'member'), s.full_name`,
      [id],
    ),
    listEvents({ clubId: id }),
    queryOne<{ fee_income: number; sponsorship: number }>(
      `SELECT (SELECT IFNULL(SUM(e.fee * r.attended), 0)
                 FROM events e JOIN registrations r ON e.event_id = r.event_id
                WHERE e.club_id = ? AND e.status = 'completed') AS fee_income,
              (SELECT IFNULL(SUM(es.amount), 0)
                 FROM events e JOIN event_sponsors es ON e.event_id = es.event_id
                WHERE e.club_id = ?) AS sponsorship`,
      [id, id],
    ),
  ]);
  return { club, members, events, revenue: revenue ?? { fee_income: 0, sponsorship: 0 } };
}

/* ------------------------------------------------------- venues & sponsors */

export async function listVenues() {
  return query<VenueRow>(
    `SELECT v.venue_id, v.venue_name, v.building, v.capacity,
            COUNT(e.event_id) AS events,
            IFNULL(SUM(e.status = 'planned'), 0) AS upcoming,
            MAX(e.event_date) AS last_event
       FROM venues v
       LEFT JOIN events e ON e.venue_id = v.venue_id
      GROUP BY v.venue_id, v.venue_name, v.building, v.capacity
      ORDER BY events DESC, v.venue_name`,
  );
}

export async function listSponsors() {
  return query<SponsorRow>(
    `SELECT sp.sponsor_id, sp.sponsor_name, sp.industry, sp.contact_email,
            COUNT(es.event_id) AS events,
            IFNULL(SUM(es.amount), 0) AS total
       FROM sponsors sp
       LEFT JOIN event_sponsors es ON es.sponsor_id = sp.sponsor_id
      GROUP BY sp.sponsor_id, sp.sponsor_name, sp.industry, sp.contact_email
      ORDER BY total DESC, sp.sponsor_name`,
  );
}

/* ------------------------------------------------------- options for forms */

export async function getOptions() {
  const [clubs, venues, students, sponsors] = await Promise.all([
    query<{ club_id: number; club_name: string }>(`SELECT club_id, club_name FROM clubs ORDER BY club_name`),
    query<{ venue_id: number; venue_name: string; capacity: number }>(
      `SELECT venue_id, venue_name, capacity FROM venues ORDER BY venue_name`,
    ),
    query<{ student_id: number; full_name: string; department: string; is_active: number }>(
      `SELECT student_id, full_name, department, is_active FROM students ORDER BY full_name`,
    ),
    query<{ sponsor_id: number; sponsor_name: string }>(`SELECT sponsor_id, sponsor_name FROM sponsors ORDER BY sponsor_name`),
  ]);
  return {
    clubs: clubs.map((c): Option => ({ value: c.club_id, label: c.club_name })),
    venues: venues.map((v): Option => ({ value: v.venue_id, label: `${v.venue_name} (${v.capacity} seats)` })),
    students: students.map((s): Option => ({
      value: s.student_id,
      label: `${s.full_name} · ${s.department}${s.is_active ? "" : " (inactive)"}`,
    })),
    sponsors: sponsors.map((s): Option => ({ value: s.sponsor_id, label: s.sponsor_name })),
  };
}

/* --------------------------------------------------------------- dashboard */

export async function getDashboard() {
  const [stats, monthly, categories, revenue, upcoming, topRated, activity] = await Promise.all([
    queryOne<{
      active_students: number;
      total_students: number;
      clubs: number;
      events: number;
      planned: number;
      completed: number;
      cancelled: number;
      registrations: number;
      attended: number;
      sponsorship: number;
      avg_rating: number;
      feedback_count: number;
    }>(
      `SELECT (SELECT COUNT(*) FROM students WHERE is_active = 1) AS active_students,
              (SELECT COUNT(*) FROM students) AS total_students,
              (SELECT COUNT(*) FROM clubs) AS clubs,
              (SELECT COUNT(*) FROM events) AS events,
              (SELECT COUNT(*) FROM events WHERE status = 'planned') AS planned,
              (SELECT COUNT(*) FROM events WHERE status = 'completed') AS completed,
              (SELECT COUNT(*) FROM events WHERE status = 'cancelled') AS cancelled,
              (SELECT COUNT(*) FROM registrations) AS registrations,
              (SELECT IFNULL(SUM(attended), 0) FROM registrations) AS attended,
              (SELECT IFNULL(SUM(amount), 0) FROM event_sponsors) AS sponsorship,
              (SELECT IFNULL(ROUND(AVG(rating), 2), 0) FROM feedback) AS avg_rating,
              (SELECT COUNT(*) FROM feedback) AS feedback_count`,
    ),
    query<{ month: string; registrations: number; attended: number }>(
      `SELECT DATE_FORMAT(e.event_date, '%Y-%m') AS month,
              COUNT(r.reg_id) AS registrations,
              IFNULL(SUM(r.attended), 0) AS attended
         FROM events e
         LEFT JOIN registrations r ON r.event_id = e.event_id
        GROUP BY month
        ORDER BY month`,
    ),
    query<{ category: string; registrations: number }>(
      `SELECT c.category, COUNT(r.reg_id) AS registrations
         FROM clubs c
         JOIN events e ON e.club_id = c.club_id
         LEFT JOIN registrations r ON r.event_id = e.event_id
        GROUP BY c.category
        ORDER BY registrations DESC`,
    ),
    callProcedure<{ club_name: string; fee_income: number; sponsorship: number; total: number }>(
      `CALL sp_club_revenue_report()`,
    ),
    query<EventRow>(`${EVENT_SELECT} WHERE e.status = 'planned' ORDER BY e.event_date LIMIT 5`),
    query<EventRow>(
      `SELECT * FROM (${EVENT_SELECT}) AS t WHERE t.reviews > 0 ORDER BY t.avg_rating DESC, t.reviews DESC LIMIT 5`,
    ),
    query<StatusLogRow>(
      `SELECT l.log_id, l.event_id, e.title, l.old_status, l.new_status, l.changed_on
         FROM event_status_log l
         LEFT JOIN events e ON e.event_id = l.event_id
        ORDER BY l.changed_on DESC, l.log_id DESC
        LIMIT 6`,
    ),
  ]);
  return { stats: stats!, monthly, categories, revenue, upcoming, topRated, activity };
}

/* ------------------------------------------------------------------ schema */

export async function getSchema() {
  const [tables, columns, foreignKeys, checks, routines, params, triggers] = await Promise.all([
    query<{ table_name: string; table_type: string }>(
      `SELECT TABLE_NAME AS table_name, TABLE_TYPE AS table_type
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_TYPE, CREATE_TIME, TABLE_NAME`,
    ),
    query<{ table_name: string; column_name: string; column_type: string; is_nullable: string; column_key: string; column_default: string | null; extra: string }>(
      `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, COLUMN_TYPE AS column_type,
              IS_NULLABLE AS is_nullable, COLUMN_KEY AS column_key, COLUMN_DEFAULT AS column_default, EXTRA AS extra
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    ),
    query<{ table_name: string; column_name: string; ref_table: string; ref_column: string; constraint_name: string; update_rule: string; delete_rule: string }>(
      `SELECT k.TABLE_NAME AS table_name, k.COLUMN_NAME AS column_name,
              k.REFERENCED_TABLE_NAME AS ref_table, k.REFERENCED_COLUMN_NAME AS ref_column,
              k.CONSTRAINT_NAME AS constraint_name, rc.UPDATE_RULE AS update_rule, rc.DELETE_RULE AS delete_rule
         FROM information_schema.KEY_COLUMN_USAGE k
         JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
           ON rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
        WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY k.TABLE_NAME, k.ORDINAL_POSITION`,
    ),
    query<{ table_name: string; constraint_name: string; check_clause: string }>(
      `SELECT tc.TABLE_NAME AS table_name, cc.CONSTRAINT_NAME AS constraint_name, cc.CHECK_CLAUSE AS check_clause
         FROM information_schema.CHECK_CONSTRAINTS cc
         JOIN information_schema.TABLE_CONSTRAINTS tc
           ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
        WHERE cc.CONSTRAINT_SCHEMA = DATABASE() AND tc.CONSTRAINT_TYPE = 'CHECK'
        ORDER BY tc.TABLE_NAME, cc.CONSTRAINT_NAME`,
    ),
    query<{ name: string; type: string; returns: string | null; definition: string | null }>(
      `SELECT ROUTINE_NAME AS name, ROUTINE_TYPE AS type, DTD_IDENTIFIER AS \`returns\`, ROUTINE_DEFINITION AS definition
         FROM information_schema.ROUTINES
        WHERE ROUTINE_SCHEMA = DATABASE()
        ORDER BY ROUTINE_TYPE, ROUTINE_NAME`,
    ),
    query<{ routine: string; mode: string | null; name: string; type: string }>(
      `SELECT SPECIFIC_NAME AS routine, PARAMETER_MODE AS mode, PARAMETER_NAME AS name, DTD_IDENTIFIER AS type
         FROM information_schema.PARAMETERS
        WHERE SPECIFIC_SCHEMA = DATABASE() AND PARAMETER_NAME IS NOT NULL
        ORDER BY SPECIFIC_NAME, ORDINAL_POSITION`,
    ),
    query<{ name: string; timing: string; event: string; table_name: string; body: string }>(
      `SELECT TRIGGER_NAME AS name, ACTION_TIMING AS timing, EVENT_MANIPULATION AS event,
              EVENT_OBJECT_TABLE AS table_name, ACTION_STATEMENT AS body
         FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE()
        ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME`,
    ),
  ]);

  // Exact row counts (TABLE_ROWS in information_schema is only an estimate for InnoDB).
  const counts = await Promise.all(
    tables
      .filter((t) => t.table_type === "BASE TABLE")
      .map(async (t) => {
        const row = await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM \`${t.table_name.replace(/`/g, "")}\``);
        return [t.table_name, row?.n ?? 0] as const;
      }),
  );

  return {
    tables: tables.map((t) => ({
      name: t.table_name,
      type: t.table_type,
      rows: Object.fromEntries(counts)[t.table_name] ?? null,
      columns: columns.filter((c) => c.table_name === t.table_name),
      foreignKeys: foreignKeys.filter((f) => f.table_name === t.table_name),
      checks: checks.filter((c) => c.table_name === t.table_name),
      referencedBy: foreignKeys.filter((f) => f.ref_table === t.table_name),
    })),
    routines: routines.map((r) => ({ ...r, params: params.filter((p) => p.routine === r.name) })),
    triggers,
  };
}

/* ----------------------------------------------------------- saved queries */

const SECTIONS: [number, string][] = [
  [10, "Single table"],
  [19, "Joins"],
  [27, "Subqueries"],
  [Infinity, "Set, view & DML"],
];

/** Reads database/queries.sql and splits it at the "-- Qn." headers. */
export async function loadSavedQueries(): Promise<SavedQuery[]> {
  const text = await readFile(path.join(process.cwd(), "database", "queries.sql"), "utf8");
  return text
    .split(/^-- (?=Q\d+\.)/m)
    .slice(1)
    .map((block) => {
      const newline = block.indexOf("\n");
      const header = block.slice(0, newline).trim();
      const match = header.match(/^Q(\d+)\.\s*(.*)$/);
      const number = Number(match?.[1] ?? 0);
      const sql = block.slice(newline + 1).trim();
      return {
        number,
        title: (match?.[2] ?? header).replace(/\.$/, ""),
        sql,
        section: SECTIONS.find(([max]) => number <= max)![1],
        mutates: /^\s*(UPDATE|DELETE|INSERT)\b/im.test(sql),
      };
    });
}
