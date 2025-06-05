import os
import base64
import httpx
import asyncio
import json
from dotenv import load_dotenv

load_dotenv()

MSF_API_KEY = os.getenv("MY_SPORTS_FEEDS_API_KEY")
TEAM_ABBR = "DAL"
PLAYER_FIRST = "kyrie"
PLAYER_LAST = "irving"

async def main():
    url = "https://api.mysportsfeeds.com/v2.1/pull/nba/players.json"
    auth = base64.b64encode(f"{MSF_API_KEY}:MYSPORTSFEEDS".encode()).decode()
    headers = {
        "Accept": "application/json",
        "Authorization": f"Basic {auth}"
    }
    params = {"season": "current", "team": TEAM_ABBR, "limit": 100}
    async with httpx.AsyncClient() as c:
        r = await c.get(url, headers=headers, params=params)
        r.raise_for_status()
        data = r.json()
        for p in data.get('players', []):
            pf = p['player']['firstName'].lower()
            pl = p['player']['lastName'].lower()
            if PLAYER_FIRST in pf and PLAYER_LAST in pl:
                print(json.dumps(p, indent=2))
                return
        print('Not found')

if __name__ == "__main__":
    asyncio.run(main())
