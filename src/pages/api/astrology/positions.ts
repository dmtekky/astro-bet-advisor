import type { NextApiRequest, NextApiResponse } from 'next';
import { calculatePlanetaryPositions } from '@/lib/astroCalculations';
import { createClient, PostgrestSingleResponse } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key is not defined');
}
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const birthData = req.body;
    console.log('API received birth data:', birthData);

    // Enforce timezoneOffset presence for accuracy
    if (typeof birthData.timezoneOffset !== 'number') {
      console.warn('Missing timezoneOffset in birth data. Rejecting request for accuracy.');
      return res.status(400).json({ error: 'timezoneOffset (minutes from UTC) is required for accurate planetary calculations.' });
    }
    
    // Validate birth data with detailed error messages
    const missingFields: string[] = [];
    
    if (!birthData) {
      return res.status(400).json({ error: 'No birth data provided' });
    }
    
    if (!birthData.year) missingFields.push('year');
    if (!birthData.month) missingFields.push('month');
    if (!birthData.day) missingFields.push('day');
    if (!birthData.hour && birthData.hour !== 0) missingFields.push('hour');
    if (!birthData.minute && birthData.minute !== 0) missingFields.push('minute');
    if (!birthData.latitude && birthData.latitude !== 0) missingFields.push('latitude');
    if (!birthData.longitude && birthData.longitude !== 0) missingFields.push('longitude');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Invalid birth data: missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Type validation
    if (typeof birthData.year !== 'number' || 
        typeof birthData.month !== 'number' || 
        typeof birthData.day !== 'number' || 
        typeof birthData.hour !== 'number' || 
        typeof birthData.minute !== 'number' || 
        typeof birthData.latitude !== 'number' || 
        typeof birthData.longitude !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid birth data: all fields must be numbers' 
      });
    }
    
    // Calculate all astrology data (planets, cusps, aspects, etc)
    const astroChartData = await calculatePlanetaryPositions(birthData);

    // Minimal validation: ensure cusps array exists and is valid
    if (!astroChartData.cusps || !Array.isArray(astroChartData.cusps) || astroChartData.cusps.length !== 12) {
      console.error('API ERROR: Invalid or missing cusps in astroChartData:', astroChartData.cusps);
      return res.status(500).json({ error: 'Failed to calculate house cusps' });
    }

    // Log the final response being sent
    console.log('FINAL API RESPONSE:', JSON.stringify(astroChartData, null, 2));
    
    // Save the full astroChartData to Supabase and return the ID
    const { data, error }: PostgrestSingleResponse<any> = await supabase.from('astrology_data').insert([astroChartData]);
    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save data to Supabase' });
    }
    if (data && Array.isArray(data) && data.length > 0 && data[0] !== null && 'id' in data[0]) {
      return res.status(200).json({ success: true, id: data[0].id });
    } else {
      console.error('No data or ID returned from Supabase insert');
      return res.status(500).json({ error: 'Failed to retrieve inserted ID' });
    }
  } catch (error) {
    console.error('Error calculating positions:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
