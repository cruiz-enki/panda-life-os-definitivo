/**
 * **Componente** — Avatar del panda con evolución por nivel y animaciones de estado.
 */
import { avatarForLevel, type AvatarStage } from "@/lib/gamification";
import { levelFromXp } from "@/lib/storage";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, { box: string; emoji: string; ring: string }> = {
  sm: { box: "w-12 h-12", emoji: "text-2xl", ring: "ring-2" },
  md: { box: "w-20 h-20", emoji: "text-4xl", ring: "ring-2" },
  lg: { box: "w-32 h-32", emoji: "text-7xl", ring: "ring-4" },
  xl: { box: "w-44 h-44", emoji: "text-[5.5rem]", ring: "ring-[6px]" },
};

export function PandaAvatar({
  xp,
  size = "md",
  showName = false,
  stage: forcedStage,
}: {
  xp: number;
  size?: Size;
  showName?: boolean;
  stage?: AvatarStage;
}) {
  const { level } = levelFromXp(xp);
  const { current } = avatarForLevel(level);
  const stage = forcedStage ?? current;
  const cls = SIZE[size];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${cls.box} rounded-full flex items-center justify-center bg-gradient-to-br ${stage.gradient} ${cls.ring} ring-background shadow-glow transition-all`}>
        <span className={cls.emoji}>{stage.emoji}</span>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border-2 border-background flex items-center justify-center text-xs font-bold text-primary">
          {level}
        </div>
      </div>
      {showName && (
        <div className="text-center">
          <div className="font-display font-bold text-sm">{stage.name}</div>
          <div className="text-[10px] text-muted-foreground">{stage.description}</div>
        </div>
      )}
    </div>
  );
}
