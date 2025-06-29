import { supabase } from '@/lib/supabase';
import { UserTest, UserAstrologyData, UserData } from '@/types/supabase-extensions';

/**
 * Custom Supabase helper for working with our custom tables.
 * This approach uses direct table access with proper error handling and type casting.
 */
export const customSupabase = {
  // Unified user data table operations
  userData: {
    /**
     * Get a user data record by ID
     */
    getById: async (id: string): Promise<UserData | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_data')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          return null;
        }
        
        return data as UserData;
      } catch (err) {
        console.error('Exception fetching user data:', err);
        return null;
      }
    },
    
    /**
     * Get the latest user data record
     */
    getLatestUser: async (): Promise<{ data: UserData | null, error: any }> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_data')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error fetching latest user data:', error);
          return { data: null, error };
        }
        
        return { data: data as UserData, error: null };
      } catch (err) {
        console.error('Exception fetching latest user data:', err);
        return { data: null, error: err };
      }
    },
    
    /**
     * Get user data by birth date
     */
    getByBirthDate: async (birthDate: string): Promise<{ data: UserData | null, error: any }> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_data')
          .select('*')
          .eq('birth_date', birthDate)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error fetching user data by birth date:', error);
          return { data: null, error };
        }
        
        return { data: data as UserData, error: null };
      } catch (err) {
        console.error('Exception fetching user data by birth date:', err);
        return { data: null, error: err };
      }
    },
    
    /**
     * Create a new user data record with planetary data
     */
    create: async (userData: Omit<UserData, 'id' | 'created_at' | 'updated_at'>): Promise<UserData | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_data')
          .insert([userData])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating user data:', error);
          return null;
        }
        
        return data as UserData;
      } catch (err) {
        console.error('Exception creating user data:', err);
        return null;
      }
    },
    
    /**
     * Update an existing user data record
     */
    update: async (id: string, userData: Partial<UserData>): Promise<UserData | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_data')
          .update({
            ...userData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating user data:', error);
          return null;
        }
        
        return data as UserData;
      } catch (err) {
        console.error('Exception updating user data:', err);
        return null;
      }
    },
    
    /**
     * Upsert a user data record - creates or updates based on ID
     */
    upsert: async (userData: Partial<UserData> & { id: string }): Promise<{ data: UserData | null, error: any }> => {
      try {
        if (!userData.id) {
          throw new Error('ID is required for upsert operation');
        }

        // Check if the record exists
        const { data: existingData } = await (supabase as any)
          .from('user_data')
          .select('id')
          .eq('id', userData.id)
          .single();

        const method = existingData ? 'update' : 'create';
        
        // Prepare the data for the operation
        const dataToSave = {
          ...userData,
          updated_at: new Date().toISOString()
        };

        let result;
        
        if (method === 'update') {
          const { data, error } = await (supabase as any)
            .from('user_data')
            .update(dataToSave)
            .eq('id', userData.id)
            .select()
            .single();
          
          result = { data, error };
        } else {
          const { data, error } = await (supabase as any)
            .from('user_data')
            .insert([dataToSave])
            .select()
            .single();
          
          result = { data, error };
        }

        if (result.error) {
          console.error(`Error during user data ${method}:`, result.error);
          return { data: null, error: result.error };
        }
        
        return { data: result.data as UserData, error: null };
      } catch (error) {
        console.error('Exception during user data upsert:', error);
        return { data: null, error };
      }
    },
    
    /**
     * Migrate data from user_test and user_astrology_data to user_data
     */
    migrateFromLegacyTables: async (userId: string): Promise<UserData | null> => {
      try {
        // First, get the user test data
        const userTest = await customSupabase.userTest.getById(userId);
        if (!userTest) {
          console.error('User test data not found for migration');
          return null;
        }
        
        // Then get the associated astrology data
        const { data: astrologyData } = await customSupabase.userAstrologyData.getByUserId(userId);
        
        // Create a new unified record
        const unifiedData: Omit<UserData, 'id' | 'created_at' | 'updated_at'> = {
          name: userTest.name,
          email: userTest.email,
          birth_date: userTest.birth_date,
          birth_time: userTest.birth_time,
          birth_city: userTest.birth_city,
          time_unknown: userTest.time_unknown,
          favorite_sports: userTest.favorite_sports,
          planetary_data: astrologyData?.planetary_data || null
        };
        
        // Insert the unified record
        return await customSupabase.userData.create(unifiedData);
      } catch (err) {
        console.error('Exception during data migration:', err);
        return null;
      }
    }
  },
  
  // User test table operations (legacy)
  userTest: {
    /**
     * Get a user test record by ID
     */
    getById: async (id: string): Promise<UserTest | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_test')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching user test data:', error);
          return null;
        }
        
        return data as UserTest;
      } catch (err) {
        console.error('Exception fetching user test data:', err);
        return null;
      }
    },
    
    /**
     * Get the latest user test record
     */
    getLatestUser: async (): Promise<{ data: UserTest | null, error: any }> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_test')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error fetching latest user data:', error);
          return { data: null, error };
        }
        
        return { data: data as UserTest, error: null };
      } catch (err) {
        console.error('Exception fetching latest user data:', err);
        return { data: null, error: err };
      }
    },
    
    /**
     * Create a new user test record
     */
    create: async (userData: Omit<UserTest, 'id' | 'created_at' | 'updated_at'>): Promise<UserTest | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_test')
          .insert([userData])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating user test data:', error);
          return null;
        }
        
        return data as UserTest;
      } catch (err) {
        console.error('Exception creating user test data:', err);
        return null;
      }
    },
    
    /**
     * Update an existing user test record
     */
    update: async (id: string, userData: Partial<UserTest>): Promise<UserTest | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_test')
          .update(userData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating user test data:', error);
          return null;
        }
        
        return data as UserTest;
      } catch (err) {
        console.error('Exception updating user test data:', err);
        return null;
      }
    }
  },
  
  // User astrology data operations
  userAstrologyData: {
    /**
     * Get astrology data for a specific user
     */
    getByUserId: async (userId: string): Promise<UserAstrologyData | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_astrology_data')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error('Error fetching user astrology data:', error);
          return null;
        }
        
        return data as UserAstrologyData;
      } catch (err) {
        console.error('Exception fetching user astrology data:', err);
        return null;
      }
    },
    
    /**
     * Get astrology data by birth date
     */
    getByBirthDate: async (birthDate: string): Promise<{ data: UserAstrologyData | null, error: any }> => {
      try {
        // Join user_test and user_astrology_data to find by birth_date
        // First find the user with the given birth date
        const { data: userData, error: userError } = await (supabase as any)
          .from('user_test')
          .select('id')
          .eq('birth_date', birthDate)
          .maybeSingle();
        
        if (userError) {
          console.error('Error finding user by birth date:', userError);
          return { data: null, error: userError };
        }
        
        if (!userData) {
          console.log('No user found with birth date:', birthDate);
          return { data: null, error: null };
        }
        
        // Now get the astrology data for this user
        const { data: astrologyData, error: astrologyError } = await (supabase as any)
          .from('user_astrology_data')
          .select('*')
          .eq('user_id', userData.id)
          .maybeSingle();
        
        if (astrologyError) {
          console.error('Error fetching user astrology data by user ID:', astrologyError);
          return { data: null, error: astrologyError };
        }
        
        return { data: astrologyData as UserAstrologyData, error: null };
      } catch (err) {
        console.error('Exception fetching user astrology data by birth date:', err);
        return { data: null, error: err };
      }
    },
    
    /**
     * Create a new astrology data record
     */
    create: async (astrologyData: Omit<UserAstrologyData, 'id' | 'created_at' | 'updated_at'>): Promise<UserAstrologyData | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_astrology_data')
          .insert([astrologyData])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating user astrology data:', error);
          return null;
        }
        
        return data as UserAstrologyData;
      } catch (err) {
        console.error('Exception creating user astrology data:', err);
        return null;
      }
    },
    
    /**
     * Update an existing astrology data record
     */
    update: async (id: string, astrologyData: Partial<UserAstrologyData>): Promise<UserAstrologyData | null> => {
      try {
        // Use any type to bypass TypeScript errors
        const { data, error } = await (supabase as any)
          .from('user_astrology_data')
          .update(astrologyData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating user astrology data:', error);
          return null;
        }
        
        return data as UserAstrologyData;
      } catch (err) {
        console.error('Exception updating user astrology data:', err);
        return null;
      }
    }
  }
};
