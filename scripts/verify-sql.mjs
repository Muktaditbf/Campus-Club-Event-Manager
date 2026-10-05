// Checks the SQL files against a real MySQL server (used by CI).
//  1. onecompiler_all_in_one.sql runs as one multi-statement script (no DELIMITER).
//  2. The split files load the way the app's "Reset data" button loads them.
//  3. Row counts, routines and triggers are what the project expects.
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const cfg = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "campus",
  multipleStatements: true,
};
const read = (f) => readFile(new URL(`../database/${f}`, import.meta.url), "utf8");
const forServer = (sql) => sql.replace(/^DELIMITER .*$/gm, "").replaceAll("$$", ";");
let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "✔" : "✘"} ${msg}`);
  if (!ok) failures++;
};

// 1. OneCompiler file
{
  const admin = await mysql.createConnection(cfg);
  await admin.query("DROP DATABASE IF EXISTS onecompiler_check; CREATE DATABASE onecompiler_check;");
  const conn = await mysql.createConnection({ ...cfg, database: "onecompiler_check" });
  const [results] = await conn.query(await read("onecompiler_all_in_one.sql"));
  check(Array.isArray(results) && results.length > 50, `onecompiler_all_in_one.sql ran (${results.length} statements)`);
  await conn.end();
  await admin.query("DROP DATABASE onecompiler_check");
  await admin.end();
}

// 2. Reset path (same transformation as the app)
{
  const conn = await mysql.createConnection(cfg);
  const sql = (await Promise.all(["01_schema.sql", "02_data.sql", "03_routines.sql"].map(read))).map(forServer).join("\n");
  await conn.query(sql);
  check(true, "01_schema + 02_data + 03_routines reload through mysql2");
  await conn.end();
}

// 3. Expectations
{
  const conn = await mysql.createConnection({ ...cfg, database: "campus_events_db" });
  const expected = {
    students: 15, clubs: 10, venues: 10, events: 15, memberships: 26,
    registrations: 57, feedback: 20, sponsors: 10, event_sponsors: 12, event_status_log: 0,
  };
  for (const [table, n] of Object.entries(expected)) {
    const [[row]] = await conn.query(`SELECT COUNT(*) AS n FROM ${table}`);
    check(row.n === n, `${table}: ${row.n} rows (expected ${n})`);
  }
  const [[r]] = await conn.query("SELECT COUNT(*) AS n FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = 'campus_events_db'");
  check(r.n === 5, `${r.n} stored routines (expected 5)`);
  const [[t]] = await conn.query("SELECT COUNT(*) AS n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'campus_events_db'");
  check(t.n === 3, `${t.n} triggers (expected 3)`);

  await conn.query("START TRANSACTION");
  try {
    await conn.query("INSERT INTO feedback (event_id, student_id, rating, given_on) VALUES (1, 3, 4, CURDATE())");
    check(false, "trg_feedback_attended should reject a student who did not attend");
  } catch (e) {
    check(e.sqlState === "45000", `trg_feedback_attended rejected it: "${e.sqlMessage}"`);
  }
  await conn.query("CALL sp_register_student(14, 15, @m)");
  const [[m]] = await conn.query("SELECT @m AS m");
  check(m.m === "Student is inactive", `sp_register_student(14, 15) -> "${m.m}"`);
  await conn.query("UPDATE events SET status = 'cancelled' WHERE event_id = 15");
  const [[log]] = await conn.query("SELECT COUNT(*) AS n FROM event_status_log");
  check(log.n === 1, "trg_events_status_log wrote a row");
  await conn.query("ROLLBACK");
  await conn.end();
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll SQL checks passed");
