-- Add astrological fields to nba_player_season_stats table

-- Add new columns
ALTER TABLE public.nba_player_season_stats
ADD COLUMN IF NOT EXISTS zodiac_sign TEXT,
ADD COLUMN IF NOT EXISTS zodiac_element TEXT,
ADD COLUMN IF NOT EXISTS astro_influence_score DECIMAL(5,2);

-- Add comments for new columns
COMMENT ON COLUMN public.nba_player_season_stats.zodiac_sign IS 'Player''s zodiac sign (Aries, Taurus, etc.)';
COMMENT ON COLUMN public.nba_player_season_stats.zodiac_element IS 'Element associated with the zodiac sign (fire, earth, air, water)';
COMMENT ON COLUMN public.nba_player_season_stats.astro_influence_score IS 'Calculated astrological influence score (0-100)';

-- Create index on astro_influence_score for better query performance
CREATE INDEX IF NOT EXISTS idx_nba_player_season_astro_score 
ON public.nba_player_season_stats(astro_influence_score);

-- Create index on zodiac_sign and zodiac_element for filtering
CREATE INDEX IF NOT EXISTS idx_nba_player_season_zodiac 
ON public.nba_player_season_stats(zodiac_sign, zodiac_element);

-- Create a function to calculate zodiac sign from birth date
CREATE OR REPLACE FUNCTION public.calculate_zodiac_sign(birth_date DATE)
RETURNS JSONB AS $$
DECLARE
    month_num INTEGER;
    day_num INTEGER;
    sign_name TEXT;
    sign_element TEXT;
BEGIN
    IF birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    month_num := EXTRACT(MONTH FROM birth_date);
    day_num := EXTRACT(DAY FROM birth_date);
    
    -- Determine zodiac sign and element based on date
    IF (month_num = 3 AND day_num >= 21) OR (month_num = 4 AND day_num <= 19) THEN
        sign_name := 'Aries';
        sign_element := 'fire';
    ELSIF (month_num = 4 AND day_num >= 20) OR (month_num = 5 AND day_num <= 20) THEN
        sign_name := 'Taurus';
        sign_element := 'earth';
    ELSIF (month_num = 5 AND day_num >= 21) OR (month_num = 6 AND day_num <= 20) THEN
        sign_name := 'Gemini';
        sign_element := 'air';
    ELSIF (month_num = 6 AND day_num >= 21) OR (month_num = 7 AND day_num <= 22) THEN
        sign_name := 'Cancer';
        sign_element := 'water';
    ELSIF (month_num = 7 AND day_num >= 23) OR (month_num = 8 AND day_num <= 22) THEN
        sign_name := 'Leo';
        sign_element := 'fire';
    ELSIF (month_num = 8 AND day_num >= 23) OR (month_num = 9 AND day_num <= 22) THEN
        sign_name := 'Virgo';
        sign_element := 'earth';
    ELSIF (month_num = 9 AND day_num >= 23) OR (month_num = 10 AND day_num <= 22) THEN
        sign_name := 'Libra';
        sign_element := 'air';
    ELSIF (month_num = 10 AND day_num >= 23) OR (month_num = 11 AND day_num <= 21) THEN
        sign_name := 'Scorpio';
        sign_element := 'water';
    ELSIF (month_num = 11 AND day_num >= 22) OR (month_num = 12 AND day_num <= 21) THEN
        sign_name := 'Sagittarius';
        sign_element := 'fire';
    ELSIF (month_num = 12 AND day_num >= 22) OR (month_num = 1 AND day_num <= 19) THEN
        sign_name := 'Capricorn';
        sign_element := 'earth';
    ELSIF (month_num = 1 AND day_num >= 20) OR (month_num = 2 AND day_num <= 18) THEN
        sign_name := 'Aquarius';
        sign_element := 'air';
    ELSE
        sign_name := 'Pisces';
        sign_element := 'water';
    END IF;
    
    RETURN jsonb_build_object('sign', sign_name, 'element', sign_element);
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate astrological influence score
CREATE OR REPLACE FUNCTION public.calculate_astro_influence(
    points INTEGER,
    assists INTEGER,
    rebounds INTEGER,
    steals INTEGER,
    blocks INTEGER,
    turnovers INTEGER,
    field_goal_pct DECIMAL(5,1),
    free_throw_pct DECIMAL(5,1),
    zodiac_element TEXT
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    element_multipliers JSONB;
    score DECIMAL(10,2);
BEGIN
    -- Default multipliers (neutral)
    element_multipliers := '{"fire": {"points": 1.2, "assists": 0.8, "rebounds": 0.9, "steals": 1.1, "blocks": 1.0},
                            "earth": {"points": 0.9, "assists": 1.0, "rebounds": 1.2, "steals": 0.9, "blocks": 1.1},
                            "air": {"points": 1.0, "assists": 1.3, "rebounds": 0.8, "steals": 1.2, "blocks": 0.8},
                            "water": {"points": 1.1, "assists": 1.1, "rebounds": 1.0, "steals": 0.8, "blocks": 1.2}}';
    
    -- Get multipliers for the player's element (default to neutral if element is null)
    IF zodiac_element IS NULL OR NOT element_multipliers ? zodiac_element THEN
        zodiac_element := 'fire'; -- Default to fire if element is invalid
    END IF;
    
    -- Calculate score with element multipliers
    score := (
        (COALESCE(points, 0) * (element_multipliers->zodiac_element->>'points')::DECIMAL) +
        (COALESCE(assists, 0) * (element_multipliers->zodiac_element->>'assists')::DECIMAL) +
        (COALESCE(rebounds, 0) * (element_multipliers->zodiac_element->>'rebounds')::DECIMAL) +
        (COALESCE(steals, 0) * (element_multipliers->zodiac_element->>'steals')::DECIMAL) +
        (COALESCE(blocks, 0) * (element_multipliers->zodiac_element->>'blocks')::DECIMAL) -
        (COALESCE(turnovers, 0) * 1.5) +
        (COALESCE(field_goal_pct, 0) * 0.5) +
        (COALESCE(free_throw_pct, 0) * 0.3)
    ) / 5;
    
    -- Ensure score is between 0 and 100
    RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql;
