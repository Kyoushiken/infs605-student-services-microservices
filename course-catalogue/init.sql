-- REM: *******************************************************************
-- REM: ***** Assignment 2: INFS605 Microservices Programming Project *****
-- REM: *******************************************************************
-- REM: * Purpose: Creating the PostGres SQL code needed to create the tables for the database*

CREATE TABLE if NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    credits INT NOT NULL   
);

INSERT INTO courses (code, title, credits) VALUES
('INFS605', 'Microservices', 15),
('COMP603', 'Program Design and Construction', 15),
('ENGE707', 'Data Engineering and AI', 15);