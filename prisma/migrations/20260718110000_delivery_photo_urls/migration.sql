-- AlterTable: replace single photoUrl with photoUrls array
ALTER TABLE "Delivery" ADD COLUMN "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Migrate existing comma-separated photoUrl values into photoUrls
UPDATE "Delivery"
SET "photoUrls" = (
  SELECT COALESCE(
    array_agg(TRIM(url) ORDER BY ordinality),
    ARRAY[]::TEXT[]
  )
  FROM unnest(string_to_array("photoUrl", ',')) WITH ORDINALITY AS t(url, ordinality)
  WHERE TRIM(url) <> ''
)
WHERE "photoUrl" IS NOT NULL
  AND TRIM("photoUrl") <> '';

-- Drop old column
ALTER TABLE "Delivery" DROP COLUMN "photoUrl";
