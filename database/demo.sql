-- ============================================================
-- File : demo.sql (quick checks for the routines in 03_routines.sql)
-- Changes data: registers student 5 for event 14.
-- ============================================================
USE campus_events_db;

SELECT event_id, title, fn_fill_rate(event_id) AS fill_pct, fn_avg_rating(event_id) AS avg_rating
  FROM events
  WHERE event_id IN (1, 2, 6, 14);

CALL sp_register_student(14, 5, @m1);
SELECT @m1 AS result;

CALL sp_register_student(14, 15, @m2);
SELECT @m2 AS inactive_student_result;

CALL sp_club_revenue_report();
