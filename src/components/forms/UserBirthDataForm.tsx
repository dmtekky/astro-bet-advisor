import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { customSupabase } from '@/lib/custom-supabase';
import { supabase } from '@/lib/supabase';
import { calculatePlanetaryCounts } from '@/lib/astrologyUtils';
import cities from '@/data/cities.json';
import { useEffect, useMemo } from 'react';

interface UserBirthDataFormProps {
  onSuccess?: (userData: any) => void;
  defaultValues?: {
    birthDate?: string;
    birthTime?: string;
    birthCity?: string;
    timeUnknown?: boolean;
    birthLatitude?: number | null;
    birthLongitude?: number | null;
  };
}

const UserBirthDataForm: React.FC<UserBirthDataFormProps> = ({ 
  onSuccess,
  defaultValues = {}
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    birthDate: defaultValues?.birthDate || '',
    birthTime: defaultValues?.birthTime || '',
    birthCity: defaultValues?.birthCity || '',
    timeUnknown: defaultValues?.timeUnknown || false,
    birthLatitude: defaultValues?.birthLatitude || null,
    birthLongitude: defaultValues?.birthLongitude || null
  });
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [cityError, setCityError] = useState<string | null>(null);
  const [cityTouched, setCityTouched] = useState(false);

  // Memoize city data for fast lookup
  const cityData = useMemo(() => cities, []);

  // Find city by name (case insensitive)
  const findCityData = (cityName: string) => {
    return cityData.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  };

  // Get display name for city (City, State)
  const getCityDisplayName = (cityName: string) => {
    const city = findCityData(cityName);
    return city ? `${city.name}, ${city.admin1}` : cityName;
  };

  // Suggest cities as user types
  useEffect(() => {
    if (formData.birthCity.length > 0) {
      const searchTerm = formData.birthCity.toLowerCase();
      const filtered = cityData
        .filter(city => 
          city.name.toLowerCase().includes(searchTerm) ||
          (city.admin1 && city.admin1.toLowerCase().includes(searchTerm))
        )
        .slice(0, 8);
      setCitySuggestions(filtered);
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
    const newFormData = {
      ...formData,
      birthCity: city.name,
      birthLatitude: parseFloat(city.lat),
      birthLongitude: parseFloat(city.lng)
    };
    
    setFormData(newFormData);
    setCityTouched(true);
    setCityError(null);
    
    // Close the suggestions after selection
    setCitySuggestions([]);
    
    // Trigger validation
    validateCity(city.name);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate city before submission
      if (!validateCity(formData.birthCity)) {
        setCityTouched(true);
        setIsLoading(false);
        return;
      }
      // Set lat/lng from city
      const cityObj = cities.find((c: any) => c.name.toLowerCase() === formData.birthCity.toLowerCase());
      const submissionData = {
        birthDate: formData.birthDate,
        birthTime: formData.timeUnknown ? null : formData.birthTime,
        birthCity: formData.birthCity,
        birthLatitude: cityObj ? parseFloat(cityObj.lat) : null,
        birthLongitude: cityObj ? parseFloat(cityObj.lng) : null,
        timeUnknown: formData.timeUnknown
      };

      // Transform birth data into the format expected by the API
      const [year, month, day] = formData.birthDate.split('-').map(Number);
      let hour = 12, minute = 0; // Default to noon if time is unknown
      
      if (!formData.timeUnknown && formData.birthTime) {
        const [hourStr, minuteStr] = formData.birthTime.split(':');
        hour = parseInt(hourStr, 10);
        minute = parseInt(minuteStr, 10);
      }
      
      const apiData = {
        year,
        month,
        day,
        hour,
        minute,
        city: formData.birthCity
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

      // Calculate planetary counts
      const planetaryCounts = calculatePlanetaryCounts(planetaryData);
      console.log('Calculated planetary counts:', planetaryCounts);

      // Save birth data to the database using the customSupabase client
      const { data, error } = await customSupabase.userData.upsert({
        id: 'anonymous', // Use a default ID for unauthenticated users
        birth_date: formData.birthDate,
        birth_time: formData.timeUnknown ? null : formData.birthTime,
        birth_city: formData.birthCity,
        birth_latitude: cityObj ? parseFloat(cityObj.lat) : null,
        birth_longitude: cityObj ? parseFloat(cityObj.lng) : null,
        time_unknown: formData.timeUnknown,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to save user data');
      }

      if (onSuccess && data) {
        onSuccess({
          ...data,
          birthData: {
            birthDate: formData.birthDate,
            birthTime: formData.timeUnknown ? null : formData.birthTime,
            birthCity: formData.birthCity,
            timeUnknown: formData.timeUnknown,
            birthLatitude: formData.birthLatitude,
            birthLongitude: formData.birthLongitude
          }
        });
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
      <CardHeader>
        <CardTitle>Your Birth Information</CardTitle>
        <CardDescription>
          Enter your birth details to generate your personalized astrology chart
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
              disabled={formData.timeUnknown} 
            />
            <div className="flex items-center gap-2 mt-1">
              <Switch 
                id="timeUnknown" 
                checked={formData.timeUnknown} 
                onCheckedChange={(checked) => setFormData(f => ({ ...f, timeUnknown: checked }))} 
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
                    onChange={e => {
                      const value = e.target.value;
                      setFormData(f => ({ ...f, birthCity: value }));
                      setCityTouched(true);
                    }}
                    onFocus={() => setCityTouched(true)}
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
                
                {cityTouched && cityError && (
                  <div className="text-red-500 text-xs mt-1">{cityError}</div>
                )}
                
                {citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.map((city) => (
                      <div
                        key={`${city.name}-${city.admin1}`}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCitySelect(city);
                        }}
                      >
                        <div className="font-medium">{city.name}</div>
                        <div className="text-xs text-slate-500">{city.admin1}, {city.country}</div>
                      </div>
                    ))}
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
