-- ============================================================================
-- MADRASAH ASSESSMENT PRO – MIN 1 PASER
-- DATABASE SEED DATA: seed.sql
-- ============================================================================

-- Academic Years & Semesters
INSERT INTO academic_years (id, name, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', '2024/2025', true),
  ('a0000000-0000-0000-0000-000000000002', '2025/2026', false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO semesters (id, academic_year_id, name, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ganjil', true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Genap', false)
ON CONFLICT DO NOTHING;

-- Subjects
INSERT INTO subjects (id, code, name, category, default_kktp)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'AA-02', 'Akidah Akhlak', 'PAI', 75.0),
  ('c0000000-0000-0000-0000-000000000002', 'MTK-07', 'Matematika', 'Umum', 70.0),
  ('c0000000-0000-0000-0000-000000000003', 'IPAS-08', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Umum', 73.0),
  ('c0000000-0000-0000-0000-000000000004', 'QH-01', 'Al-Qur''an Hadis', 'PAI', 75.0),
  ('c0000000-0000-0000-0000-000000000005', 'BA-05', 'Bahasa Arab', 'PAI', 72.0)
ON CONFLICT (code) DO NOTHING;

-- Classes
INSERT INTO classes (id, name, grade, phase, academic_year_id)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Kelas 4A', 4, 'Fase B', 'a0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'Kelas 4B', 4, 'Fase B', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Sample Students for Kelas 4A
INSERT INTO students (nis, nisn, name, gender, class_id)
VALUES
  ('2021001', '0123456789', 'Ahmad Faiz Pratama', 'L', 'd0000000-0000-0000-0000-000000000001'),
  ('2021002', '0123456790', 'Annisa Nurul Izzah', 'P', 'd0000000-0000-0000-0000-000000000001'),
  ('2021003', '0123456791', 'Bilal Habiburrahman', 'L', 'd0000000-0000-0000-0000-000000000001'),
  ('2021004', '0123456792', 'Dinda Zahra Salsabila', 'P', 'd0000000-0000-0000-0000-000000000001'),
  ('2021005', '0123456793', 'Fatih Al-Ghifari', 'L', 'd0000000-0000-0000-0000-000000000001')
ON CONFLICT (nisn) DO NOTHING;
