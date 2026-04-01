-- ============================================
-- STAFF RATING AUTO-UPDATE SYSTEM
-- ============================================
-- This script creates database triggers to automatically
-- update staff ratings when feedback is submitted
-- ============================================

-- Step 1: Create the function that updates staff ratings
-- ============================================
CREATE OR REPLACE FUNCTION update_staff_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate new average rating and count for the staff member
  UPDATE users
  SET 
    avg_rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM feedback
      WHERE staff_id = COALESCE(NEW.staff_id, OLD.staff_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM feedback
      WHERE staff_id = COALESCE(NEW.staff_id, OLD.staff_id)
    )
  WHERE id = COALESCE(NEW.staff_id, OLD.staff_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger for INSERT operations
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_staff_rating_insert ON feedback;
CREATE TRIGGER trigger_update_staff_rating_insert
AFTER INSERT ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_staff_rating();

-- Step 3: Create trigger for UPDATE operations
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_staff_rating_update ON feedback;
CREATE TRIGGER trigger_update_staff_rating_update
AFTER UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_staff_rating();

-- Step 4: Create trigger for DELETE operations
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_staff_rating_delete ON feedback;
CREATE TRIGGER trigger_update_staff_rating_delete
AFTER DELETE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_staff_rating();

-- Step 5: Recalculate all existing staff ratings
-- ============================================
-- This updates ratings for all staff based on existing feedback
UPDATE users u
SET 
  avg_rating = COALESCE(
    (SELECT AVG(rating)::numeric(3,2) FROM feedback WHERE staff_id = u.id),
    0
  ),
  rating_count = COALESCE(
    (SELECT COUNT(*) FROM feedback WHERE staff_id = u.id),
    0
  )
WHERE role = 'staff';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to check if ratings are updated correctly
SELECT 
  u.id,
  u.full_name,
  u.role,
  u.avg_rating,
  u.rating_count,
  COUNT(f.id) as actual_feedback_count,
  AVG(f.rating)::numeric(3,2) as calculated_avg
FROM users u
LEFT JOIN feedback f ON f.staff_id = u.id
WHERE u.role = 'staff'
GROUP BY u.id, u.full_name, u.role, u.avg_rating, u.rating_count
ORDER BY u.full_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see this, the triggers are created successfully!
-- Now when customers submit ratings, staff avg_rating will
-- automatically update in real-time! 🎉
