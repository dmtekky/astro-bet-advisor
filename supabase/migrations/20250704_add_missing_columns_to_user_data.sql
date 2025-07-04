-- Add missing columns to user_data table
-- This script adds columns that are referenced in the code but missing in the database

-- First, check if the user_data table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_data') THEN
    -- Create the user_data table if it doesn't exist
    CREATE TABLE public.user_data (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT,
      email TEXT,
      avatar_url TEXT,
      member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      account_type TEXT DEFAULT 'Standard',
      favorite_sports TEXT[] DEFAULT '{}',
      notification_email TEXT,
      theme TEXT DEFAULT 'dark',
      predictions INTEGER DEFAULT 0,
      accuracy TEXT DEFAULT '0%',
      followers INTEGER DEFAULT 0,
      following INTEGER DEFAULT 0,
      birth_date TEXT,
      birth_time TEXT,
      birth_city TEXT,
      time_unknown BOOLEAN DEFAULT FALSE,
      birth_latitude NUMERIC,
      birth_longitude NUMERIC,
      planetary_data JSONB,
      planetary_count JSONB,
      planets_per_sign JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add RLS policies
    ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

    -- Allow users to read their own data
    CREATE POLICY "Users can read their own data" 
      ON public.user_data 
      FOR SELECT 
      USING (auth.uid() = id);

    -- Allow users to insert their own data
    CREATE POLICY "Users can insert their own data" 
      ON public.user_data 
      FOR INSERT 
      WITH CHECK (auth.uid() = id);

    -- Allow users to update their own data
    CREATE POLICY "Users can update their own data" 
      ON public.user_data 
      FOR UPDATE 
      USING (auth.uid() = id);

  ELSE
    -- If the table exists, add any missing columns
    
    -- Add member_since column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'member_since') THEN
      ALTER TABLE public.user_data ADD COLUMN member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'last_login') THEN
      ALTER TABLE public.user_data ADD COLUMN last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add account_type column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'account_type') THEN
      ALTER TABLE public.user_data ADD COLUMN account_type TEXT DEFAULT 'Standard';
    END IF;

    -- Add favorite_sports column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'favorite_sports') THEN
      ALTER TABLE public.user_data ADD COLUMN favorite_sports TEXT[] DEFAULT '{}';
    END IF;

    -- Add notification_email column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'notification_email') THEN
      ALTER TABLE public.user_data ADD COLUMN notification_email TEXT;
    END IF;

    -- Add theme column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'theme') THEN
      ALTER TABLE public.user_data ADD COLUMN theme TEXT DEFAULT 'dark';
    END IF;

    -- Add predictions column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'predictions') THEN
      ALTER TABLE public.user_data ADD COLUMN predictions INTEGER DEFAULT 0;
    END IF;

    -- Add accuracy column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'accuracy') THEN
      ALTER TABLE public.user_data ADD COLUMN accuracy TEXT DEFAULT '0%';
    END IF;

    -- Add followers column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'followers') THEN
      ALTER TABLE public.user_data ADD COLUMN followers INTEGER DEFAULT 0;
    END IF;

    -- Add following column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'following') THEN
      ALTER TABLE public.user_data ADD COLUMN following INTEGER DEFAULT 0;
    END IF;

    -- Add planetary_data column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'planetary_data') THEN
      ALTER TABLE public.user_data ADD COLUMN planetary_data JSONB;
    END IF;

    -- Add planetary_count column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'planetary_count') THEN
      ALTER TABLE public.user_data ADD COLUMN planetary_count JSONB;
    END IF;

    -- Add planets_per_sign column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_data' AND column_name = 'planets_per_sign') THEN
      ALTER TABLE public.user_data ADD COLUMN planets_per_sign JSONB;
    END IF;
  END IF;
END
$$;

-- Make sure RLS is enabled
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist
DO $$
BEGIN
  -- Check if the select policy exists
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'user_data' 
    AND policyname = 'Users can read their own data'
  ) THEN
    -- Create the select policy
    CREATE POLICY "Users can read their own data" 
      ON public.user_data 
      FOR SELECT 
      USING (auth.uid() = id);
  END IF;

  -- Check if the insert policy exists
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'user_data' 
    AND policyname = 'Users can insert their own data'
  ) THEN
    -- Create the insert policy
    CREATE POLICY "Users can insert their own data" 
      ON public.user_data 
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Check if the update policy exists
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'user_data' 
    AND policyname = 'Users can update their own data'
  ) THEN
    -- Create the update policy
    CREATE POLICY "Users can update their own data" 
      ON public.user_data 
      FOR UPDATE 
      USING (auth.uid() = id);
  END IF;
END
$$;
