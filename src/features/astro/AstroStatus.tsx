import { useEffect, useState } from 'react';
import { fetchLatestAstrologicalData, AstrologicalData } from '@/lib/supabase';

const eventList = [
  { key: 'moon_phase', label: 'Moon Phase' },
  { key: 'moon_sign', label: 'Moon Sign' },
  { key: 'mercury_sign', label: 'Mercury in Virgo' },
  { key: 'venus_sign', label: 'Venus in Gemini' },
  { key: 'mars_sign', label: 'Mars in Pisces' },
  { key: 'jupiter_sign', label: 'Jupiter in Cancer' },
  { key: 'mercury_retrograde', label: 'Mercury Retrograde' },
  { key: 'sun_mars_transit', label: 'Sun-Mars Transit' },
  { key: 'sun_saturn_transit', label: 'Sun-Saturn Transit' },
  { key: 'sun_jupiter_transit', label: 'Sun-Jupiter Transit' },
];

function getInfluence(key: string, data: AstrologicalData | null): number {
  // TODO: Replace with real calculation logic or use astroCalc/formula
  if (!data) return 0;
  if (typeof data[key as keyof AstrologicalData] === 'boolean') {
    return data[key as keyof AstrologicalData] ? 100 : 0;
  }
  // Placeholder: treat as 70% for demo
  return 70;
}

export default function AstroStatus() {
  const [data, setData] = useState<AstrologicalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestAstrologicalData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading astrological data...</div>;
  if (!data) return (
    <div>
      No astrological data found.<br />
      Please run <code>node scripts/computeEphemeris.js</code> to populate the database.
    </div>
  );

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="font-bold text-lg mb-4">Current Astrological Status</h2>
      <div className="space-y-3">
        {eventList.map(ev => (
          <div key={ev.key}>
            <div className="flex justify-between mb-1">
              <span>{ev.label}</span>
              <span>{getInfluence(ev.key, data)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-3">
              <div
                className={`h-3 rounded ${getInfluence(ev.key, data) > 66 ? 'bg-green-500' : getInfluence(ev.key, data) > 33 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${getInfluence(ev.key, data)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
