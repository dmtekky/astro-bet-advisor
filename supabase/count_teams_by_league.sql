-- Create a function to count teams by league
CREATE OR REPLACE FUNCTION public.count_teams_by_league()
RETURNS TABLE(league text, team_count bigint)
LANGUAGE sql
AS $$
  SELECT league, COUNT(*) as team_count 
  FROM teams 
  GROUP BY league;
$$;
