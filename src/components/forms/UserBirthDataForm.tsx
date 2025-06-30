import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { calculatePlanetaryCounts, processPlanetsPerSign, countsToArray } from '@/components/astrology/utils/chartUtils';
import cities from '@/data/cities-clean.json';
import { useEffect, useMemo } from 'react';

interface UserBirthDataFormProps {
  userId: string;
  onSuccess?: (userData: any) => void;
  defaultValues?: {
    birthDate?: string;
    birthTime?: string;
    birthCity?: string;
    timeUnknown?: boolean;
    birthLatitude?: number;
    birthLongitude?: number;
  };
}

const UserBirthDataForm: React.FC<UserBirthDataFormProps> = ({ 
  userId,
  onSuccess,
  defaultValues = {}
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    birthDate: defaultValues?.birthDate || '',
    birthTime: defaultValues?.birthTime || '',
    birthCity: defaultValues?.birthCity || ''
  });
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [timeUnknown, setTimeUnknown] = useState(defaultValues?.timeUnknown || false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [cityError, setCityError] = useState<string | null>(null);

  // Memoize city data for fast lookup
  const cityData = cities;

  // Find city by name (case insensitive)
  const findCityData = (cityName: string) => {
    return cityData.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  };

  // Suggest cities as user types
  useEffect(() => {
    if (formData.birthCity.length > 0) {
      const searchTerm = formData.birthCity.toLowerCase();
      const filtered = cityData
        .filter(city => 
          city.name.toLowerCase().includes(searchTerm) ||
          (city.admin1 && city.admin1.toLowerCase().includes(searchTerm))
        );

      // De-duplicate the suggestions to prevent key errors
      const uniqueSuggestions: any[] = [];
      const seen = new Set();
      for (const city of filtered) {
        const key = `${city.name}-${city.admin1}`; // Use a consistent key for de-duplication
        if (!seen.has(key)) {
          uniqueSuggestions.push(city);
          seen.add(key);
        }
      }
      setCitySuggestions(uniqueSuggestions.slice(0, 8)); // Show a limited number of unique suggestions
    } else {
      setCitySuggestions([]);
    }
  }, [formData.birthCity, cityData]);

  // Validate city on blur or submit
  const validateCity = (cityName: string) => {
    if (!cityName) {
      setCityError('Please enter a city');
      return false;
    }
    
    const found = findCityData(cityName);
    if (!found) {
      setCityError('Please select a valid city from the suggestions.');
      return false;
    }
    setCityError(null);
    return true;
  };
  
  // Handle city selection from dropdown
  const handleCitySelect = (city: any) => {
    setFormData(prev => ({ ...prev, birthCity: city.name }));
    setSelectedCity(city); // Store the full city object with coordinates
    setCityError(null);
    setCitySuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  useEffect(() => {
    if (defaultValues?.birthCity) {
      const city = findCityData(defaultValues.birthCity);
      if (city) {
        setSelectedCity(city);
        validateCity(defaultValues.birthCity);
      }
    }
  }, [defaultValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Check if a city has been selected
    if (!selectedCity) {
      setCityError('Please select a valid city from the suggestions.');
      setIsLoading(false);
      return;
    }

    try {
      // Validate required fields
      if (!formData.birthDate) {
        throw new Error('Birth date is required');
      }

      // Transform birth data into the format expected by the API
      const [year, month, day] = formData.birthDate.split('-').map(Number);
      let hour = 12, minute = 0; // Default to noon if time is unknown

      if (!timeUnknown && formData.birthTime) {
        const [hourStr, minuteStr] = formData.birthTime.split(':');
        hour = parseInt(hourStr, 10);
        minute = parseInt(minuteStr, 10) || 0;
      }

      const apiData = {
        year,
        month,
        day,
        hour,
        minute,
        city: formData.birthCity,
        latitude: parseFloat(selectedCity.lat),
        longitude: parseFloat(selectedCity.lng)
      };
      
      console.log('Calling astrology API with data:', apiData);
      
      // Call the astrology API
      const positionsResponse = await fetch('/api/astrology/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });
      
      if (!positionsResponse.ok) {
        throw new Error('Failed to fetch planetary positions');
      }
      
      const planetaryData = await positionsResponse.json();
      console.log('Received planetary data:', planetaryData);

      // Calculate derived astrological data
      const planetsPerSign = processPlanetsPerSign(planetaryData);
      const planetaryCounts = countsToArray(calculatePlanetaryCounts(planetaryData));
      console.log('Calculated planets per sign:', planetsPerSign);
      console.log('Calculated planetary counts:', planetaryCounts);

      // Save birth data to the database using the supabase client
      const { data, error } = await supabase.from('user_data').upsert({
        id: userId,
        birth_date: formData.birthDate,
        birth_time: timeUnknown ? null : formData.birthTime,
        birth_city: formData.birthCity,
        planetary_data: planetaryData,
        planets_per_sign: planetsPerSign,
        planetary_count: planetaryCounts,
        birth_latitude: parseFloat(selectedCity.lat),
        birth_longitude: parseFloat(selectedCity.lng),
        time_unknown: timeUnknown
      });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to save user data');
      }

      if (onSuccess) {
        // Simply signal success; the parent page will re-fetch.
        onSuccess(data);
      }

      toast({
        title: "Success!",
        description: "Your birth data has been saved.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error saving user data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Birth Details</CardTitle>
        <CardDescription className="text-sm">
          For your personalized astrological profile
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birthDate">Birth Date</Label>
            <Input 
              id="birthDate" 
              name="birthDate" 
              type="date" 
              value={formData.birthDate} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthTime">Birth Time</Label>
            <Input 
              id="birthTime" 
              name="birthTime" 
              type="time" 
              value={formData.birthTime} 
              onChange={handleInputChange} 
              disabled={timeUnknown} 
            />
            <div className="flex items-center gap-2 mt-1">
              <Switch 
                id="timeUnknown" 
                checked={timeUnknown} 
                onCheckedChange={setTimeUnknown} 
              />
              <Label htmlFor="timeUnknown" className="text-xs">Time unknown</Label>
            </div>
          </div>
                    <div className="space-y-2 relative">
              <Label htmlFor="birthCity">Birth City</Label>
              <div className="relative">
                <div className="relative">
                  <Input 
                    id="birthCity" 
                    name="birthCity" 
                    placeholder="Start typing city or state..."
                    autoComplete="off"
                    value={formData.birthCity}
                    onChange={e => setFormData(f => ({ ...f, birthCity: e.target.value }))}
                    onBlur={() => {
                      // Small delay to allow click on suggestions
                      setTimeout(() => {
                        validateCity(formData.birthCity);
                        setCitySuggestions([]);
                      }, 200);
                    }}
                    aria-autocomplete="list"
                    aria-describedby="cityHelp"
                    className="w-full pr-8"
                    required
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {cityError && (
                  <div className="text-red-500 text-xs mt-1">{cityError}</div>
                )}
                
                {citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.map((city) => {
                      // Create a unique key using all identifying information
                      // Ensure lat/lng are numbers before calling toFixed
                      const lat = typeof city.lat === 'string' ? parseFloat(city.lat) : (typeof city.lat === 'number' ? city.lat : 0);
                      const lng = typeof city.lng === 'string' ? parseFloat(city.lng) : (typeof city.lng === 'number' ? city.lng : 0);
                      const uniqueKey = `${city.name}-${city.admin1}-${lat.toFixed(4)}-${lng.toFixed(4)}`;
                      return (
                        <div
                          key={uniqueKey}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCitySelect(city);
                          }}
                        >
                          <div className="font-medium">{city.name}, {city.admin1}</div>
                          <div className="text-xs text-slate-500">{city.country}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div id="cityHelp" className="text-xs text-slate-500 mt-1">
                Start typing a city or state name and select from the suggestions
              </div>
            </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Generate Chart'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default UserBirthDataForm;
