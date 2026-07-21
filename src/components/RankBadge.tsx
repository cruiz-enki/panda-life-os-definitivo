/**
 * **Componente** — Badge de rango militar (Recluta → César) según nivel/XP.
 */
import { rankForLevel } from "@/lib/gamification";
import { levelFromXp } from "@/lib/storage";

type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, string> = {
  sm: "text-[10px] px-1.5 py-0.5 gap-1",
  md: "text-xs px-2 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-2",
};

export function RankBadge({ xp, size = "sm", showLabel = true }: { xp: number; size?: Size; showLabel?: boolean }) {
  const { level } = levelFromXp(xp);
  const { current } = rankForLevel(level);
  return (
    <span
      className={`inline-flex items-center rounded-full font-display font-bold text-white bg-gradient-to-r ${current.gradient} shadow-sm ${SIZE[size]}`}
      title={`${current.name} · Nivel ${level}`}
    >
      <span aria-hidden>{current.insignia}</span>
      {showLabel && <span className="uppercase tracking-wider">{current.name}</span>}
    </span>
  );
}
