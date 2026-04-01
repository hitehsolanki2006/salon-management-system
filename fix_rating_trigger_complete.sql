-- ============================================
-- COMPLETE RATING SYSTEM FIX
-- ============================================
-- This script will:
-- 1. Drop old/broken triggers
-- 2. Create a working trigger function
-- 3. Create new triggers
-- 4. Recalculate all existing ratings
-- ============================================

-- STEP 1: Drop all existing rating triggers
DROP TRIGGER IF EXISTS on_feedback_insert ON feedback;
DROP TRIGGER IF EXISTS trigger_update_staff_rating_delete ON feedback;
DROP TRIGGER IF EXISTS trigger_update_staff_rating_insert ON feedback;
DROP TRIGGER IF EXISTS trigger_update_staff_rating_update ON feedback;
DROP TRIGGER IF EXISTS update_rating_after_feedback ON feedback;

-- STEP 2: Drop old trigger function
DROP FUNCTION IF EXISTS update_staff_rating();

-- STEP 3: Create new working trigger function
CREATE OR REPLACE FUNCTION update_staff_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_staff_id UUID;
  new_avg_rating NUMERIC(3,2);
  new_rating_count INTEGER;
BEGIN
  -- Determine which staff_id to update
  IF TG_OP = 'DELETE' THEN
    target_staff_id := OLD.staff_id;
  ELSE
    target_staff_id := NEW.staff_id;
  END IF;
  
  -- Skip if staff_id is NULL
  IF target_staff_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate new average rating
  SELECT 
    COALESCE(AVG(rating)::numeric(3,2), 0),
    COALESCE(COUNT(*), 0)
  INTO new_avg_rating, new_rating_count
  FROM feedback
  WHERE staff_id = target_staff_id;
  
  -- Update the staff member's rating
  UPDATE users
  SET 
    avg_rating = new_avg_rating,
    rating_count = new_rating_count
  WHERE id = target_staff_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Create triggers for INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_update_rating_on_insert
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_rating();

CREATE TRIGGER trigger_update_rating_on_update
  AFTER UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_rating();

CREATE TRIGGER trigger_update_rating_on_delete
  AFTER DELETE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_rating();

-- STEP 5: Manually recalculate ALL existing staff ratings
UPDATE users
SET 
    avg_rating = COALESCE(
        (
            SELECT AVG(rating)::numeric(3,2)
            FROM feedback
            WHERE staff_id = users.id
        ),
        0
    ),
    rating_count = COALESCE(
        (
            SELECT COUNT(*)
            FROM feedback
            WHERE staff_id = users.id
        ),
        0
    )
WHERE role = 'staff';

-- STEP 6: Verify triggers were created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'feedback'
  AND trigger_name LIKE '%rating%'
ORDER BY trigger_name;

-- STEP 7: Verify ratings were updated
SELECT 
    full_name,
    role,
    avg_rating,
    rating_count,
    CASE 
        WHEN rating_count = 0 THEN '📝 No ratings yet'
        WHEN rating_count > 0 THEN '⭐ Has ' || rating_count || ' rating(s)'
        ELSE 'Unknown'
    END as status
FROM users
WHERE role = 'staff'
ORDER BY avg_rating DESC NULLS LAST, full_name;

-- STEP 8: Check feedback records
SELECT 
    f.id,
    f.staff_id,
    u.full_name as staff_name,
    f.rating,
    f.comment,
    f.created_at
FROM feedback f
LEFT JOIN users u ON f.staff_id = u.id
ORDER BY f.created_at DESC
LIMIT 20;

-- STEP 9: Clean up orphaned feedback (optional)
-- Uncomment to delete feedback records with NULL staff_id
-- DELETE FROM feedback WHERE staff_id IS NULL;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- After running this script:
-- 1. Old triggers are removed
-- 2. New working triggers are created
-- 3. All staff ratings are recalculated
-- 4. Future ratings will update automatically
-- 
-- Staff with ratings should show correct avg_rating
-- Staff without ratings should show 0.0
-- ============================================

-- ============================================
-- TESTING THE TRIGGER:
-- ============================================
-- After running this script, test by:
-- 1. Submit a new rating from the app
-- 2. Check if avg_rating and rating_count update
-- 3. Run this query to verify:
--
-- SELECT full_name, avg_rating, rating_count
-- FROM users
-- WHERE role = 'staff'
-- ORDER BY full_name;
-- ============================================
