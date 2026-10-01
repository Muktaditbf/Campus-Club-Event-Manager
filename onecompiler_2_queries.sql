-- ============================================================
-- File : 03_queries.sql (31 queries on campus_events_db)
-- Q1-Q10 single table | Q11-Q19 joins | Q20-Q27 subqueries | Q28-Q31 set, view, DML
-- ============================================================
 
-- Q1. Events that are still planned, earliest first.
SELECT event_id, title, event_date, fee
  FROM events
  WHERE status = 'planned'
  ORDER BY event_date;
 
-- Q2. Active CSE students.
SELECT student_id, full_name, batch_year
  FROM students
  WHERE department = 'CSE' AND is_active = 1
  ORDER BY batch_year, full_name;
 
-- Q3. Events held between March and April 2026.
SELECT event_id, title, event_date
  FROM events
  WHERE event_date BETWEEN '2026-03-01 00:00:00' AND '2026-04-30 23:59:59'
  ORDER BY event_date;
 
-- Q4. Society and Circle clubs in the tech, academic or cultural categories.
SELECT club_id, club_name, category
  FROM clubs
  WHERE (club_name LIKE '%Society' OR club_name LIKE '%Circle') AND category IN ('tech','academic','cultural')
  ORDER BY club_name;
 
-- Q5. Fee statistics for completed events.
SELECT COUNT(*) AS total_events, SUM(fee) AS total_fee, ROUND(AVG(fee),2) AS average_fee, MAX(fee) AS highest, MIN(fee) AS lowest
  FROM events
  WHERE status = 'completed';
 
-- Q6. Number of events per status.
SELECT status, COUNT(*) AS event_count
  FROM events
  GROUP BY status
  ORDER BY event_count DESC;
 
-- Q7. Clubs that organised more than one event.
SELECT club_id, COUNT(*) AS events_held, SUM(max_seats) AS total_seats
  FROM events
  GROUP BY club_id
  HAVING COUNT(*) > 1
  ORDER BY events_held DESC;
 
-- Q8. Price band for every event (CASE).
SELECT title, fee, CASE WHEN fee = 0 THEN 'Free' WHEN fee < 200 THEN 'Low' ELSE 'Premium' END AS price_band
  FROM events
  ORDER BY fee DESC, title;
 
-- Q9. Events per month with string and date functions.
SELECT MONTHNAME(event_date) AS month_name, MONTH(event_date) AS mon, COUNT(*) AS events_held, GROUP_CONCAT(UPPER(LEFT(title, 10)) SEPARATOR ' | ') AS starts_with
  FROM events
  GROUP BY MONTH(event_date), MONTHNAME(event_date)
  ORDER BY mon;
 
-- Q10. Three most expensive events (ties broken by title).
SELECT title, fee
  FROM events
  ORDER BY fee DESC, title
  LIMIT 3;
 
-- Q11. Event with its club and venue (three-table inner join).
SELECT e.event_id, e.title, c.club_name, v.venue_name
  FROM events e
  INNER JOIN clubs c ON e.club_id = c.club_id
  INNER JOIN venues v ON e.venue_id = v.venue_id
  WHERE e.status = 'completed'
  ORDER BY e.event_id;
 
-- Q12. Registrations per event, including events nobody registered for (LEFT JOIN).
SELECT e.event_id, e.title, COUNT(r.reg_id) AS registrations
  FROM events e
  LEFT JOIN registrations r ON e.event_id = r.event_id
  GROUP BY e.event_id, e.title
  ORDER BY registrations DESC, e.event_id;
 
-- Q13. Clubs that have never organised an event.
SELECT c.club_id, c.club_name
  FROM clubs c
  LEFT JOIN events e ON c.club_id = e.club_id
  WHERE e.event_id IS NULL;
 
-- Q14. Venues that have never been booked.
SELECT v.venue_id, v.venue_name, v.capacity
  FROM venues v
  LEFT JOIN events e ON v.venue_id = e.venue_id
  WHERE e.event_id IS NULL
  ORDER BY v.venue_id;
 
-- Q15. Each student's clubs and roles (join through the bridge table).
SELECT s.full_name, c.club_name, m.member_role
  FROM memberships m
  INNER JOIN students s ON m.student_id = s.student_id
  INNER JOIN clubs c ON m.club_id = c.club_id
  WHERE m.member_role <> 'member'
  ORDER BY c.club_name, m.member_role DESC;
 
-- Q16. Total sponsorship raised per event.
SELECT e.title, COUNT(es.sponsor_id) AS sponsors, SUM(es.amount) AS total_amount
  FROM events e
  INNER JOIN event_sponsors es ON e.event_id = es.event_id
  GROUP BY e.event_id, e.title
  ORDER BY total_amount DESC;
 
-- Q17. Pairs of BBA students (self join).
SELECT a.full_name AS student_one, b.full_name AS student_two
  FROM students a
  INNER JOIN students b ON a.department = b.department AND a.student_id < b.student_id
  WHERE a.department = 'BBA'
  ORDER BY a.student_id, b.student_id;
 
-- Q18. Every sponsor with what they paid, unused sponsors kept (RIGHT JOIN).
SELECT sp.sponsor_name, es.event_id, es.amount
  FROM event_sponsors es
  RIGHT JOIN sponsors sp ON es.sponsor_id = sp.sponsor_id
  ORDER BY sp.sponsor_id, es.event_id;
 
-- Q19. Attendance rate of each completed event.
SELECT e.title, COUNT(*) AS registered, SUM(r.attended) AS attended, ROUND(100 * SUM(r.attended) / COUNT(*), 1) AS attendance_pct
  FROM events e
  JOIN registrations r ON e.event_id = r.event_id
  WHERE e.status = 'completed'
  GROUP BY e.event_id, e.title
  ORDER BY attendance_pct DESC, e.title;
 
-- Q20. Events that cost more than the average event (scalar subquery).
SELECT event_id, title, fee
  FROM events
  WHERE fee > (SELECT AVG(fee) FROM events)
  ORDER BY fee DESC;
 
-- Q21. Students who registered for an event costing 250 or more (nested IN).
SELECT student_id, full_name
  FROM students
  WHERE student_id IN (SELECT student_id FROM registrations WHERE event_id IN (SELECT event_id FROM events WHERE fee >= 250))
  ORDER BY student_id;
 
-- Q22. Students who never gave feedback (NOT IN).
SELECT student_id, full_name, department
  FROM students
  WHERE student_id NOT IN (SELECT student_id FROM feedback)
  ORDER BY student_id;
 
-- Q23. Clubs with at least one completed event (EXISTS).
SELECT c.club_id, c.club_name
  FROM clubs c
  WHERE EXISTS (SELECT 1 FROM events e WHERE e.club_id = c.club_id AND e.status = 'completed')
  ORDER BY c.club_id;
 
-- Q24. Events without any sponsor (NOT EXISTS).
SELECT e.event_id, e.title, e.status
  FROM events e
  WHERE NOT EXISTS (SELECT 1 FROM event_sponsors es WHERE es.event_id = e.event_id)
  ORDER BY e.event_id;
 
-- Q25. Average rating of each event (correlated scalar subquery).
SELECT e.event_id, e.title, (SELECT ROUND(AVG(f.rating),2) FROM feedback f WHERE f.event_id = e.event_id) AS avg_rating
  FROM events e
  WHERE e.status = 'completed'
  ORDER BY avg_rating DESC, e.event_id;
 
-- Q26. The most expensive event, found with ALL.
SELECT event_id, title, fee, status
  FROM events
  WHERE fee >= ALL (SELECT fee FROM events);
 
-- Q27. Clubs ranked by registrations using a derived table.
SELECT d.club_name, d.total_registrations
  FROM (SELECT c.club_name, COUNT(r.reg_id) AS total_registrations
          FROM clubs c
          JOIN events e ON c.club_id = e.club_id
          JOIN registrations r ON e.event_id = r.event_id
         GROUP BY c.club_id, c.club_name) AS d
  WHERE d.total_registrations >= 6
  ORDER BY d.total_registrations DESC;
 
-- Q28. Club presidents and sponsors in one list (UNION).
SELECT s.full_name AS name, 'Club president' AS type
  FROM students s
  JOIN memberships m ON s.student_id = m.student_id
  WHERE m.member_role = 'president'
UNION SELECT sponsor_name, 'Sponsor'
  FROM sponsors
  WHERE industry = 'IT'
  ORDER BY type, name;
 
-- Q29. A view that hides the join work.
CREATE OR REPLACE VIEW v_event_summary AS
SELECT e.event_id, e.title, c.club_name, v.venue_name, e.fee, e.status
  FROM events e
  JOIN clubs c ON e.club_id = c.club_id
  LEFT JOIN venues v ON e.venue_id = v.venue_id;
SELECT *
  FROM v_event_summary
  WHERE fee >= 200
  ORDER BY fee DESC, event_id;
 
-- Q30. Raise the fee 10% for planned events of tech clubs (UPDATE with subquery).
UPDATE events
  SET fee = fee * 1.10
  WHERE status = 'planned' AND club_id IN (SELECT club_id FROM clubs WHERE category = 'tech');
SELECT event_id, title, fee
  FROM events
  WHERE event_id = 14;
 
-- Q31. Remove sponsors who sponsored nothing (DELETE with subquery).
DELETE
  FROM sponsors
  WHERE sponsor_id NOT IN (SELECT sponsor_id FROM event_sponsors);
SELECT COUNT(*) AS remaining_sponsors
  FROM sponsors;
