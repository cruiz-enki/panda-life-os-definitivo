-- Check if the column exists before adding it to 'exercises' table
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exercises') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercises' AND column_name='image_urls') THEN
            ALTER TABLE public.exercises ADD COLUMN image_urls TEXT[] DEFAULT '{}';
        END IF;
    END IF;
END $$;