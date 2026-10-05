-- ============================================================
-- File : 02_data.sql (sample data for campus_events_db)
-- ============================================================
USE campus_events_db;

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
