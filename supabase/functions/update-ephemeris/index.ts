
// update-ephemeris edge function
// This function serves as an API endpoint to trigger ephemeris calculation
// It can be called manually or scheduled to run daily

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get request data
    const { date } = await req.json()
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    console.log(`Processing ephemeris data for date: ${targetDate}`)
    
    // Check if ephemeris already exists for this date
    const { data: existingData, error: checkError } = await supabase
      .from("ephemeris")
      .select("id")
      .eq("date", targetDate)
      .maybeSingle()
    
    if (checkError) {
      throw new Error(`Error checking ephemeris: ${checkError.message}`)
    }
    
    if (existingData) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Ephemeris data for ${targetDate} already exists` 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }
    
    // In a real implementation, you would call an external service or use a library
    // to calculate the ephemeris data. For this example, we'll generate mock data.
    const mockEphemerisData = generateMockEphemeris(targetDate)
    
    // Store the data in Supabase
    const { data, error } = await supabase
      .from("ephemeris")
      .insert(mockEphemerisData)
      .select()
    
    if (error) {
      throw new Error(`Error storing ephemeris data: ${error.message}`)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Ephemeris data generated for ${targetDate}`,
        data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error(`Error in update-ephemeris function: ${error.message}`)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})

// Generate mock ephemeris data for demonstration
// In a real implementation, this would use an astronomy library
function generateMockEphemeris(date: string) {
  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", 
    "Leo", "Virgo", "Libra", "Scorpio", 
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ]
  
  const aspectTypes = ["conjunction", "opposition", "trine", "square", "sextile", null]
  
  // Use the date string to generate consistent "random" values
  const dateValue = new Date(date).getTime()
  const seedValue = dateValue % 1000000
  
  // Simple pseudo-random function
  const pseudoRandom = (seed: number, max: number) => {
    const a = 1664525
    const c = 1013904223
    const m = Math.pow(2, 32)
    const result = (a * seed + c) % m
    return (result / m) * max
  }
  
  // Get a zodiac sign based on seed
  const getSign = (seed: number) => {
    const index = Math.floor(pseudoRandom(seed, zodiacSigns.length))
    return zodiacSigns[index]
  }
  
  // Get an aspect based on seed
  const getAspect = (seed: number) => {
    const index = Math.floor(pseudoRandom(seed, aspectTypes.length))
    return aspectTypes[index]
  }
  
  // Generate moon phase (0-1) based on date
  const moonPhase = (pseudoRandom(seedValue, 100) % 100) / 100
  
  // Determine Mercury retrograde roughly 3 times a year, ~3 weeks each
  const mercuryRetrograde = pseudoRandom(seedValue + 500, 100) < 20 // ~20% of days
  
  return {
    date,
    moon_phase: moonPhase,
    moon_sign: getSign(seedValue + 1),
    mercury_sign: getSign(seedValue + 2),
    venus_sign: getSign(seedValue + 3),
    mars_sign: getSign(seedValue + 4),
    jupiter_sign: getSign(seedValue + 5),
    saturn_sign: getSign(seedValue + 6),
    sun_sign: getSign(seedValue + 7),
    mercury_retrograde: mercuryRetrograde,
    aspects: {
      sun_mars: getAspect(seedValue + 8),
      sun_saturn: getAspect(seedValue + 9),
      sun_jupiter: getAspect(seedValue + 10)
    }
  }
}
