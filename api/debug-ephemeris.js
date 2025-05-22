// Debug Swiss Ephemeris setup
import swisseph from 'swisseph';

// Check Swiss Ephemeris installation
console.log('Swiss Ephemeris version:', swisseph.swe_version());

// Default ephemeris path
console.log('Default ephemeris path:', swisseph.swe_get_ephe_path());

// Try calculating a simple planetary position
const julianDay = swisseph.swe_julday(2025, 5, 22, 12, swisseph.SE_GREG_CAL);
console.log('Julian Day for May 22, 2025:', julianDay);

// Calculate Sun position (tropical)
swisseph.swe_calc_ut(julianDay, swisseph.SE_SUN, swisseph.SEFLG_SPEED, (err, body) => {
  if (err) {
    console.error('Error calculating Sun position:', err);
  } else {
    console.log('Sun position (tropical):', body);
  }
});

// Calculate Sun position (sidereal)
swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
swisseph.swe_calc_ut(
  julianDay, 
  swisseph.SE_SUN, 
  swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED, 
  (err, body) => {
    if (err) {
      console.error('Error calculating Sun position (sidereal):', err);
    } else {
      console.log('Sun position (sidereal):', body);
    }
  }
);
