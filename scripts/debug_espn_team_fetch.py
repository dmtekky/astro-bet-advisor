import requests
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

SPORTS = [
    ('basketball', 'nba'),
    ('football', 'nfl'),
    ('baseball', 'mlb'),
    ('hockey', 'nhl'),
]

for sport, league in SPORTS:
    url = f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams"
    logging.info(f"Fetching {league.upper()} teams from {url}")
    resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
    if resp.status_code == 200:
        data = resp.json()
        try:
            teams = data['sports'][0]['leagues'][0]['teams']
            logging.info(f"{league.upper()}: API returned {len(teams)} teams")
            for team in teams:
                team_obj = team.get('team', {})
                logging.info(f"  - {team_obj.get('displayName')} (ID: {team_obj.get('id')})")
        except Exception as e:
            logging.error(f"Error parsing {league.upper()} teams: {e}")
    else:
        logging.error(f"Failed to fetch {league.upper()} teams: HTTP {resp.status_code}")
