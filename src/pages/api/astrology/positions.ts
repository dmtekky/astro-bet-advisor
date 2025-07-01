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
    
    console.log('[API] Response structure keys:', Object.keys(astroChartData));
    console.log('[API] Cusps in response:', astroChartData.cusps);
    
    // Minimal validation: ensure cusps array exists and is valid
    if (!astroChartData.cusps || !Array.isArray(astroChartData.cusps) || astroChartData.cusps.length !== 12) {
      console.error('API ERROR: Invalid or missing cusps in astroChartData:', astroChartData.cusps);
      return res.status(500).json({ error: 'Failed to calculate house cusps' });
    }

    // Log the final response being sent
    console.log('FINAL API RESPONSE:', JSON.stringify(astroChartData, null, 2));
    
    // Save the full astroChartData to Supabase
    const { data, error }: PostgrestSingleResponse<any> = await supabase.from('astrology_data').insert([astroChartData]);
    if (error) {
      console.error('Supabase insert error:', error);
      // Continue even if Supabase insert fails - we'll still return the data to the frontend
    }
    
    // Create the response object with the structure that the frontend expects
    const responseObject = {
      // Include top-level cusps for direct access
      cusps: astroChartData.cusps,
      // Include the full astroChartData object
      astroChartData: astroChartData,
      // Include planets at the top level for compatibility
      planets: astroChartData.planets,
      // Include houses at the top level for compatibility
      houses: astroChartData.houses,
      // Include the Supabase ID if available
      id: data && Array.isArray(data) && data.length > 0 && data[0] !== null && 'id' in data[0] ? data[0].id : null
    };
    
    // Add detailed logging of the API response
    console.log('API RESPONSE STRUCTURE KEYS:', Object.keys(responseObject));
    console.log('API RESPONSE CUSPS:', responseObject.cusps);
    console.log('API RESPONSE ASTROCHARTDATA KEYS:', Object.keys(responseObject.astroChartData));
    console.log('API RESPONSE ASTROCHARTDATA.CUSPS:', responseObject.astroChartData.cusps);
    
    // Return the response
    return res.status(200).json(responseObject);
  } catch (error) {
    console.error('Error calculating positions:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
