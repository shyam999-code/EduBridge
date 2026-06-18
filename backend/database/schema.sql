-- =========================================================
-- EDUBRIDGE SMART SCHOOL ERP SYSTEM - POSTGRESQL DDL SCHEMA
-- Execute these statements inside the Supabase SQL Editor
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'student')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    teacher_id VARCHAR(100) UNIQUE,
    date_of_birth DATE,
    subject VARCHAR(100),
    designation VARCHAR(255) NOT NULL,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CLASSES TABLE
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(100) UNIQUE,
    roll_number VARCHAR(100) NOT NULL UNIQUE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    address TEXT,
    phone VARCHAR(50),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PARENTS TABLE
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES students(id) ON DELETE SET NULL,
    designation VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Present', 'Absent')),
    check_in VARCHAR(50) DEFAULT '-',
    remarks TEXT DEFAULT 'On time',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, date)
);

-- 7. MARKS TABLE
CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL CHECK (subject IN ('Telugu', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Studies')),
    biology_score NUMERIC DEFAULT 0,
    physics_score NUMERIC DEFAULT 0,
    score NUMERIC NOT NULL DEFAULT 0,
    max_score NUMERIC NOT NULL DEFAULT 100,
    type VARCHAR(100) NOT NULL DEFAULT 'Annual Exam',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. HOMEWORK TABLE
CREATE TABLE IF NOT EXISTS homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    chapter_name VARCHAR(255) NOT NULL,
    completion_day VARCHAR(100) NOT NULL,
    details TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Urgent', 'Submitted', 'Graded')),
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. BEHAVIOUR REPORTS TABLE
CREATE TABLE IF NOT EXISTS behaviour_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('positive', 'negative')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Review', 'Resolved')),
    response TEXT DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (type IN ('event', 'urgent', 'general')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    author_name VARCHAR(255) NOT NULL DEFAULT 'Principal Office',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (type IN ('alert', 'update', 'event', 'general')),
    title VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- CREATE MOCK DATA SEEDS
-- =========================================================

-- Root Admin seed account: shyamkumar@edubridge.com / admin@123
INSERT INTO users (id, name, email, password_hash, role, status)
VALUES ('a1111111-1111-1111-1111-111111111111', 'Shyamkumar', 'shyamkumar@edubridge.com', '$2a$10$7bG6WUn9hM36BMEsYHdZ1u3TPm.UUy0..GpiFCtjyYSqUlpl.7yAK', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Senior Teacher seed account: teacher@edubridge.com / Password: DOB (12051990)
INSERT INTO users (id, name, email, password_hash, role, status)
VALUES ('b1111111-1111-1111-1111-111111111111', 'Prof. Marcus Vance', 'teacher@edubridge.com', '$2b$10$IyG6atT5bvSJSZiQuS7WgeR56CB5hVfdXyMwpAvIHEQPoprv41SEG', 'teacher', 'active')
ON CONFLICT (email) DO NOTHING;

-- Student seed account: student@edubridge.com / Password: DOB (15012006)
INSERT INTO users (id, name, email, password_hash, role, status)
VALUES ('01111111-1111-1111-1111-111111111111', 'Leo Sterling', 'student@edubridge.com', '$2b$10$r571vzuQK8emiXVD7F5BH.tfpqvdRvHmweBfe2d26BI9iZGs/KeqS', 'student', 'active')
ON CONFLICT (email) DO NOTHING;

-- Parent seed account: parent@edubridge.com / Password: Mobile (9988776655)
INSERT INTO users (id, name, email, password_hash, role, status)
VALUES ('02222222-2222-2222-2222-222222222222', 'Robert Sterling', 'parent@edubridge.com', '$2b$10$3ekdhyEQ6V43MM.o8eTv8uExk7IslBn3x7zG2x4zNgq5ghY6CPamW', 'parent', 'active')
ON CONFLICT (email) DO NOTHING;

-- Teachers Profile link (Teacher ID: T001, DOB: 1990-05-12)
INSERT INTO teachers (id, user_id, teacher_id, date_of_birth, subject, designation, address, phone)
VALUES ('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'T001', '1990-05-12', 'Science', 'Senior Mathematics & Physics Tutor', '128 Birchwood Avenue, Riverdale', '+1 (555) 014-9821')
ON CONFLICT DO NOTHING;

-- Class Level
INSERT INTO classes (id, name, grade_level, teacher_id)
VALUES ('c1111111-1111-1111-1111-111111111111', 'Grade 8-D', 'Grade 8', 'd1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Student Profile link (Student ID: 8D46, DOB: 2006-01-15)
INSERT INTO students (id, user_id, student_id, roll_number, class_id, address, phone, date_of_birth)
VALUES ('e1111111-1111-1111-1111-111111111111', '01111111-1111-1111-1111-111111111111', '8D46', '46', 'c1111111-1111-1111-1111-111111111111', '404 Oakwood Lane, Crestview', '9988776655', '2006-01-15')
ON CONFLICT DO NOTHING;

-- Parent Profile link (Parent Phone: 9988776655)
INSERT INTO parents (id, user_id, child_id, designation, address, phone)
VALUES ('f1111111-1111-1111-1111-111111111111', '02222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Parent / Guardian', '404 Oakwood Lane, Crestview', '9988776655')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 13. PROMOTION MANAGEMENT ADDITIONS
-- =========================================================

-- Alter students table to add status
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Enrolled' CHECK (status IN ('Enrolled', 'Completed Schooling'));

-- Create past performance history table
CREATE TABLE IF NOT EXISTS past_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) NOT NULL,
    previous_class_name VARCHAR(100) NOT NULL,
    marks_summary JSONB DEFAULT '{}'::jsonb,
    attendance_summary JSONB DEFAULT '{}'::jsonb,
    complaint_summary JSONB DEFAULT '{}'::jsonb,
    teacher_remarks TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create promotions log table
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    previous_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    new_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    academic_year VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Promoted', 'Completed Schooling')),
    promoted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alter tables for Teacher Login Management and Student Login Management
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(100) UNIQUE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subject VARCHAR(100);

ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(100) UNIQUE;

-- 14. ADMIN REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS admin_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
