
UPDATE public.profiles
SET xp = GREATEST(
  xp,
  COALESCE((SELECT SUM(xp_awarded) FROM public.home_completions WHERE user_id = profiles.user_id), 0)
  + COALESCE((SELECT COUNT(*) * 15 FROM public.learnings WHERE user_id = profiles.user_id), 0)
  + 665  -- suma aproximada de logros ya desbloqueados
)
WHERE user_id = '926c5838-3e30-46ba-a669-6549cd69b428';
