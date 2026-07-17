/**
 * **Componente** — Editor de premios personalizados (CRUD) con coste en XP / Monedas Panda.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { METRIC_LABELS, type AutoMetric, type CustomQuest, type CustomFixedMission, type Reward } from "@/hooks/use-rewards-custom";

type EditorKind = "quest" | "achievement" | "reward" | "panda_reward";

type Props =
  | { kind: "quest"; open: boolean; initial: Partial<CustomQuest> | null; onClose: () => void; onSave: (v: Partial<CustomQuest>) => Promise<void>; onDelete?: (id: string) => Promise<void> }
  | { kind: "achievement"; open: boolean; initial: Partial<CustomFixedMission> | null; onClose: () => void; onSave: (v: Partial<CustomFixedMission>) => Promise<void>; onDelete?: (id: string) => Promise<void> }
  | { kind: "reward"; open: boolean; initial: Partial<Reward> | null; onClose: () => void; onSave: (v: Partial<Reward>) => Promise<void>; onDelete?: (id: string) => Promise<void> }
  | { kind: "panda_reward"; open: boolean; initial: any | null; onClose: () => void; onSave: (v: any) => Promise<void>; onDelete?: (id: string) => Promise<void> };

export function RewardsEditor(props: Props) {
  const { kind, open, initial, onClose, onSave, onDelete } = props;
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!open) return;
    setForm(initial ?? {});
  }, [open, initial]);

  const titleMap: Record<EditorKind, string> = {
    quest: form?.id ? "Editar misión" : "Nueva misión",
    achievement: form?.id ? "Editar misión fija" : "Nueva misión fija",
    reward: form?.id ? "Editar premio" : "Nuevo premio",
    panda_reward: form?.id ? "Editar premio real" : "Nuevo premio real",
  };

  const handleSave = async () => {
    await onSave(form);
    onClose();
  };

  const handleDelete = async () => {
    if (!form?.id || !onDelete) return;
    if (!confirm("¿Eliminar este elemento?")) return;
    await onDelete(form.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titleMap[kind]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <Label>Emoji</Label>
              <Input
                value={form.emoji ?? (kind === "reward" || kind === "panda_reward" ? "🎁" : kind === "achievement" ? "🏆" : "🎯")}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="text-center text-2xl"
                maxLength={4}
              />
            </div>
            <div>
              <Label>{kind === "achievement" || kind === "reward" || kind === "panda_reward" ? "Nombre" : "Título"}</Label>
              <Input
                value={form[kind === "achievement" || kind === "reward" || kind === "panda_reward" ? "name" : "title"] ?? ""}
                onChange={(e) => setForm({ ...form, [kind === "achievement" || kind === "reward" || kind === "panda_reward" ? "name" : "title"]: e.target.value })}
                placeholder={kind === "reward" || kind === "panda_reward" ? "Cena fuera, masaje..." : kind === "achievement" ? "Maestro Zen..." : "Sprint de la semana"}
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Detalle opcional"
            />
          </div>

          {kind === "quest" && (
            <div>
              <Label>Fecha programada (Opcional)</Label>
              <Input 
                type="date" 
                value={form.due_date ? new Date(form.due_date).toISOString().split('T')[0] : ""} 
                onChange={(e) => setForm({ ...form, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })} 
              />
            </div>
          )}

          {kind === "reward" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Coste (XP)</Label>
                  <Input type="number" min={1} value={form.cost ?? 100} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select value={form.category ?? "treat"} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="treat">🍕 Capricho</SelectItem>
                      <SelectItem value="experience">🎢 Experiencia</SelectItem>
                      <SelectItem value="purchase">🛍️ Compra</SelectItem>
                      <SelectItem value="time">⏰ Tiempo libre</SelectItem>
                      <SelectItem value="other">✨ Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : kind === "panda_reward" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Coste (Monedas Panda)</Label>
                <Input type="number" min={1} value={form.coin_cost ?? 1} onChange={(e) => setForm({ ...form, coin_cost: Number(e.target.value) })} />
              </div>
            </div>
          ) : null}

          {kind === "quest" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Objetivo</Label>
                  <Input type="number" min={1} value={form.target ?? 1} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>XP recompensa</Label>
                  <Input type="number" min={1} value={form.xp ?? 50} onChange={(e) => setForm({ ...form, xp: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Alcance</Label>
                  <Select value={form.scope ?? "weekly"} onValueChange={(v) => setForm({ ...form, scope: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="once">Único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Seguimiento</Label>
                  <Select value={form.tracking ?? "manual"} onValueChange={(v) => setForm({ ...form, tracking: v, metric: v === "manual" ? null : form.metric })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">✋ Manual (+1)</SelectItem>
                      <SelectItem value="auto">⚡ Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.tracking === "auto" && (
                <div>
                  <Label>Métrica a medir</Label>
                  <Select value={form.metric ?? ""} onValueChange={(v) => setForm({ ...form, metric: v as AutoMetric })}>
                    <SelectTrigger><SelectValue placeholder="Elige métrica" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(METRIC_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          ) : null}

          {kind === "achievement" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>XP recompensa</Label>
                  <Input type="number" min={1} value={form.xp ?? 100} onChange={(e) => setForm({ ...form, xp: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Rareza</Label>
                  <Select value={form.rarity ?? "common"} onValueChange={(v) => setForm({ ...form, rarity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Común</SelectItem>
                      <SelectItem value="rare">Raro</SelectItem>
                      <SelectItem value="epic">Épico</SelectItem>
                      <SelectItem value="legendary">Legendario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.category ?? "meta"} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habits">Hábitos</SelectItem>
                    <SelectItem value="tasks">Tareas</SelectItem>
                    <SelectItem value="notes">Notas</SelectItem>
                    <SelectItem value="energy">Energía</SelectItem>
                    <SelectItem value="learning">Aprendizajes</SelectItem>
                    <SelectItem value="level">Nivel</SelectItem>
                    <SelectItem value="meta">Meta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Auto-desbloquear</Label>
                    <p className="text-xs text-muted-foreground">Si lo activas, se desbloqueará automáticamente al alcanzar el objetivo</p>
                  </div>
                  <Switch
                    checked={!!form.metric}
                    onCheckedChange={(v) => setForm({ ...form, metric: v ? "tasks_completed" : null, target: v ? (form.target ?? 10) : null })}
                  />
                </div>
                {form.metric && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Métrica</Label>
                      <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v as AutoMetric })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(METRIC_LABELS).map(([k, l]) => (
                            <SelectItem key={k} value={k}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Objetivo</Label>
                      <Input type="number" min={1} value={form.target ?? 10} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {form?.id && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">Eliminar</Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
