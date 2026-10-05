-- ============================================================
-- CSE 364 - Database Systems Project
-- Topic : Campus Club & Event Management System
-- File  : 01_schema.sql (database + table definitions)
-- DBMS  : MySQL 8.0+
-- Load order: 01_schema.sql -> 02_data.sql -> 03_routines.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS campus_events_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE campus_events_db;

-- Drop in reverse dependency order so the script can be re-run.
DROP VIEW  IF EXISTS v_event_summary;
DROP TABLE IF EXISTS event_status_log;
DROP TABLE IF EXISTS event_sponsors;
DROP TABLE IF EXISTS sponsors;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS students;

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

-- 10. event_status_log (filled automatically by a trigger; no FK so the
--     history is kept even if an event row is later deleted)
CREATE TABLE event_status_log (
  log_id      INT NOT NULL AUTO_INCREMENT,
  event_id    INT NOT NULL,
  old_status  VARCHAR(20) NOT NULL,
  new_status  VARCHAR(20) NOT NULL,
  changed_on  DATETIME NOT NULL,
  PRIMARY KEY (log_id),
  KEY ix_log_event (event_id)
) ENGINE=InnoDB;

