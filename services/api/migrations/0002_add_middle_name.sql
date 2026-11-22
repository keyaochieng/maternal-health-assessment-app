-- I keep this field nullable so existing patient records remain valid.
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);