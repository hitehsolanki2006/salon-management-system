-- ============================================
-- COMPLETE DATABASE SCHEMA EXTRACTION QUERIES
-- ============================================
-- Run these queries in Supabase SQL Editor to get complete database information
-- Copy the results and provide them for documentation
-- ============================================

-- ============================================
-- SECTION 1: ALL TABLES
-- ============================================
-- Lists all tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- SECTION 2: TABLE COLUMNS (Run for each table)
-- ============================================
-- Replace 'TABLE_NAME' with actual table name (users, appointments, etc.)

-- Users table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Appointments table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'appointments'
ORDER BY ordinal_position;

-- Services table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'services'
ORDER BY ordinal_position;

-- Appointment_services table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'appointment_services'
ORDER BY ordinal_position;

-- Payments table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payments'
ORDER BY ordinal_position;

-- Feedback table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'feedback'
ORDER BY ordinal_position;

-- ============================================
-- SECTION 3: FOREIGN KEY RELATIONSHIPS
-- ============================================
-- Shows all foreign key constraints and relationships
SELECT
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- SECTION 4: PRIMARY KEYS
-- ============================================
-- Shows primary key for each table
SELECT
    tc.table_name,
    kcu.column_name AS primary_key_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================
-- SECTION 5: INDEXES
-- ============================================
-- Shows all indexes on tables
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- SECTION 6: ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Shows all RLS policies for each table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- SECTION 7: TRIGGERS
-- ============================================
-- Shows all triggers on tables
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- SECTION 8: FUNCTIONS/STORED PROCEDURES
-- ============================================
-- Shows all custom functions
SELECT
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Get function definition (run for each function)
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_staff_rating';

-- ============================================
-- SECTION 9: TABLE STATISTICS
-- ============================================
-- Shows row counts for each table

-- Users count by role
SELECT 
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Total users
SELECT COUNT(*) as total_users FROM users;

-- Appointments count by status
SELECT 
    status,
    COUNT(*) as count
FROM appointments
GROUP BY status
ORDER BY status;

-- Total appointments
SELECT COUNT(*) as total_appointments FROM appointments;

-- Services count
SELECT COUNT(*) as total_services FROM services;

-- Payments count
SELECT COUNT(*) as total_payments FROM payments;

-- Feedback count
SELECT COUNT(*) as total_feedback FROM feedback;

-- ============================================
-- SECTION 10: SAMPLE DATA (First 5 rows)
-- ============================================

-- Sample users
SELECT * FROM users LIMIT 5;

-- Sample appointments
SELECT * FROM appointments LIMIT 5;

-- Sample services
SELECT * FROM services LIMIT 5;

-- Sample appointment_services
SELECT * FROM appointment_services LIMIT 5;

-- Sample payments
SELECT * FROM payments LIMIT 5;

-- Sample feedback
SELECT * FROM feedback LIMIT 5;

-- ============================================
-- SECTION 11: ENUM TYPES (if any)
-- ============================================
-- Shows custom enum types
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- ============================================
-- SECTION 12: TABLE SIZES
-- ============================================
-- Shows disk space used by each table
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- SECTION 13: UNIQUE CONSTRAINTS
-- ============================================
-- Shows unique constraints on tables
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- SECTION 14: CHECK CONSTRAINTS
-- ============================================
-- Shows check constraints on tables
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================
-- SECTION 15: VIEWS (if any)
-- ============================================
-- Shows all views
SELECT
    table_name AS view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- SECTION 16: SEQUENCES
-- ============================================
-- Shows all sequences (for auto-increment)
SELECT
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================
-- SECTION 17: COMPLETE TABLE RELATIONSHIPS
-- ============================================
-- Visual representation of table relationships
SELECT
    'appointments' AS table_name,
    'customer_id → users.id' AS relationship
UNION ALL
SELECT 'appointments', 'staff_id → users.id'
UNION ALL
SELECT 'appointment_services', 'appointment_id → appointments.id'
UNION ALL
SELECT 'appointment_services', 'service_id → services.id'
UNION ALL
SELECT 'payments', 'appointment_id → appointments.id'
UNION ALL
SELECT 'feedback', 'appointment_id → appointments.id'
UNION ALL
SELECT 'feedback', 'staff_id → users.id'
ORDER BY table_name, relationship;

-- ============================================
-- SECTION 18: AUTHENTICATION USERS (Supabase Auth)
-- ============================================
-- Shows auth users (if accessible)
-- Note: This might require admin privileges
SELECT
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
LIMIT 10;

-- ============================================
-- INSTRUCTIONS FOR USE:
-- ============================================
-- 1. Copy each query section
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run" or press Ctrl+Enter
-- 4. Copy the results
-- 5. Provide all results for complete documentation
--
-- IMPORTANT: Run queries in order for best results
-- Some queries depend on knowing table names from earlier queries
-- ============================================
