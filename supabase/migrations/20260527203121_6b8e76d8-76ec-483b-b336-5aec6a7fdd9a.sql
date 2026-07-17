-- Add result_date to lab_results to support loose results
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS result_date DATE DEFAULT CURRENT_DATE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lab_results_date ON public.lab_results(result_date DESC);
