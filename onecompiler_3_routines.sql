-- ============================================================
-- File : 04_routines.sql (MySQL stored functions, procedures, cursor, triggers)
-- Run with the mysql client (DELIMITER is a client command).
-- ============================================================
DROP FUNCTION  IF EXISTS fn_fill_rate;
DROP FUNCTION  IF EXISTS fn_avg_rating;
DROP PROCEDURE IF EXISTS sp_register_student;
DROP PROCEDURE IF EXISTS sp_cancel_event;
DROP PROCEDURE IF EXISTS sp_club_revenue_report;
DROP TRIGGER   IF EXISTS trg_events_status_log;
DROP TRIGGER   IF EXISTS trg_reg_seat_check;
DROP TRIGGER   IF EXISTS trg_feedback_attended;
 
 
-- F1. Percentage of seats filled for an event.
CREATE FUNCTION fn_fill_rate(p_event_id INT) RETURNS DECIMAL(5,1)
READS SQL DATA
BEGIN
  DECLARE v_seats INT;
  DECLARE v_taken INT;
  SELECT max_seats INTO v_seats FROM events WHERE event_id = p_event_id;
  SELECT COUNT(*) INTO v_taken FROM registrations WHERE event_id = p_event_id;
  IF v_seats IS NULL OR v_seats = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND(100 * v_taken / v_seats, 1);
END;
 
-- F2. Average rating of an event, 0 when no feedback exists.
CREATE FUNCTION fn_avg_rating(p_event_id INT) RETURNS DECIMAL(3,2)
READS SQL DATA
BEGIN
  DECLARE v_avg DECIMAL(3,2);
  SELECT AVG(rating) INTO v_avg FROM feedback WHERE event_id = p_event_id;
  RETURN IFNULL(v_avg, 0.00);
END;
 
-- P1. Register a student for an event with validation (IF / ELSEIF).
CREATE PROCEDURE sp_register_student(IN p_event_id INT, IN p_student_id INT, OUT p_message VARCHAR(100))
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_seats  INT;
  DECLARE v_taken  INT;
  DECLARE v_dup    INT;
  SELECT status, max_seats INTO v_status, v_seats FROM events WHERE event_id = p_event_id;
  SELECT COUNT(*) INTO v_taken FROM registrations WHERE event_id = p_event_id;
  SELECT COUNT(*) INTO v_dup FROM registrations WHERE event_id = p_event_id AND student_id = p_student_id;
  IF v_status IS NULL THEN
    SET p_message = 'Event not found';
  ELSEIF v_status <> 'planned' THEN
    SET p_message = CONCAT('Event is ', v_status, ', registration closed');
  ELSEIF v_dup > 0 THEN
    SET p_message = 'Student already registered';
  ELSEIF v_taken >= v_seats THEN
    SET p_message = 'No seats left';
  ELSE
    INSERT INTO registrations (event_id, student_id, registered_on, attended)
    VALUES (p_event_id, p_student_id, NOW(), 0);
    SET p_message = 'Registration successful';
  END IF;
END;
 
-- P2. Cancel an event (the trigger below writes the log row).
CREATE PROCEDURE sp_cancel_event(IN p_event_id INT)
BEGIN
  UPDATE events SET status = 'cancelled' WHERE event_id = p_event_id AND status = 'planned';
  SELECT ROW_COUNT() AS events_cancelled;
END;
 
-- P3. CURSOR: revenue per club = fee x attended registrations, plus sponsorship.
CREATE PROCEDURE sp_club_revenue_report()
BEGIN
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_club_id INT;
  DECLARE v_club_name VARCHAR(60);
  DECLARE v_fees DECIMAL(12,2);
  DECLARE v_spons DECIMAL(12,2);
  DECLARE cur_clubs CURSOR FOR SELECT club_id, club_name FROM clubs ORDER BY club_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
 
  DROP TEMPORARY TABLE IF EXISTS tmp_club_revenue;
  CREATE TEMPORARY TABLE tmp_club_revenue (
    club_name VARCHAR(60), fee_income DECIMAL(12,2), sponsorship DECIMAL(12,2), total DECIMAL(12,2));
 
  OPEN cur_clubs;
  read_loop: LOOP
    FETCH cur_clubs INTO v_club_id, v_club_name;
    IF v_done = 1 THEN
      LEAVE read_loop;
    END IF;
    SELECT IFNULL(SUM(e.fee * r.attended), 0) INTO v_fees
      FROM events e JOIN registrations r ON e.event_id = r.event_id
      WHERE e.club_id = v_club_id AND e.status = 'completed';
    SELECT IFNULL(SUM(es.amount), 0) INTO v_spons
      FROM events e JOIN event_sponsors es ON e.event_id = es.event_id
      WHERE e.club_id = v_club_id;
    INSERT INTO tmp_club_revenue VALUES (v_club_name, v_fees, v_spons, v_fees + v_spons);
  END LOOP;
  CLOSE cur_clubs;
 
  SELECT * FROM tmp_club_revenue ORDER BY total DESC, club_name;
END;
 
-- T1. AFTER UPDATE: log every status change of an event.
CREATE TRIGGER trg_events_status_log AFTER UPDATE ON events
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO event_status_log (event_id, old_status, new_status, changed_on)
    VALUES (OLD.event_id, OLD.status, NEW.status, NOW());
  END IF;
END;
 
-- T2. BEFORE INSERT: block registrations once the event is full.
CREATE TRIGGER trg_reg_seat_check BEFORE INSERT ON registrations
FOR EACH ROW
BEGIN
  DECLARE v_seats INT;
  DECLARE v_taken INT;
  SELECT max_seats INTO v_seats FROM events WHERE event_id = NEW.event_id;
  SELECT COUNT(*) INTO v_taken FROM registrations WHERE event_id = NEW.event_id;
  IF v_taken >= v_seats THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event is full: no seats left';
  END IF;
END;
 
-- T3. BEFORE INSERT: only students who attended may leave feedback.
CREATE TRIGGER trg_feedback_attended BEFORE INSERT ON feedback
FOR EACH ROW
BEGIN
  DECLARE v_att INT;
  SELECT COUNT(*) INTO v_att FROM registrations
    WHERE event_id = NEW.event_id AND student_id = NEW.student_id AND attended = 1;
  IF v_att = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Feedback allowed only after attending the event';
  END IF;
END;
 
