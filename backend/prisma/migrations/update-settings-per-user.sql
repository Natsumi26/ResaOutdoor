-- Migration: Update Settings to be per-user
-- Date: 2025-11-04

-- Step 1: Add userId column as nullable first
ALTER TABLE settings ADD COLUMN "userId" TEXT;

-- Step 2: Assign existing settings to the first super_admin user
-- If you want to assign to a specific user, replace the subquery with the user's ID
UPDATE settings
SET "userId" = (
  SELECT id FROM users
  WHERE role = 'super_admin'
  ORDER BY "createdAt"
  LIMIT 1
)
WHERE "userId" IS NULL;

-- Step 3: Make userId required and add unique constraint
ALTER TABLE settings ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE settings ADD CONSTRAINT "settings_userId_key" UNIQUE ("userId");

-- Step 4: Add foreign key constraint
ALTER TABLE settings ADD CONSTRAINT "settings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: After this migration, each user will need their own settings row
-- The existing settings have been assigned to the first super_admin
