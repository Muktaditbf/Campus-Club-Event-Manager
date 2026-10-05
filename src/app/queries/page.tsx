import { loadSavedQueries } from "@/lib/data";
import type { SavedQuery } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { QueryLab } from "@/components/query-lab";

export const dynamic = "force-dynamic";
export const metadata = { title: "Query Lab" };

// Extra examples for the stored routines and triggers in 03_routines.sql.
const ROUTINE_DEMOS: Omit<SavedQuery, "number">[] = [
  {
    title: "Club revenue report (cursor procedure)",
    section: "Routines & triggers",
    mutates: false,
    sql: "CALL sp_club_revenue_report();",
  },
  {
    title: "Fill rate and rating for every event (functions)",
    section: "Routines & triggers",
    mutates: false,
    sql: `SELECT event_id, title, max_seats,
       fn_fill_rate(event_id)  AS fill_pct,
       fn_avg_rating(event_id) AS avg_rating
  FROM events
  ORDER BY fill_pct DESC;`,
  },
  {
    title: "Register a student with the procedure",
    section: "Routines & triggers",
    mutates: true,
    sql: `-- Try other ids: event 1 is completed, student 15 is inactive.
CALL sp_register_student(14, 5, @msg);
SELECT @msg AS result;`,
  },
  {
    title: "Trigger: block registration when the event is full",
    section: "Routines & triggers",
    mutates: true,
    sql: `-- Event 14 has 3 registrations. Shrink it to 3 seats, then try to add one more.
UPDATE events SET max_seats = 3 WHERE event_id = 14;
INSERT INTO registrations (event_id, student_id, registered_on) VALUES (14, 1, NOW());`,
  },
  {
    title: "Trigger: feedback only after attending",
    section: "Routines & triggers",
    mutates: true,
    sql: `-- Student 3 registered for event 1 but did not attend.
INSERT INTO feedback (event_id, student_id, rating, given_on) VALUES (1, 3, 4, CURDATE());`,
  },
  {
    title: "Trigger: status changes are logged",
    section: "Routines & triggers",
    mutates: true,
    sql: `UPDATE events SET status = 'cancelled' WHERE event_id = 15;
SELECT * FROM event_status_log ORDER BY log_id DESC LIMIT 5;`,
  },
  {
    title: "List all tables and views",
    section: "Routines & triggers",
    mutates: false,
    sql: "SHOW FULL TABLES;",
  },
];

export default async function QueriesPage() {
  const saved = await loadSavedQueries();
  const demos = ROUTINE_DEMOS.map((d, i) => ({ ...d, number: 100 + i }));

  return (
    <>
      <PageHeader
        title="Query Lab"
        description="Run the 31 project queries from database/queries.sql, try the stored routines, or write your own SQL. Changes are rolled back unless you choose to keep them."
      />
      <QueryLab queries={[...saved, ...demos]} />
    </>
  );
}
