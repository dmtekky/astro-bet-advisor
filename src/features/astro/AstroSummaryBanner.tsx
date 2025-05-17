import { useEffect, useState } from 'react';
import { fetchLatestAstrologicalData } from '@/lib/supabase';

export default function AstroSummaryBanner() {
  const [summary, setSummary] = useState('');

  useEffect(() => {
    fetchLatestAstrologicalData().then((data) => {
      if (!data) return setSummary('No astrological summary available.');
      let msg = `Today: Moon in ${data.moon_sign}`;
      if (data.mercury_retrograde) msg += ' • Mercury Retrograde!';
      if (data.sun_mars_transit) msg += ` • Sun-Mars: ${data.sun_mars_transit}`;
      setSummary(msg);
    });
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white text-center py-2 font-semibold shadow">
      {summary}
    </div>
  );
}
