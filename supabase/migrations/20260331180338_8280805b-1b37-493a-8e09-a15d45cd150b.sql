
-- Create waitlist table
CREATE TABLE public.waitlist_agricapital (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  zone TEXT NOT NULL,
  ville TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  possede_terre BOOLEAN NOT NULL DEFAULT false,
  superficie_terre NUMERIC,
  souhait_plantation TEXT,
  projet_interet TEXT[],
  superficie_souhaitee TEXT,
  motivation TEXT[],
  timing_projet TEXT,
  niveau_projet TEXT,
  source TEXT,
  date_inscription TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist_agricapital ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public waitlist form)
CREATE POLICY "Anyone can insert into waitlist"
ON public.waitlist_agricapital
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can read (admin)
CREATE POLICY "Authenticated users can read waitlist"
ON public.waitlist_agricapital
FOR SELECT
TO authenticated
USING (true);
