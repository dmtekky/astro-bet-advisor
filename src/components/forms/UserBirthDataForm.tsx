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

interface UserBirthDataFormProps {
  onSuccess?: (userData: any) => void;
  defaultValues?: {
    name?: string;
    email?: string;
    birthDate?: string;
    birthTime?: string;
    birthCity?: string;
    timeUnknown?: boolean;
    favoriteSports?: string[];
  };
}

const UserBirthDataForm: React.FC<UserBirthDataFormProps> = ({ 
  onSuccess,
  defaultValues = {}
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: defaultValues.name || '',
    email: defaultValues.email || '',
    birthDate: defaultValues.birthDate || '',
    birthTime: defaultValues.birthTime || '',
    birthCity: defaultValues.birthCity || '',
    timeUnknown: defaultValues.timeUnknown || false,
    favoriteSports: defaultValues.favoriteSports || []
  });

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
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

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

      // Format data for Supabase with planetary data and counts included
      const userUpdateData = {
        id: user.id, // Include the user ID for upsert
        name: formData.name,
        email: formData.email,
        birth_date: formData.birthDate,
        birth_time: formData.timeUnknown ? null : formData.birthTime,
        birth_city: formData.birthCity,
        time_unknown: formData.timeUnknown,
        favorite_sports: formData.favoriteSports,
        planetary_data: planetaryData,
        planetary_count: planetaryCounts,
        updated_at: new Date().toISOString()
      };

      // Upsert the user data - will update if user already exists
      const upsertResponse = await customSupabase.userData.upsert(userUpdateData);

      if (upsertResponse.error) {
        console.error('Supabase error:', upsertResponse.error);
        throw new Error(upsertResponse.error.message || 'Failed to save user data');
      }
      
      const savedData = upsertResponse.data;

      toast({
        title: "Success!",
        description: "Your birth data has been saved.",
        variant: "default",
      });

      // Call onSuccess callback if provided
      if (onSuccess && savedData) {
        onSuccess(savedData);
      }
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

  // No longer need a separate function to fetch and save astrology data
  // as it's now handled directly in the handleSubmit function

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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Your email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
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
            <div className="flex items-center justify-between">
              <Label htmlFor="birthTime">Birth Time</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="timeUnknown" className="text-sm text-muted-foreground">
                  Time unknown
                </Label>
                <Switch
                  id="timeUnknown"
                  name="timeUnknown"
                  checked={formData.timeUnknown}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, timeUnknown: checked }))
                  }
                />
              </div>
            </div>
            <Input
              id="birthTime"
              name="birthTime"
              type="time"
              value={formData.birthTime}
              onChange={handleInputChange}
              disabled={formData.timeUnknown}
              required={!formData.timeUnknown}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthCity">Birth City</Label>
            <Input
              id="birthCity"
              name="birthCity"
              placeholder="City, Country"
              value={formData.birthCity}
              onChange={handleInputChange}
              required
            />
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
