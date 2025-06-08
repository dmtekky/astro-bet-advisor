import React, { useEffect, useState } from 'react';
import { AstroData, Player } from '../types/app.types';
import { fetchLatestAstrologicalData, AstrologicalData } from '../lib/supabase';

interface AstroPeakDayProps {
  player: Player;
  astro: AstroData | null;
}

export const AstroPeakDay: React.FC<AstroPeakDayProps> = ({ player, astro }) => {
  const [todayAstro, setTodayAstro] = useState<AstrologicalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestAstrologicalData().then((data) => {
      setTodayAstro(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-gray-700">Loading astrological conditions...</p>;
  }

  if (!astro || !todayAstro) {
    return (
      <p className="text-gray-700">
        {player.full_name} has a {astro?.sunSign.sign || '—'} sun and {astro?.moonSign.sign || '—'} moon, suggesting their best performances occur when these signs are harmoniously aspected with game day planetary positions. Their natural {astro?.sunSign.element?.toLowerCase() || ''} and {astro?.moonSign.element?.toLowerCase() || ''} qualities align with their baseball instincts, supporting consistency and impact on the field.
      </p>
    );
  }

  // Get today's Sun and Moon sign
  let todaySunSign = '';
  let todayMoonSign = todayAstro.moon_sign || '';
  if (todayAstro.planetary_signs && typeof todayAstro.planetary_signs === 'object' && !Array.isArray(todayAstro.planetary_signs)) {
    // Safely access the sun_sign property with type assertion
    const planetarySigns = todayAstro.planetary_signs as Record<string, any>;
    todaySunSign = planetarySigns.sun_sign || '';
  }

  const isSunPeak = todaySunSign && astro.sunSign.sign === todaySunSign;
  const isMoonPeak = todayMoonSign && astro.moonSign.sign === todayMoonSign;

  let outcome = '';
  if (isSunPeak && isMoonPeak) {
    outcome = `Today is a peak astrological day for ${player.full_name}: Both the Sun and Moon are in their natal signs (${astro.sunSign.sign} and ${astro.moonSign.sign}). This alignment strongly supports performance, confidence, and instinct.`;
  } else if (isSunPeak) {
    outcome = `Today is a strong day for ${player.full_name}: The Sun is in ${astro.sunSign.sign}, boosting energy and confidence.`;
  } else if (isMoonPeak) {
    outcome = `Today is a strong day for ${player.full_name}: The Moon is in ${astro.moonSign.sign}, enhancing instincts and emotional flow.`;
  } else {
    outcome = `${player.full_name} has a ${astro.sunSign.sign} sun and ${astro.moonSign.sign} moon. Their best performances tend to occur when these signs are harmoniously aspected with game day planetary positions. Their natural ${astro.sunSign.element.toLowerCase()} and ${astro.moonSign.element.toLowerCase()} qualities align with their baseball instincts, supporting consistency and impact on the field.`;
  }

  return <p className="text-gray-700">{outcome}</p>;
};

export default AstroPeakDay;
