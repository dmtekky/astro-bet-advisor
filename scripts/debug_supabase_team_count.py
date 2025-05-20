import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

leagues = ['NBA', 'NFL', 'MLB', 'NHL']
for league in leagues:
    resp = supabase.table('teams').select('*').eq('league', league).execute()
    teams = resp.data if hasattr(resp, 'data') else resp
    print(f"{league}: {len(teams)} teams in Supabase")
    for team in teams:
        print(f"  - {team.get('name')} (ID: {team.get('espn_id')})")
