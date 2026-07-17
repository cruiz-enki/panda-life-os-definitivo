/**
 * **Componente** — UI de la ruleta de la vida: gira para obtener una misión aleatoria.
 */
import { useState } from "react";
import { useLifeRandomizer } from "@/hooks/use-life-randomizer";
import { Button } from "@/components/ui/button";
import { Dices, Check, RefreshCw, Trophy, Sparkles, Settings2, Plus, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LifeRandomizer() {
  const { randomize, completeMission, addMission, deleteMission, customQuests, missions, loading } = useLifeRandomizer();
  const [current, setCurrent] = useState<{
    historyId: string;
    title: string;
    icon?: string;
    xp: number;
    isTask?: boolean;
  } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newMissionTitle, setNewMissionTitle] = useState("");

  const handleRandomize = async () => {
    setIsSpinning(true);
    // Visual delay for "fun"
    await new Promise(r => setTimeout(r, 800));
    const result = await randomize();
    if (result) {
      setCurrent(result);
    }
    setIsSpinning(false);
  };

  const handleComplete = async () => {
    if (!current) return;
    const ok = await completeMission(current.historyId, current.xp);
    if (ok) {
      setCurrent(null);
    }
  };

  const handleAddMission = async () => {
    if (!newMissionTitle.trim()) return;
    await addMission({ title: newMissionTitle });
    setNewMissionTitle("");
  };

  return (
    <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 mb-8 shadow-card overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Dices className="w-32 h-32 text-primary rotate-12" />
      </div>

      <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
              <Sparkles className="w-3.5 h-3.5" /> Randomizer de Vida
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded-full hover:bg-primary/10 transition-colors text-primary/60 hover:text-primary"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <h2 className="font-display text-2xl font-bold">¿Qué hacemos ahora?</h2>
          <p className="mt-2 text-muted-foreground">
            Deja que el azar elija tu próxima mini-misión. Gamifica tu día con pequeñas acciones de alto impacto.
          </p>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
          <AnimatePresence mode="wait">
            {!current ? (
              <motion.div
                key="randomize-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button 
                  onClick={handleRandomize} 
                  disabled={isSpinning || loading}
                  className="w-full h-14 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-105 transition-all text-lg gap-2"
                >
                  {isSpinning ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Dices className="w-6 h-6" />}
                  {isSpinning ? "Girando..." : "¡Randomizar!"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="current-mission"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col gap-3"
              >
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center gap-4">
                  <div className="text-3xl">{current.icon || "🎲"}</div>
                  <div className="flex-1">
                    <div className="text-xs uppercase text-primary font-bold tracking-widest mb-0.5">Misión Actual</div>
                    <div className="font-bold text-sm leading-tight">{current.title}</div>
                    <div className="text-[10px] text-primary/70 font-bold mt-1">+{current.xp} XP</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleComplete} 
                    className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                  >
                    <Check className="w-4 h-4" /> ¡Hecho!
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleRandomize}
                    className="w-12 h-12 rounded-xl p-0"
                    title="Otro"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-8 pt-6 border-t border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> Configurar misiones
                </h3>
                <button onClick={() => setShowSettings(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input 
                  type="text"
                  placeholder="Ej: Meditar 5 minutos..."
                  value={newMissionTitle}
                  onChange={(e) => setNewMissionTitle(e.target.value)}
                  className="flex-1 bg-background border border-primary/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-primary/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMission()}
                />
                <Button size="sm" onClick={handleAddMission} className="rounded-xl">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mis Misiones Semanales</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {customQuests.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span>{m.emoji || "🎯"}</span>
                      <span className="text-xs font-medium truncate">{m.title}</span>
                    </div>
                    <button 
                      onClick={() => deleteMission(m.id)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              
              {customQuests.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic text-center py-4">
                  Aún no has añadido misiones personalizadas.
                </p>
              )}

              <div className="mt-4 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mini Misiones (Default)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-60">
                {missions.map(m => (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-sm">{m.icon}</span>
                    <span className="text-[10px] font-medium truncate">{m.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
