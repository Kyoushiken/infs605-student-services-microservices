-- REM: *******************************************************************
-- REM: ***** Assignment 2: INFS605 Microservices Programming Project *****
-- REM: *******************************************************************
-- REM: * Purpose: Creating the PostGres SQL code needed to create the tables for the database*

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    rating INT NOT NULL,
    comments TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
