-- Create table for home inventory
CREATE TABLE public.home_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  purchase_place TEXT,
  model_number TEXT,
  serial_number TEXT,
  technical_details JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  cost DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_inventory TO authenticated;
GRANT ALL ON public.home_inventory TO service_role;

-- Enable Row Level Security
ALTER TABLE public.home_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own inventory" 
ON public.home_inventory FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inventory items" 
ON public.home_inventory FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items" 
ON public.home_inventory FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items" 
ON public.home_inventory FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_home_inventory_updated_at
BEFORE UPDATE ON public.home_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();