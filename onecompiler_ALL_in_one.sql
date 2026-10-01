-- ============================================================
-- CSE 364 - Database Systems Project
-- Topic : Campus Club & Event Management System
-- File  : 01_schema.sql (database + table definitions)
-- DBMS  : MySQL 8.0
-- ============================================================
 
-- 1. students
CREATE TABLE students (
  student_id  INT NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(80)  NOT NULL,
  email       VARCHAR(120) NOT NULL,
  department  VARCHAR(40)  NOT NULL,
  batch_year  INT          NOT NULL,
  joined_on   DATE         NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (student_id),
  UNIQUE KEY uq_student_email (email)
) ENGINE=InnoDB;
 
-- 2. clubs
CREATE TABLE clubs (
  club_id     INT NOT NULL AUTO_INCREMENT,
  club_name   VARCHAR(60)  NOT NULL,
  category    ENUM('academic','cultural','sports','tech','social') NOT NULL,
  description VARCHAR(200) NULL,
  founded_on  DATE NOT NULL,
  PRIMARY KEY (club_id),
  UNIQUE KEY uq_club_name (club_name)
) ENGINE=InnoDB;
 
-- 3. memberships (M:N students <-> clubs, carries a role)
CREATE TABLE memberships (
  student_id  INT NOT NULL,
  club_id     INT NOT NULL,
  member_role ENUM('member','executive','president') NOT NULL DEFAULT 'member',
  joined_on   DATE NOT NULL,
  PRIMARY KEY (student_id, club_id),
  KEY ix_mem_club (club_id),
  CONSTRAINT fk_mem_student FOREIGN KEY (student_id)
    REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mem_club FOREIGN KEY (club_id)
    REFERENCES clubs(club_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
 
-- 4. venues
CREATE TABLE venues (
  venue_id    INT NOT NULL AUTO_INCREMENT,
  venue_name  VARCHAR(60) NOT NULL,
  building    VARCHAR(40) NOT NULL,
  capacity    INT NOT NULL,
  PRIMARY KEY (venue_id),
  UNIQUE KEY uq_venue_name (venue_name),
  CONSTRAINT ck_venue_capacity CHECK (capacity > 0)
) ENGINE=InnoDB;
 
-- 5. events
CREATE TABLE events (
  event_id    INT NOT NULL AUTO_INCREMENT,
  club_id     INT NOT NULL,
  venue_id    INT NULL,
  title       VARCHAR(100) NOT NULL,
  event_date  DATETIME NOT NULL,
  fee         DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  max_seats   INT NOT NULL,
  status      ENUM('planned','completed','cancelled') NOT NULL DEFAULT 'planned',
  PRIMARY KEY (event_id),
  KEY ix_events_club (club_id),
  KEY ix_events_venue (venue_id),
  CONSTRAINT ck_event_fee CHECK (fee >= 0),
  CONSTRAINT ck_event_seats CHECK (max_seats > 0),
  CONSTRAINT fk_event_club FOREIGN KEY (club_id)
    REFERENCES clubs(club_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_event_venue FOREIGN KEY (venue_id)
    REFERENCES venues(venue_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
 
-- 6. registrations (one seat per student per event)
CREATE TABLE registrations (
  reg_id        INT NOT NULL AUTO_INCREMENT,
  event_id      INT NOT NULL,
  student_id    INT NOT NULL,
  registered_on DATETIME NOT NULL,
  attended      TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (reg_id),
  UNIQUE KEY uq_reg_once (event_id, student_id),
  KEY ix_reg_student (student_id),
  CONSTRAINT fk_reg_event FOREIGN KEY (event_id)
    REFERENCES events(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reg_student FOREIGN KEY (student_id)
    REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
 
-- 7. feedback (one rating per student per event)
CREATE TABLE feedback (
  feedback_id INT NOT NULL AUTO_INCREMENT,
  event_id    INT NOT NULL,
  student_id  INT NOT NULL,
  rating      TINYINT NOT NULL,
  comment     VARCHAR(200) NULL,
  given_on    DATE NOT NULL,
  PRIMARY KEY (feedback_id),
  UNIQUE KEY uq_feedback_once (event_id, student_id),
  KEY ix_fb_student (student_id),
  CONSTRAINT ck_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_fb_event FOREIGN KEY (event_id)
    REFERENCES events(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_fb_student FOREIGN KEY (student_id)
    REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
 
-- 8. sponsors
CREATE TABLE sponsors (
  sponsor_id    INT NOT NULL AUTO_INCREMENT,
  sponsor_name  VARCHAR(80) NOT NULL,
  industry      VARCHAR(40) NOT NULL,
  contact_email VARCHAR(120) NOT NULL,
  PRIMARY KEY (sponsor_id),
  UNIQUE KEY uq_sponsor_name (sponsor_name)
) ENGINE=InnoDB;
 
-- 9. event_sponsors (M:N events <-> sponsors, carries the amount)
CREATE TABLE event_sponsors (
  event_id    INT NOT NULL,
  sponsor_id  INT NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (event_id, sponsor_id),
  KEY ix_es_sponsor (sponsor_id),
  CONSTRAINT ck_amount CHECK (amount > 0),
  CONSTRAINT fk_es_event FOREIGN KEY (event_id)
    REFERENCES events(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_es_sponsor FOREIGN KEY (sponsor_id)
    REFERENCES sponsors(sponsor_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
 
-- 10. event_status_log (filled automatically by a trigger)
CREATE TABLE event_status_log (
  log_id      INT NOT NULL AUTO_INCREMENT,
  event_id    INT NOT NULL,
  old_status  VARCHAR(20) NOT NULL,
  new_status  VARCHAR(20) NOT NULL,
  changed_on  DATETIME NOT NULL,
  PRIMARY KEY (log_id),
  KEY ix_log_event (event_id)
) ENGINE=InnoDB;

-- ============================================================
-- File : 02_data.sql (sample data for campus_events_db)
-- ============================================================
 
INSERT INTO students (full_name, email, department, batch_year, joined_on, is_active) VALUES
('Ayaan Rahman',     'ayaan.rahman@campus.example',     'CSE',      2022, '2022-09-01', 1),
('Tahmina Sultana',  'tahmina.sultana@campus.example',  'CSE',      2022, '2022-09-01', 1),
('Rezaul Karim',     'rezaul.karim@campus.example',     'EEE',      2022, '2022-09-01', 1),
('Mim Akter',        'mim.akter@campus.example',        'BBA',      2022, '2022-09-01', 1),
('Sakib Hossain',    'sakib.hossain@campus.example',    'CSE',      2023, '2023-01-09', 1),
('Nabila Chowdhury', 'nabila.chowdhury@campus.example', 'English',  2022, '2022-09-01', 1),
('Fahim Ahmed',      'fahim.ahmed@campus.example',      'Civil',    2023, '2023-01-09', 1),
('Sadika Noor',      'sadika.noor@campus.example',      'BBA',      2023, '2023-01-09', 1),
('Tousif Islam',     'tousif.islam@campus.example',     'CSE',      2023, '2023-01-09', 1),
('Anika Tabassum',   'anika.tabassum@campus.example',   'Pharmacy', 2022, '2022-09-01', 1),
('Mahir Faisal',     'mahir.faisal@campus.example',     'EEE',      2023, '2023-01-09', 1),
('Jannat Ferdous',   'jannat.ferdous@campus.example',   'English',  2023, '2023-01-09', 1),
('Rifat Kabir',      'rifat.kabir@campus.example',      'CSE',      2024, '2024-01-08', 1),
('Shabnam Parvin',   'shabnam.parvin@campus.example',   'BBA',      2024, '2024-01-08', 1),
('Nafis Imtiaz',     'nafis.imtiaz@campus.example',     'Civil',    2022, '2022-09-01', 0);
 
INSERT INTO clubs (club_name, category, description, founded_on) VALUES
('Programming Club',       'tech',     'Workshops, contests and hackathons for coders.',   '2019-02-10'),
('Robotics Society',       'tech',     'Builds and races small robots.',                   '2020-03-01'),
('Debating Society',       'academic', 'Inter-department debates and public speaking.',    '2018-08-15'),
('Cultural Forum',         'cultural', 'Music, dance and drama on campus.',                '2017-11-20'),
('Photography Circle',     'cultural', 'Photo walks and exhibitions.',                     '2021-01-25'),
('Cricket Club',           'sports',   'Runs the annual cricket tournament.',              '2016-09-05'),
('Football Club',          'sports',   'Runs the inter-department football league.',       '2016-09-12'),
('Business Club',          'academic', 'Startup pitches and industry talks.',              '2019-10-04'),
('Community Service Corps','social',   'Blood drives and charity work.',                   '2020-06-18'),
('Literary Society',       'academic', 'Poetry, essays and a yearly magazine.',            '2018-01-30');
 
INSERT INTO venues (venue_name, building, capacity) VALUES
('Main Auditorium',   'Academic Block A', 600),
('Seminar Hall A',    'Academic Block A', 120),
('Seminar Hall B',    'Academic Block B', 100),
('Computer Lab 3',    'Academic Block B',  60),
('Cafeteria Lawn',    'Student Centre',   300),
('Sports Ground',     'Campus Field',    1000),
('Conference Room',   'Admin Block',       40),
('Library Hall',      'Library',          150),
('Rooftop Arena',     'Student Centre',   200),
('Art Gallery Room',  'Arts Building',     80);
 
INSERT INTO events (club_id, venue_id, title, event_date, fee, max_seats, status) VALUES
(1, 4, 'Intro to Git Workshop',        '2026-02-10 10:00:00',   0.00,  50, 'completed'),
(1, 1, '24 Hour Hackathon',            '2026-03-14 09:00:00', 300.00, 100, 'completed'),
(2, 3, 'Line Follower Robot Contest',  '2026-02-22 11:00:00', 150.00,  40, 'completed'),
(3, 2, 'Inter-Department Debate',      '2026-03-05 14:00:00',  50.00, 100, 'completed'),
(4, 1, 'Cultural Night',               '2026-04-18 18:00:00', 200.00, 500, 'completed'),
(5, 5, 'Old Dhaka Photo Walk',         '2026-03-28 07:00:00', 100.00,  30, 'completed'),
(6, 6, 'Cricket Premier Cup',          '2026-04-25 08:00:00', 250.00, 200, 'completed'),
(7, 6, 'Football Fiesta',              '2026-05-09 16:00:00', 200.00, 200, 'completed'),
(8, 2, 'Startup Pitch Day',            '2026-05-16 10:00:00', 100.00, 100, 'completed'),
(9, 5, 'Blood Donation Drive',         '2026-06-06 09:00:00',   0.00, 150, 'completed'),
(4, 8, 'Poetry Evening',               '2026-06-20 17:00:00',   0.00, 100, 'completed'),
(1, 4, 'Python Bootcamp',              '2026-08-15 10:00:00', 500.00,  40, 'cancelled'),
(1, 8, 'AI Talk Series',               '2026-09-12 15:00:00',   0.00,  80, 'completed'),
(2, 6, 'Robo Soccer Demo',             '2026-10-20 10:00:00', 100.00,  60, 'planned'),
(4, 1, 'Winter Fest',                  '2026-12-05 17:00:00', 250.00, 400, 'planned');
 
INSERT INTO memberships (student_id, club_id, member_role, joined_on) VALUES
(1,1,'president','2022-09-05'),(2,1,'executive','2022-09-12'),(5,1,'member','2023-01-10'),
(9,1,'member','2023-02-01'),(13,1,'member','2024-01-15'),
(1,2,'member','2023-03-01'),(3,2,'president','2022-10-01'),(11,2,'executive','2023-02-20'),
(6,3,'president','2022-09-20'),(4,3,'member','2023-05-05'),(12,3,'executive','2023-05-06'),
(6,4,'member','2023-03-15'),(10,4,'president','2022-11-01'),(12,4,'member','2023-04-04'),
(7,5,'member','2023-06-01'),(10,5,'member','2023-06-02'),
(5,6,'president','2022-12-01'),(7,6,'member','2023-01-20'),(13,6,'member','2024-02-02'),
(9,7,'member','2023-02-14'),(11,7,'president','2022-12-10'),
(4,8,'president','2023-01-05'),(8,8,'executive','2023-01-25'),(14,8,'member','2024-03-03'),
(8,9,'president','2023-02-10'),(14,9,'member','2024-03-04');
 
INSERT INTO registrations (event_id, student_id, registered_on, attended) VALUES
(1,1,'2026-02-05 09:10:00',1),(1,2,'2026-02-05 11:20:00',1),(1,5,'2026-02-06 08:45:00',1),
(1,9,'2026-02-06 13:00:00',1),(1,13,'2026-02-07 10:30:00',1),(1,3,'2026-02-07 16:05:00',0),
(2,1,'2026-03-01 10:00:00',1),(2,2,'2026-03-01 10:30:00',1),(2,5,'2026-03-02 09:15:00',1),
(2,9,'2026-03-02 14:40:00',1),(2,13,'2026-03-03 12:00:00',1),(2,11,'2026-03-04 15:25:00',0),
(2,3,'2026-03-05 17:10:00',1),
(3,3,'2026-02-15 10:00:00',1),(3,11,'2026-02-15 10:20:00',1),(3,1,'2026-02-16 12:00:00',1),
(3,9,'2026-02-17 09:30:00',0),
(4,6,'2026-02-25 10:00:00',1),(4,4,'2026-02-25 11:30:00',1),(4,12,'2026-02-26 13:15:00',1),
(4,8,'2026-02-27 09:00:00',0),(4,14,'2026-02-28 16:45:00',1),
(5,6,'2026-04-05 10:00:00',1),(5,10,'2026-04-05 10:05:00',1),(5,12,'2026-04-06 12:30:00',1),
(5,4,'2026-04-07 15:00:00',1),(5,7,'2026-04-08 11:45:00',1),(5,8,'2026-04-09 09:20:00',0),
(6,7,'2026-03-20 08:00:00',1),(6,10,'2026-03-20 09:10:00',1),(6,6,'2026-03-21 14:00:00',0),
(7,5,'2026-04-15 10:00:00',1),(7,7,'2026-04-15 11:00:00',1),(7,13,'2026-04-16 09:30:00',1),
(7,9,'2026-04-17 13:20:00',1),
(8,11,'2026-05-01 10:00:00',1),(8,9,'2026-05-01 12:00:00',1),(8,15,'2026-05-02 15:15:00',0),
(9,4,'2026-05-08 09:00:00',1),(9,8,'2026-05-08 09:30:00',1),(9,14,'2026-05-09 11:10:00',1),
(9,15,'2026-05-10 14:00:00',1),
(10,8,'2026-05-28 10:00:00',1),(10,14,'2026-05-28 10:30:00',1),(10,10,'2026-05-29 12:00:00',1),
(11,6,'2026-06-12 10:00:00',1),(11,12,'2026-06-12 10:20:00',1),(11,10,'2026-06-13 09:00:00',0),
(13,1,'2026-09-01 10:00:00',1),(13,2,'2026-09-01 10:30:00',1),(13,5,'2026-09-02 11:00:00',1),
(13,13,'2026-09-03 09:45:00',1),
(14,2,'2026-09-25 10:00:00',0),(14,3,'2026-09-26 11:00:00',0),(14,11,'2026-09-27 15:30:00',0),
(15,6,'2026-09-28 10:00:00',0),(15,10,'2026-09-28 10:30:00',0);
 
INSERT INTO feedback (event_id, student_id, rating, comment, given_on) VALUES
(1,1,5,'Clear and practical.','2026-02-11'),(1,2,4,'Good pace.','2026-02-11'),(1,5,5,NULL,'2026-02-12'),
(2,1,5,'Best event of the semester.','2026-03-15'),(2,2,4,'Great mentors.','2026-03-15'),
(2,9,3,'Food was late.','2026-03-16'),(2,13,4,NULL,'2026-03-16'),
(3,3,4,'Fun contest.','2026-02-23'),(3,11,5,'Loved the track design.','2026-02-23'),
(4,6,5,'Sharp arguments.','2026-03-06'),(4,4,3,'Timing ran over.','2026-03-06'),(4,12,4,NULL,'2026-03-07'),
(5,6,5,'Wonderful performances.','2026-04-19'),(5,10,5,NULL,'2026-04-19'),(5,7,4,'Sound was too loud.','2026-04-20'),
(7,5,4,'Well organised.','2026-04-26'),(7,13,3,'Ground was wet.','2026-04-26'),
(9,4,4,'Useful pitches.','2026-05-17'),(9,14,5,'Inspiring.','2026-05-17'),
(10,8,5,'Well run.','2026-06-07');
 
INSERT INTO sponsors (sponsor_name, industry, contact_email) VALUES
('NovaTech Solutions', 'IT',         'events@novatech.example'),
('GreenLeaf Foods',    'Food',       'sponsor@greenleaf.example'),
('BlueWave Telecom',   'Telecom',    'campus@bluewave.example'),
('Sunrise Bank Ltd',   'Finance',    'csr@sunrisebank.example'),
('Metro Sports Gear',  'Retail',     'team@metrosports.example'),
('Bright Books',       'Publishing', 'hello@brightbooks.example'),
('Zenith Pharma',      'Healthcare', 'csr@zenithpharma.example'),
('CloudNest Hosting',  'IT',         'edu@cloudnest.example'),
('Urban Threads',      'Fashion',    'brand@urbanthreads.example'),
('Delta Print House',  'Printing',   'orders@deltaprint.example');
 
INSERT INTO event_sponsors (event_id, sponsor_id, amount) VALUES
(2,1,50000.00),(2,8,30000.00),(5,4,60000.00),(5,9,25000.00),(7,5,40000.00),(8,5,35000.00),
(10,7,20000.00),(3,1,15000.00),(9,4,45000.00),(4,6,8000.00),(1,8,5000.00),(13,3,12000.00);

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
 

-- ===== tests =====
SELECT event_id, title, fn_fill_rate(event_id) AS fill_pct, fn_avg_rating(event_id) AS avg_rating FROM events WHERE event_id IN (1,2,6,14);
CALL sp_register_student(14, 5, @m1);
SELECT @m1 AS result;
CALL sp_club_revenue_report();
