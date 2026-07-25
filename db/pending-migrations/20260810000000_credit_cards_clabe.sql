-- Añade CLABE interbancaria (18 dígitos) a tarjetas.
ALTER TABLE public.credit_cards
  ADD COLUMN IF NOT EXISTS clabe text;
