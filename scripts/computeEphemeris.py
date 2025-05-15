
#!/usr/bin/env python3
"""
computeEphemeris.py - Generate astronomical ephemeris data for 2025
and store it in Supabase for use in sports betting astrological calculations.

This script uses Swiss Ephemeris (pyswisseph) to calculate:
- Moon phases
- Zodiac signs for celestial bodies (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn)
- Mercury retrograde status
- Major aspects (Sun-Mars, Sun-Saturn, Sun-Jupiter transits)

Data is stored in the Supabase 'ephemeris' table for later use.
"""

import swisseph as swe
import datetime
import math
import json
import os
from supabase import create_client

# Supabase configuration
SUPABASE_URL = "https://awoxkynorbspcrrggbca.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjQzMzQsImV4cCI6MjA2Mjg0MDMzNH0.jiJnx4z9jMFQcBNg1pLtuQAgnKxykqyLWSwQ4KHbhE4"

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Swiss Ephemeris
swe.set_ephe_path('/usr/share/ephe')  # Path to ephemeris files, adjust as needed

# Constants
YEAR = 2025
ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", 
    "Leo", "Virgo", "Libra", "Scorpio", 
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

# Planet constants
SUN = swe.SUN
MOON = swe.MOON
MERCURY = swe.MERCURY
VENUS = swe.VENUS
MARS = swe.MARS
JUPITER = swe.JUPITER
SATURN = swe.SATURN

# Aspect orbs (in degrees)
CONJUNCTION_ORB = 8.0
OPPOSITION_ORB = 8.0
TRINE_ORB = 8.0
SQUARE_ORB = 7.0
SEXTILE_ORB = 6.0

def get_julday(year, month, day):
    """Convert calendar date to Julian day."""
    return swe.julday(year, month, day, 0.0)

def get_moon_phase(jd):
    """Calculate moon phase (0-1) for given Julian day."""
    sun_pos = swe.calc_ut(jd, SUN)[0]
    moon_pos = swe.calc_ut(jd, MOON)[0]
    
    # Calculate phase angle
    phase_angle = (moon_pos - sun_pos) % 360
    
    # Convert to 0-1 range (0 = new moon, 0.5 = full moon)
    phase = phase_angle / 360.0
    
    return phase

def get_zodiac_sign(longitude):
    """Convert ecliptic longitude to zodiac sign."""
    sign_index = int(longitude / 30) % 12
    return ZODIAC_SIGNS[sign_index]

def is_retrograde(planet, jd):
    """Check if a planet is retrograde on given Julian day."""
    # Get planet's speed
    planet_info = swe.calc_ut(jd, planet)
    speed = planet_info[3]  # Longitudinal speed
    
    # If speed is negative, the planet is retrograde
    return speed < 0

def calculate_aspects(jd):
    """Calculate major aspects between planets on given Julian day."""
    # Get positions
    sun_pos = swe.calc_ut(jd, SUN)[0]
    mars_pos = swe.calc_ut(jd, MARS)[0]
    saturn_pos = swe.calc_ut(jd, SATURN)[0]
    jupiter_pos = swe.calc_ut(jd, JUPITER)[0]
    
    aspects = {
        "sun_mars": check_aspect(sun_pos, mars_pos),
        "sun_saturn": check_aspect(sun_pos, saturn_pos),
        "sun_jupiter": check_aspect(sun_pos, jupiter_pos)
    }
    
    return aspects

def check_aspect(pos1, pos2):
    """Check for aspects between two celestial positions."""
    # Calculate the angular difference
    diff = abs((pos1 - pos2 + 180) % 360 - 180)
    
    # Check for each aspect type
    if diff < CONJUNCTION_ORB:
        return "conjunction"
    elif abs(diff - 180) < OPPOSITION_ORB:
        return "opposition"
    elif abs(diff - 120) < TRINE_ORB:
        return "trine"
    elif abs(diff - 90) < SQUARE_ORB:
        return "square"
    elif abs(diff - 60) < SEXTILE_ORB:
        return "sextile"
    else:
        return None

def generate_ephemeris_for_year(year):
    """Generate ephemeris data for entire year."""
    start_date = datetime.date(year, 1, 1)
    end_date = datetime.date(year, 12, 31)
    current_date = start_date
    
    ephemeris_data = []
    
    print(f"Generating ephemeris data for {year}...")
    
    while current_date <= end_date:
        print(f"Processing {current_date.isoformat()}...")
        
        jd = get_julday(current_date.year, current_date.month, current_date.day)
        
        # Get planetary positions
        sun_pos = swe.calc_ut(jd, SUN)[0]
        moon_pos = swe.calc_ut(jd, MOON)[0]
        mercury_pos = swe.calc_ut(jd, MERCURY)[0]
        venus_pos = swe.calc_ut(jd, VENUS)[0]
        mars_pos = swe.calc_ut(jd, MARS)[0]
        jupiter_pos = swe.calc_ut(jd, JUPITER)[0]
        saturn_pos = swe.calc_ut(jd, SATURN)[0]
        
        # Calculate moon phase and aspects
        moon_phase = get_moon_phase(jd)
        aspects = calculate_aspects(jd)
        
        # Check for Mercury retrograde
        mercury_retrograde = is_retrograde(MERCURY, jd)
        
        # Create daily record
        daily_data = {
            "date": current_date.isoformat(),
            "moon_phase": moon_phase,
            "moon_sign": get_zodiac_sign(moon_pos),
            "sun_sign": get_zodiac_sign(sun_pos),
            "mercury_sign": get_zodiac_sign(mercury_pos),
            "venus_sign": get_zodiac_sign(venus_pos),
            "mars_sign": get_zodiac_sign(mars_pos),
            "jupiter_sign": get_zodiac_sign(jupiter_pos),
            "saturn_sign": get_zodiac_sign(saturn_pos),
            "mercury_retrograde": mercury_retrograde,
            "aspects": aspects
        }
        
        ephemeris_data.append(daily_data)
        current_date += datetime.timedelta(days=1)
    
    return ephemeris_data

def store_in_supabase(ephemeris_data):
    """Store ephemeris data in Supabase."""
    print(f"Storing {len(ephemeris_data)} records in Supabase...")
    
    for data in ephemeris_data:
        # Format aspects as JSONB
        aspects_json = json.dumps(data["aspects"])
        
        # Insert into Supabase
        try:
            response = supabase.table("ephemeris").insert({
                "date": data["date"],
                "moon_phase": data["moon_phase"],
                "moon_sign": data["moon_sign"],
                "sun_sign": data["sun_sign"],
                "mercury_sign": data["mercury_sign"],
                "venus_sign": data["venus_sign"],
                "mars_sign": data["mars_sign"],
                "jupiter_sign": data["jupiter_sign"],
                "saturn_sign": data["saturn_sign"],
                "mercury_retrograde": data["mercury_retrograde"],
                "aspects": data["aspects"]
            }).execute()
            
            # Check for errors
            if hasattr(response, 'error') and response.error:
                print(f"Error storing data for {data['date']}: {response.error}")
            else:
                print(f"Successfully stored data for {data['date']}")
                
        except Exception as e:
            print(f"Exception storing data for {data['date']}: {e}")
    
    print("Finished storing ephemeris data.")

def main():
    """Main execution function."""
    try:
        # Generate ephemeris data for 2025
        ephemeris_data = generate_ephemeris_for_year(YEAR)
        
        # Store in Supabase
        store_in_supabase(ephemeris_data)
        
        print(f"Successfully generated and stored ephemeris data for {YEAR}.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close Swiss Ephemeris
        swe.close()

if __name__ == "__main__":
    main()
