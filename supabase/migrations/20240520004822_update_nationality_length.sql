-- Update the nationality column to support 3-character country codes
ALTER TABLE players ALTER COLUMN nationality TYPE VARCHAR(3);
