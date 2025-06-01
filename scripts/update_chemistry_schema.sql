-- Add overall_score column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'team_chemistry' AND column_name = 'overall_score') THEN
        ALTER TABLE team_chemistry 
        ADD COLUMN overall_score DECIMAL(5,2);
        
        -- Update existing rows with a default value based on the score column
        UPDATE team_chemistry 
        SET overall_score = score;
        
        -- Make the column NOT NULL after updating all rows
        ALTER TABLE team_chemistry 
        ALTER COLUMN overall_score SET NOT NULL;
        
        RAISE NOTICE 'Added overall_score column to team_chemistry table';
    ELSE
        RAISE NOTICE 'overall_score column already exists in team_chemistry table';
    END IF;
END $$;
