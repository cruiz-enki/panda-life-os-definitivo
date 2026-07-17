/**
 * **Feature** — Componentes (parts) del módulo **Battle Pass**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { todayCDMX } from "@/lib/date-utils";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBattlePass } from "@/hooks/use-battle-pass";
import { useIsOwner } from "@/hooks/use-is-owner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRewardsCustom, type Reward } from "@/hooks/use-rewards-custom";
import { toast } from "sonner";
import { Plus, Trash2, Trophy, Flame, Lock, Sparkles, Target, CheckCircle2, Snowflake } from "lucide-react";
import { useFreeze, FREEZE_COST, MAX_INVENTORY, MAX_PER_MONTH } from "@/hooks/use-freeze";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export function BattlePassPage() {
  const { isOwner, loading: ownerLoading } = useIsOwner();
  const bp = useBattlePass();

  if (bp.loading || ownerLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando Battle Pass…</div>;
  }

  if (!bp.activeSeason && !isOwner) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <BattlePassHeader />
        <Card><CardContent className="p-8 text-center text-muted-foreground">No hay una temporada activa todavía.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <BattlePassHeader />

      <Tabs defaultValue={!bp.activeSeason && isOwner ? "admin" : "overview"}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            {bp.activeSeason && <TabsTrigger value="missions">Misiones</TabsTrigger>}
            {bp.activeSeason && <TabsTrigger value="rewards">Recompensas</TabsTrigger>}
            {isOwner && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {bp.activeSeason ? (
              <>
                <SeasonHero bp={bp} />
                <StreakCard bp={bp} />
                <FreezeCard bp={bp} />
              </>
            ) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No hay una temporada activa todavía.</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="missions" className="mt-4">
            <MissionsList bp={bp} />
          </TabsContent>

          <TabsContent value="rewards" className="mt-4">
            <RewardsTrack bp={bp} />
          </TabsContent>

          {isOwner && (
            <TabsContent value="admin" className="mt-4">
              <AdminPanel bp={bp} />
            </TabsContent>
          )}
        </Tabs>
    </div>
  );
}

function BattlePassHeader() {
  return (
    <header>
      <h1 className="text-3xl font-display font-bold flex items-center gap-2">
        <Trophy className="w-7 h-7 text-[var(--xp)]" /> Battle Pass
      </h1>
      <p className="text-sm text-muted-foreground">Sube niveles y desbloquea recompensas con tu XP global.</p>
    </header>
  );
}

function SeasonHero({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  const s = bp.activeSeason!;
  return (
    <Card className="overflow-hidden border-primary/40">
      <CardContent className="p-6 space-y-4 bg-gradient-to-br from-primary/10 via-background to-[var(--xp)]/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Temporada activa</div>
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <span>{s.emoji}</span>{s.name}
            </h2>
            {s.objective && <p className="text-sm text-muted-foreground mt-1">🎯 {s.objective}</p>}
            {s.focus && <p className="text-xs text-muted-foreground">Enfoque: {s.focus}</p>}
          </div>
          <Badge variant="secondary" className="shrink-0">Nivel {bp.currentLevel}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{bp.seasonXp} XP</span>
            <span className="font-medium">
              {bp.nextLevel ? `Nivel ${bp.nextLevel.level} en ${Math.max(0, bp.nextLevel.xp_required - bp.seasonXp)} XP` : "¡Máximo nivel!"}
            </span>
          </div>
          <Progress value={bp.progressPct * 100} className="h-3" />
        </div>

        {bp.nextLevel && (
          <div className="flex items-center gap-2 text-sm bg-background/60 rounded-lg p-3 border">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Siguiente:</span>
            <span className="text-lg">{bp.nextLevel.reward_emoji}</span>
            <span className="font-medium">{bp.nextLevel.reward_text || `Nivel ${bp.nextLevel.level}`}</span>
          </div>
        )}

        <div className="text-sm italic text-center text-primary/80 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" /> {bp.motivational}
        </div>
      </CardContent>
    </Card>
  );
}

function StreakCard({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange-500" />
          <div>
            <div className="text-2xl font-display font-bold">{bp.streak?.current_streak ?? 0} días</div>
            <div className="text-xs text-muted-foreground">Racha actual · récord {bp.streak?.longest_streak ?? 0}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-right">+50 XP cada 7 días 🎁</div>
      </CardContent>
    </Card>
  );
}

function FreezeCard({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  const fz = useFreeze();
  const [open, setOpen] = useState(false);
  const today = todayCDMX();
  const streakBroken = bp.streak?.last_active_date && bp.streak.last_active_date !== today && (() => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return bp.streak!.last_active_date !== y.toISOString().slice(0, 10);
  })();

  if (fz.loading) return null;

  return (
    <Card className="border-cyan-500/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Snowflake className="w-7 h-7 text-cyan-500" />
            <div>
              <div className="font-display font-bold text-lg">Streak Freeze</div>
              <div className="text-xs text-muted-foreground">
                {fz.available.length}/{MAX_INVENTORY} en inventario · {fz.usedThisMonth.length}/{MAX_PER_MONTH} usados este mes
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fz.buy} disabled={!fz.canBuy}>
              Comprar · {FREEZE_COST} XP
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!fz.canUse}>Usar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>🧊 ¿Usar Streak Freeze?</DialogTitle>
                  <DialogDescription>
                    Protege tu racha de hoy. <b>No sumarás XP</b> ni contará como día productivo, pero tu racha de {bp.streak?.current_streak ?? 0} días seguirá viva.
                  </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Te quedarán <b>{fz.available.length - 1}</b> Freeze en inventario.</div>
                  <div>• Llevarías <b>{fz.usedThisMonth.length + 1}/{MAX_PER_MONTH}</b> este mes.</div>
                  <div>• No puedes usarlo dos días seguidos.</div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={async () => {
                    const ok = await fz.useFreezeNow(today);
                    if (ok) setOpen(false);
                  }}>Confirmar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {streakBroken && fz.canUse && (
          <div className="text-xs text-orange-500 bg-orange-500/10 rounded p-2">
            ⚠️ Tu racha está en riesgo. Usa un Freeze para protegerla.
          </div>
        )}
        {fz.usedThisMonth.length >= MAX_PER_MONTH && (
          <div className="text-xs text-muted-foreground bg-muted rounded p-2">
            Has usado tu límite mensual. La disciplina diaria es la mejor estrategia 💪
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MissionsList({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  if (bp.missions.length === 0) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground">Aún no hay misiones en esta temporada.</CardContent></Card>;
  }
  const groups = [
    { type: "daily" as const, label: "Diarias", emoji: "📅" },
    { type: "secondary" as const, label: "Secundarias", emoji: "⭐" },
    { type: "challenge" as const, label: "Retos", emoji: "🔥" },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const items = bp.missions.filter((m) => m.mission.mission_type === g.type);
        if (items.length === 0) return null;
        return (
          <div key={g.type} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{g.emoji} {g.label}</h3>
            {items.map((entry) => (
              <Card key={entry.mission.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{entry.mission.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{entry.mission.title}</div>
                    {entry.mission.description && <div className="text-xs text-muted-foreground truncate">{entry.mission.description}</div>}
                    <div className="mt-1 flex items-center gap-2">
                      <Progress value={(entry.progress / entry.mission.target) * 100} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground tabular-nums">{entry.progress}/{entry.mission.target}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs">+{entry.mission.xp} XP</Badge>
                    {entry.claimed ? (
                      <Badge variant="secondary" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Listo</Badge>
                    ) : entry.completed ? (
                      <Button size="sm" onClick={() => bp.claimMission(entry.mission.id)}>Reclamar</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => bp.incrementMission(entry.mission.id)}>+1</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function RewardsTrack({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  if (bp.levels.length === 0) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground">Sin niveles configurados.</CardContent></Card>;
  }
  return (
    <div className="space-y-2">
      {bp.levels.map((lvl) => {
        const unlocked = bp.unlocks.some((u) => u.level === lvl.level);
        const reached = bp.seasonXp >= lvl.xp_required;
        const claimable = reached && !unlocked;
        return (
          <Card key={lvl.id} className={reached ? "border-primary/50" : ""}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg shrink-0 ${reached ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {lvl.level}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{lvl.reward_emoji}</span>
                  <span className="font-medium truncate">{lvl.reward_text || "Recompensa"}</span>
                </div>
                <div className="text-xs text-muted-foreground">{lvl.xp_required} XP requerido</div>
              </div>
              {unlocked ? (
                <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" />Desbloqueado</Badge>
              ) : claimable ? (
                <Button size="sm" onClick={() => bp.claimLevel(lvl)}>Reclamar</Button>
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ===== Admin =====
function AdminPanel({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  return (
    <div className="space-y-6">
      <SeasonAdmin bp={bp} />
      {bp.activeSeason && (
        <>
          <LevelsAdmin bp={bp} />
          <MissionsAdmin bp={bp} />
        </>
      )}
    </div>
  );
}

function SeasonAdmin({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [focus, setFocus] = useState("");
  const [emoji, setEmoji] = useState("🎖️");
  const [messages, setMessages] = useState("¡Sigue así!\n¡Tú puedes!\nUn paso más cerca");

  const create = async () => {
    if (!name.trim() || !user) return;
    const today = new Date();
    const end = new Date(today); end.setMonth(end.getMonth() + 1);
    // Desactivar las activas
    await supabase.from("battle_pass_seasons").update({ active: false }).eq("active", true);
    const { error } = await supabase.from("battle_pass_seasons").insert({
      name: name.trim(), objective, focus, emoji,
      starts_on: today.toISOString().slice(0, 10),
      ends_on: end.toISOString().slice(0, 10),
      active: true,
      motivational_messages: messages.split("\n").map((s) => s.trim()).filter(Boolean),
      created_by: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Temporada creada");
    setName(""); setObjective(""); setFocus("");
    window.location.reload();
  };

  const setActive = async (id: string) => {
    await supabase.from("battle_pass_seasons").update({ active: false }).eq("active", true);
    await supabase.from("battle_pass_seasons").update({ active: true }).eq("id", id);
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Temporadas</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {bp.seasons.map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-2 rounded border">
              <span className="text-xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.starts_on} → {s.ends_on}</div>
              </div>
              {s.active ? <Badge>Activa</Badge> : <Button size="sm" variant="outline" onClick={() => setActive(s.id)}>Activar</Button>}
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="text-sm font-medium">Nueva temporada</div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Input placeholder="Objetivo principal" value={objective} onChange={(e) => setObjective(e.target.value)} />
          <Input placeholder="Enfoque" value={focus} onChange={(e) => setFocus(e.target.value)} />
          <div>
            <Label className="text-xs">Mensajes motivacionales (uno por línea)</Label>
            <Textarea rows={3} value={messages} onChange={(e) => setMessages(e.target.value)} />
          </div>
          <Button onClick={create} className="w-full"><Plus className="w-4 h-4 mr-1" />Crear temporada</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelsAdmin({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  const { rewards } = useRewardsCustom();
  const [level, setLevel] = useState("");
  const [xp, setXp] = useState("");
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [rewardId, setRewardId] = useState<string>("");

  const add = async () => {
    const lvl = parseInt(level), x = parseInt(xp);
    if (!lvl || !x || !bp.activeSeason) return;
    const { error } = await supabase.from("battle_pass_levels").insert({
      season_id: bp.activeSeason.id, level: lvl, xp_required: x,
      reward_text: text, reward_emoji: emoji, reward_id: rewardId || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Nivel añadido");
    setLevel(""); setXp(""); setText(""); setRewardId("");
    window.location.reload();
  };

  const remove = async (id: string) => {
    await supabase.from("battle_pass_levels").delete().eq("id", id);
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Niveles y recompensas</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {bp.levels.map((l) => (
            <div key={l.id} className="flex items-center gap-2 p-2 rounded border text-sm">
              <Badge variant="outline">N{l.level}</Badge>
              <span className="text-xs text-muted-foreground">{l.xp_required} XP</span>
              <span>{l.reward_emoji}</span>
              <span className="flex-1 truncate">{l.reward_text}</span>
              <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 grid grid-cols-2 gap-2">
          <Input placeholder="Nivel" type="number" value={level} onChange={(e) => setLevel(e.target.value)} />
          <Input placeholder="XP requerido" type="number" value={xp} onChange={(e) => setXp(e.target.value)} />
          <Input placeholder="Emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          <Input placeholder="Descripción" value={text} onChange={(e) => setText(e.target.value)} />
          <Select value={rewardId || "__none__"} onValueChange={(v) => setRewardId(v === "__none__" ? "" : v)}>
            <SelectTrigger className="col-span-2"><SelectValue placeholder="Enlazar a Reward (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Ninguno (texto libre)</SelectItem>
              {rewards.map((r: Reward) => <SelectItem key={r.id} value={r.id}>{r.emoji} {r.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={add} className="col-span-2"><Plus className="w-4 h-4 mr-1" />Añadir nivel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MissionsAdmin({ bp }: { bp: ReturnType<typeof useBattlePass> }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [type, setType] = useState<"daily" | "secondary" | "challenge">("daily");
  const [xp, setXp] = useState("25");
  const [target, setTarget] = useState("1");

  const add = async () => {
    if (!title.trim() || !bp.activeSeason) return;
    const { error } = await supabase.from("battle_pass_missions").insert({
      season_id: bp.activeSeason.id, title: title.trim(), description: desc, emoji,
      mission_type: type, xp: parseInt(xp) || 25, target: parseInt(target) || 1, active: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Misión añadida");
    setTitle(""); setDesc("");
    window.location.reload();
  };

  const remove = async (id: string) => {
    await supabase.from("battle_pass_missions").delete().eq("id", id);
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Misiones</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {bp.missions.map((m) => (
            <div key={m.mission.id} className="flex items-center gap-2 p-2 rounded border text-sm">
              <span>{m.mission.emoji}</span>
              <Badge variant="outline" className="text-xs">{m.mission.mission_type}</Badge>
              <span className="flex-1 truncate">{m.mission.title}</span>
              <span className="text-xs text-muted-foreground">+{m.mission.xp}</span>
              <Button size="icon" variant="ghost" onClick={() => remove(m.mission.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 grid grid-cols-2 gap-2">
          <Input placeholder="Emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diaria</SelectItem>
              <SelectItem value="secondary">Secundaria</SelectItem>
              <SelectItem value="challenge">Reto</SelectItem>
            </SelectContent>
          </Select>
          <Input className="col-span-2" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input className="col-span-2" placeholder="Descripción" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Input placeholder="XP" type="number" value={xp} onChange={(e) => setXp(e.target.value)} />
          <Input placeholder="Meta" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Button onClick={add} className="col-span-2"><Plus className="w-4 h-4 mr-1" /><Target className="w-4 h-4 mr-1" />Añadir misión</Button>
        </div>
      </CardContent>
    </Card>
  );
}
