-- Query to count teams by league
SELECT league, COUNT(*) as team_count 
FROM teams 
GROUP BY league;
