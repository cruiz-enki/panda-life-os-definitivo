-- Add unit and quantity to health_medications
ALTER TABLE public.health_medications 
ADD COLUMN unit TEXT DEFAULT '',
ADD COLUMN quantity NUMERIC DEFAULT 1;
