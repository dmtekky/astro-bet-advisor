
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
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Swiss Ephemeris
swe.set_ephe_path('./ephemeris')  # Path to ephemeris files, adjust as needed

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
    return swe.utc_to_jd(year, month, day, 0, 0, 0, swe.GREG_CAL)[1]

def get_moon_phase(jd):
    """Calculate moon phase (0-1) for given Julian day."""
    # Get positions
    sun_pos = swe.calc_ut(jd, SUN)
    moon_pos = swe.calc_ut(jd, MOON)
    
    print(f"Raw positions: sun={sun_pos}, moon={moon_pos}")
    
    # Extract position (first element of the first tuple)
    sun_pos = sun_pos[0][0]
    moon_pos = moon_pos[0][0]
    
    print(f"Extracted positions: sun={sun_pos}, moon={moon_pos}")
    
    # Convert to degrees
    sun_pos = math.degrees(sun_pos)
    moon_pos = math.degrees(moon_pos)
    
    print(f"Degrees positions: sun={sun_pos}, moon={moon_pos}")
    
    # Normalize to 0-360 degrees
    sun_pos = (sun_pos + 360) % 360
    moon_pos = (moon_pos + 360) % 360
    
    print(f"Normalized positions: sun={sun_pos}, moon={moon_pos}")
    
    # Calculate phase angle
    phase_angle = (moon_pos - sun_pos) % 360
    
    # Convert to 0-1 range (0 = new moon, 0.5 = full moon)
    phase = phase_angle / 360.0
    
    return phase

def get_zodiac_sign(longitude):
    """Convert ecliptic longitude to zodiac sign."""
    # Convert to degrees if needed
    if isinstance(longitude, tuple):
        longitude = longitude[0]  # Get the first element of the tuple
    if longitude < 180:
        longitude = math.degrees(longitude)
    
    # Normalize to 0-360 degrees
    longitude = (longitude + 360) % 360
    
    # Get zodiac sign
    sign_index = int(longitude / 30) % 12
    return ZODIAC_SIGNS[sign_index]

def is_retrograde(planet, jd):
    """Check if a planet is retrograde on given Julian day."""
    # Get planet's speed
    planet_info = swe.calc_ut(jd, planet)
    
    # Get the speed from the correct position in the tuple
    speed = planet_info[1][3]  # Speed is in the second element, 4th position
    
    # If speed is negative, the planet is retrograde
    return speed < 0

def calculate_aspects(jd):
    """Calculate major aspects between planets on given Julian day."""
    # Get positions
    sun_pos = swe.calc_ut(jd, SUN)
    mars_pos = swe.calc_ut(jd, MARS)
    saturn_pos = swe.calc_ut(jd, SATURN)
    jupiter_pos = swe.calc_ut(jd, JUPITER)
    
    print(f"Raw positions: sun={sun_pos}, mars={mars_pos}, saturn={saturn_pos}, jupiter={jupiter_pos}")
    
    # Extract position (first element of the first tuple)
    sun_pos = sun_pos[0][0]
    mars_pos = mars_pos[0][0]
    saturn_pos = saturn_pos[0][0]
    jupiter_pos = jupiter_pos[0][0]
    
    print(f"Extracted positions: sun={sun_pos}, mars={mars_pos}, saturn={saturn_pos}, jupiter={jupiter_pos}")
    
    # Convert to degrees if needed
    sun_pos = math.degrees(sun_pos)
    mars_pos = math.degrees(mars_pos)
    saturn_pos = math.degrees(saturn_pos)
    jupiter_pos = math.degrees(jupiter_pos)
    
    print(f"Degrees positions: sun={sun_pos}, mars={mars_pos}, saturn={saturn_pos}, jupiter={jupiter_pos}")
    
    # Normalize to 0-360 degrees
    sun_pos = (sun_pos + 360) % 360
    mars_pos = (mars_pos + 360) % 360
    saturn_pos = (saturn_pos + 360) % 360
    jupiter_pos = (jupiter_pos + 360) % 360
    
    print(f"Normalized positions: sun={sun_pos}, mars={mars_pos}, saturn={saturn_pos}, jupiter={jupiter_pos}")
    
    aspects = {
        "sun_mars": check_aspect(sun_pos, mars_pos),
        "sun_saturn": check_aspect(sun_pos, saturn_pos),
        "sun_jupiter": check_aspect(sun_pos, jupiter_pos)
    }
    
    return aspects

def check_aspect(pos1, pos2):
    """Check for aspects between two celestial positions."""
    # Convert to degrees if needed
    pos1 = math.degrees(pos1) if pos1 < 180 else pos1
    pos2 = math.degrees(pos2) if pos2 < 180 else pos2
    
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
        sun_pos = swe.calc_ut(jd, SUN)[0][0]
        moon_pos = swe.calc_ut(jd, MOON)[0][0]
        mercury_pos = swe.calc_ut(jd, MERCURY)[0][0]
        venus_pos = swe.calc_ut(jd, VENUS)[0][0]
        mars_pos = swe.calc_ut(jd, MARS)[0][0]
        jupiter_pos = swe.calc_ut(jd, JUPITER)[0][0]
        saturn_pos = swe.calc_ut(jd, SATURN)[0][0]
        
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
