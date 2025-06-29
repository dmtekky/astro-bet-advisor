-- Create user_test table for storing user profile data
CREATE TABLE IF NOT EXISTS public.user_test (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_city TEXT NOT NULL,
  time_unknown BOOLEAN DEFAULT FALSE,
  favorite_sports JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_astrology_data table for storing astrology API responses
CREATE TABLE IF NOT EXISTS public.user_astrology_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_test(id) ON DELETE CASCADE,
  planetary_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.user_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_astrology_data ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo purposes (in production, you'd restrict this)
CREATE POLICY "Allow public access to user_test" ON public.user_test FOR ALL USING (true);
CREATE POLICY "Allow public access to user_astrology_data" ON public.user_astrology_data FOR ALL USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_test_birth_date ON public.user_test(birth_date);
CREATE INDEX IF NOT EXISTS idx_user_astrology_data_user_id ON public.user_astrology_data(user_id);
