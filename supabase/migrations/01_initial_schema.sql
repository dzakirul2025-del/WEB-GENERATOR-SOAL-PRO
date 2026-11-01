-- ============================================================================
-- MADRASAH ASSESSMENT PRO – MIN 1 PASER
-- DATABASE SCHEMA MIGRATION: 01_initial_schema.sql
-- PostgreSQL / Supabase Relational Schema with Row Level Security (RLS)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TYPE user_role_enum AS ENUM (
  'super_admin',
  'kepala_madrasah',
  'guru',
  'wali_kelas',
  'operator',
  'peserta_didik'
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  nip VARCHAR(50),
  nisn VARCHAR(20),
  role user_role_enum NOT NULL DEFAULT 'guru',
  assigned_class_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ACADEMIC YEARS & SEMESTERS
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE, -- e.g. "2024/2025"
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name VARCHAR(20) NOT NULL CHECK (name IN ('Ganjil', 'Genap')),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (academic_year_id, name)
);

-- 3. CLASSES & STUDENTS
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL, -- e.g. "Kelas 4A"
  grade INT NOT NULL CHECK (grade BETWEEN 1 AND 6),
  phase VARCHAR(20) NOT NULL CHECK (phase IN ('Fase A', 'Fase B', 'Fase C')),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  homeroom_teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nis VARCHAR(50) NOT NULL,
  nisn VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SUBJECTS & ASSIGNMENTS
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('PAI', 'Umum', 'Muatan Lokal')),
  default_kktp NUMERIC(4,1) NOT NULL DEFAULT 75.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (teacher_id, subject_id, class_id, academic_year_id)
);

-- 5. CURRICULUM (KURIKULUM MERDEKA MADRASAH)
CREATE TABLE IF NOT EXISTS learning_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase VARCHAR(20) NOT NULL CHECK (phase IN ('Fase A', 'Fase B', 'Fase C')),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  element VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE, -- e.g. "CP-AA-B.1"
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outcome_id UUID NOT NULL REFERENCES learning_outcomes(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL UNIQUE, -- e.g. "TP-AA-4.1"
  description TEXT NOT NULL,
  phase VARCHAR(20) NOT NULL CHECK (phase IN ('Fase A', 'Fase B', 'Fase C')),
  grade INT NOT NULL CHECK (grade BETWEEN 1 AND 6),
  chapter VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ASSESSMENTS
CREATE TYPE assessment_type_enum AS ENUM (
  'formatif',
  'sumatif_bab',
  'sumatif_semester',
  'sumatif_tahun',
  'ujian_madrasah'
);

CREATE TYPE assessment_status_enum AS ENUM (
  'draft',
  'dalam_validasi',
  'disetujui',
  'published',
  'sedang_berlangsung',
  'selesai',
  'dalam_koreksi',
  'dinilai',
  'disahkan',
  'diarsipkan'
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  type assessment_type_enum NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  semester_id UUID NOT NULL REFERENCES semesters(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  author_id UUID NOT NULL REFERENCES profiles(id),
  execution_date DATE NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  token VARCHAR(20) NOT NULL,
  kktp NUMERIC(4,1) NOT NULL DEFAULT 75.0,
  status assessment_status_enum NOT NULL DEFAULT 'draft',
  objectives_covered JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_weight INT NOT NULL DEFAULT 0,
  instructions TEXT,
  is_randomized_questions BOOLEAN NOT NULL DEFAULT FALSE,
  is_randomized_options BOOLEAN NOT NULL DEFAULT FALSE,
  endorsed_by VARCHAR(255),
  endorsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. QUESTIONS, OPTIONS & RUBRICS
CREATE TYPE question_type_enum AS ENUM ('pilihan_ganda', 'isian', 'essay');
CREATE TYPE cognitive_level_enum AS ENUM ('C1', 'C2', 'C3', 'C4', 'C5', 'C6');
CREATE TYPE difficulty_level_enum AS ENUM ('mudah', 'sedang', 'sulit');

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  number INT NOT NULL,
  type question_type_enum NOT NULL,
  stem TEXT NOT NULL,
  stimulus TEXT,
  stimulus_image_url TEXT,
  correct_answer_key TEXT,
  answer_variations JSONB DEFAULT '[]'::jsonb,
  scoring_guide TEXT,
  essay_rubric JSONB,
  explanation TEXT NOT NULL,
  learning_objective_id UUID REFERENCES learning_objectives(id),
  indicator TEXT NOT NULL,
  cognitive_level cognitive_level_enum NOT NULL,
  difficulty difficulty_level_enum NOT NULL,
  weight INT NOT NULL DEFAULT 1,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  key CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
  text TEXT NOT NULL,
  image_url TEXT
);

-- 8. CBT SESSIONS & ANSWERS
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_entered VARCHAR(20) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finish_time TIMESTAMPTZ,
  duration_seconds_used INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  tab_switch_count INT NOT NULL DEFAULT 0,
  score NUMERIC(5,2),
  is_graded BOOLEAN NOT NULL DEFAULT FALSE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, student_id)
);

-- 9. DIGITAL GRADEBOOK (BUKU NILAI DIGITAL)
CREATE TABLE IF NOT EXISTS gradebook_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  student_id UUID NOT NULL REFERENCES students(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id),
  semester_id UUID NOT NULL REFERENCES semesters(id),
  assessment_type assessment_type_enum NOT NULL,
  final_score NUMERIC(5,2) NOT NULL,
  is_passed BOOLEAN NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'disahkan',
  endorsed_by VARCHAR(255) NOT NULL,
  endorsed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (assessment_id, student_id)
);

-- 10. REMEDIAL & ENRICHMENT
CREATE TABLE IF NOT EXISTS remedial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  unmastered_tp_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  initial_score NUMERIC(5,2) NOT NULL,
  remedial_score NUMERIC(5,2),
  final_remedial_score NUMERIC(5,2),
  action_taken TEXT NOT NULL,
  retest_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  details TEXT NOT NULL
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_questions_assessment_id ON questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_assessment_student ON assessment_sessions(assessment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_class_subject ON gradebook_entries(class_id, subject_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gradebook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SAMPLE RLS POLICIES (Super Admin and Teachers)
CREATE POLICY "Public Read for Authenticated Profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can manage own assessments" ON assessments
  FOR ALL USING (auth.uid() = author_id OR auth.jwt() ->> 'role' IN ('super_admin', 'kepala_madrasah'));

CREATE POLICY "Students can view only own sessions" ON assessment_sessions
  FOR SELECT USING (auth.uid() = student_id OR auth.jwt() ->> 'role' IN ('super_admin', 'kepala_madrasah', 'guru'));
