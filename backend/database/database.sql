-- ==============================================================
-- Gradelytics - AI-Powered Student Performance Prediction System
-- Database Schema Definition (MySQL)
-- Database Name: gradelytics_db
-- ==============================================================

CREATE DATABASE IF NOT EXISTS gradelytics_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gradelytics_db;

-- -------------------------------------------------------------
-- 1. Table: users
-- Stores authenticated teachers, educators, and administrators
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. Table: students
-- Stores enrolled student records and academic baseline info
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    course VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    attendance FLOAT NOT NULL DEFAULT 0.0,
    previous_marks FLOAT NOT NULL DEFAULT 0.0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_student_creator (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. Table: predictions
-- Stores ML model examination marks predictions and input features
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    user_id INT NOT NULL,
    attendance FLOAT NOT NULL,
    previous_marks FLOAT NOT NULL,
    assignment_marks FLOAT NOT NULL,
    study_hours FLOAT NOT NULL,
    class_participation FLOAT NOT NULL,
    internal_marks FLOAT NOT NULL,
    completed_assignments INT NOT NULL,
    predicted_marks FLOAT NOT NULL,
    performance_category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_prediction_student (student_id),
    INDEX idx_prediction_user (user_id),
    INDEX idx_prediction_category (performance_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
