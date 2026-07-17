/**
 * **Feature** — Componentes (parts) del módulo **Árbol de habilidades**.
 *
 * Reutilizables entre la ruta principal y el dashboard.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Trophy,
  BookOpen,
  Plus,
  Type,
  Palette,
  LayoutGrid,
  Search,
  Hash
} from "lucide-react";
import { useAppState } from "@/lib/storage";
import type { Learning } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SKILL_TREE_DATA } from "@/lib/skills-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, SubCategory, Skill } from "@/lib/storage-types";

function AddCategoryDialog({ onAdd }: { onAdd: (cat: Category) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [color, setColor] = useState("from-slate-500 to-slate-700");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCat: Category = {
      id: crypto.randomUUID(),
      name: `${emoji} ${name}`,
      icon: emoji, // Store emoji as icon for custom cats
      description,
      color,
      subCategories: []
    };

    onAdd(newCat);
    setName("");
    setDescription("");
    setOpen(false);
    toast.success("Categoría creada con éxito");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Categoría de Habilidades</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emoji" className="text-right">Emoji</Label>
            <Input
              id="emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="col-span-3"
              placeholder="🏷️"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="E.g. Historia de México"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="desc" className="text-right">Descripción</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="De qué trata esta rama..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">Color</Label>
            <select 
              id="color"
              className="col-span-3 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="from-blue-500 to-indigo-600">Azul Profundo</option>
              <option value="from-emerald-500 to-teal-600">Esmeralda</option>
              <option value="from-purple-500 to-fuchsia-600">Violeta</option>
              <option value="from-amber-600 to-orange-700">Ámbar</option>
              <option value="from-rose-500 to-pink-600">Rosa</option>
              <option value="from-slate-500 to-slate-700">Gris</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="submit">Crear Categoría</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UnlockSkillDialog({ 
  skill,
  category,
  onUnlock,
  learnings
}: { 
  skill: Skill;
  category: Category;
  onUnlock: (skillId: string, learningId: string, isMultiplier: boolean) => void;
  learnings: Learning[];
}) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [selectedLearning, setSelectedLearning] = useState<string>("");
  const [step, setStep] = useState<"quiz" | "evidence">("quiz");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer || answer.length < 10) {
      toast.error("Por favor, describe con más detalle lo que has aprendido.");
      return;
    }
    setStep("evidence");
  };

  const handleFinalize = () => {
    if (!selectedLearning) {
      toast.error("Debes vincular un contenido de la bitácora.");
      return;
    }
    onUnlock(skill.id, selectedLearning, !!category.multiplier);
    setOpen(false);
    setStep("quiz");
    setAnswer("");
    setSelectedLearning("");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setStep("quiz");
        setAnswer("");
        setSelectedLearning("");
      }
    }}>
      <DialogTrigger asChild>
        <button className="group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 bg-background border-border hover:border-primary/40 text-foreground/80 hover:text-foreground">
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium leading-tight">{skill.name}</span>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 shrink-0" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Desbloquear: {skill.name}
          </DialogTitle>
        </DialogHeader>
        
        {step === "quiz" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-primary">Cuestionario de Validación</Label>
              <p className="text-sm text-muted-foreground italic">
                Para asegurar que dominas "{skill.name}", cuéntanos: ¿Cuál es el concepto clave que aprendiste y cómo lo aplicarías?
              </p>
              <Textarea
                placeholder="Escribe aquí tu reflexión (mínimo 10 caracteres)..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={answer.length < 10}>
                Continuar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-primary">Vincular con Bitácora</Label>
              <p className="text-sm text-muted-foreground italic">
                Selecciona un aprendizaje terminado de tu historial para respaldar esta habilidad.
              </p>
              <select 
                className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={selectedLearning}
                onChange={(e) => setSelectedLearning(e.target.value)}
              >
                <option value="">Selecciona un aprendizaje...</option>
                {learnings.map(l => (
                  <option key={l.id} value={l.id}>{l.title} ({new Date(l.date).toLocaleDateString()})</option>
                ))}
              </select>
              {learnings.length === 0 && (
                <p className="text-xs text-destructive mt-1">
                  No tienes aprendizajes en tu bitácora. ¡Ve a Mis Aprendizajes y crea uno primero!
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setStep("quiz")}>Atrás</Button>
              <Button onClick={handleFinalize} disabled={!selectedLearning}>
                Desbloquear Habilidad
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddSkillDialog({ 
  categoryId, 
  onAdd 
}: { 
  categoryId: string; 
  onAdd: (catId: string, subName: string, skillName: string) => void 
}) {
  const [open, setOpen] = useState(false);
  const [subName, setSubName] = useState("General");
  const [skillName, setSkillName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName) return;

    onAdd(categoryId, subName || "General", skillName);
    setSkillName("");
    setOpen(false);
    toast.success("Habilidad añadida");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full h-auto py-3 border border-dashed border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Añadir Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Habilidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subname">Rama / Subcategoría</Label>
            <Input
              id="subname"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="E.g. Virreinato, Estrategia, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skillname">Nombre de la Habilidad</Label>
            <Input
              id="skillname"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="E.g. Bazaine, Modelos de negocio..."
            />
          </div>
          <DialogFooter>
            <Button type="submit">Añadir Skill</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SkillTreePage() {
  const { state, toggleSkill, addBonusXp, addCustomSkillCategory, updateLearning } = useAppState();
  const unlocked = state.unlockedSkills || [];
  const [expanded, setExpanded] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    return [...SKILL_TREE_DATA, ...(state.customSkillCategories || [])];
  }, [state.customSkillCategories]);

  const stats = useMemo(() => {
    const total = allCategories.reduce((acc, cat) => 
      acc + cat.subCategories.reduce((sAcc, sub) => sAcc + sub.skills.length, 0), 0
    );
    
    const learningPoints = (state.learnings?.length || 0) * 0.5;
    const count = unlocked.length + Math.floor(learningPoints);
    const percent = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
    
    return { 
      count: unlocked.length, 
      learningCount: state.learnings?.length || 0,
      total, 
      percent 
    };
  }, [unlocked, state.learnings, allCategories]);

  const handleToggle = (id: string, isMultiplier: boolean = false) => {
    toggleSkill(id);
  };

  const handleUnlockWithValidation = (skillId: string, learningId: string, isMultiplier: boolean) => {
    // 1. Unlocked the skill
    toggleSkill(skillId);
    
    // 2. Link the learning record
    const learning = state.learnings?.find(l => l.id === learningId);
    if (learning) {
      updateLearning(learning.id, { skillId });
    }

    // 3. Award XP
    const xp = isMultiplier ? 50 : 35;
    addBonusXp(xp);
    toast.success(`¡Habilidad desbloqueada! +${xp} XP`, { icon: "✨" });
  };

  const handleAddSkill = (catId: string, subName: string, skillName: string) => {
    const cat = allCategories.find(c => c.id === catId);
    if (!cat) return;

    const newSkill: Skill = { id: crypto.randomUUID(), name: skillName };
    const updatedCat = { ...cat };
    const subIdx = updatedCat.subCategories.findIndex(s => s.name === subName);

    if (subIdx >= 0) {
      updatedCat.subCategories[subIdx] = {
        ...updatedCat.subCategories[subIdx],
        skills: [...updatedCat.subCategories[subIdx].skills, newSkill]
      };
    } else {
      updatedCat.subCategories = [
        ...updatedCat.subCategories,
        { name: subName, skills: [newSkill] }
      ];
    }

    addCustomSkillCategory(updatedCat);
  };


  return (
    <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-gradient-primary shadow-glow">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Skill Tree</h1>
          <div className="ml-auto">
            <AddCategoryDialog onAdd={addCustomSkillCategory} />
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Visualiza tu maestría personal. Desbloquea habilidades conforme aprendes y dominas nuevos temas. 
          Las categorías con multiplicador <Sparkles className="inline w-3 h-3 text-amber-500" /> otorgan más XP.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-1">Maestría Total</div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-display font-bold">{stats.percent}%</span>
                <span className="text-xs text-muted-foreground mb-1.5">{stats.count} skills + {stats.learningCount} aprendizajes</span>
              </div>
              <Progress value={stats.percent} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border hidden sm:block">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-1">Poder de Aprendizaje</div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">Lvl {Math.floor(stats.learningCount / 5) + 1}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Basado en bitácora</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {allCategories.map((category) => {
          const catUnlocked = category.subCategories.reduce((acc, sub) => 
            acc + sub.skills.filter(s => unlocked.includes(s.id)).length, 0
          );
          const catTotal = category.subCategories.reduce((acc, sub) => acc + sub.skills.length, 0);
          const catPercent = Math.round((catUnlocked / catTotal) * 100);
          const isExpanded = expanded === category.id;
          const Icon = category.icon;

          return (
            <Card 
              key={category.id} 
              className={`overflow-hidden transition-all duration-300 border-border/50 ${isExpanded ? 'ring-1 ring-primary/30 shadow-lg' : 'hover:border-primary/30 shadow-sm'}`}
            >
              <div 
                className={`h-1.5 w-full bg-gradient-to-r ${category.color}`}
              />
              <CardHeader 
                className="cursor-pointer select-none py-5"
                onClick={() => setExpanded(isExpanded ? null : category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${category.color} text-white shadow-sm`}>
                      {typeof category.icon === 'string' ? (
                        <span className="text-xl leading-none flex items-center justify-center w-5 h-5">{category.icon}</span>
                      ) : (
                        <category.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg md:text-xl font-display font-bold">
                          {category.name}
                        </CardTitle>
                        {category.multiplier && (
                          <span title="Multiplicador de XP activo">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                      <div className="text-sm font-bold">{catPercent}%</div>
                      <div className="text-[10px] text-muted-foreground">{catUnlocked}/{catTotal}</div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <CardContent className="pb-8 px-6 md:px-10 border-t border-border/50 pt-6 bg-secondary/10">
                      <div className="space-y-8">
                        {category.subCategories.map((sub, sIdx) => (
                          <div key={sIdx}>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${category.color}`} />
                              {sub.name}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {sub.skills.map((skill) => {
                                const isUnlocked = unlocked.includes(skill.id);
                                const skillLearnings = state.learnings?.filter(l => l.skillId === skill.id) || [];

                                if (isUnlocked) {
                                  return (
                                    <button
                                      key={skill.id}
                                      onClick={() => handleToggle(skill.id, category.multiplier)}
                                      className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 bg-gradient-to-r ${category.color} border-transparent text-white shadow-md scale-[1.02]`}
                                    >
                                      <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium leading-tight">{skill.name}</span>
                                        {skillLearnings.length > 0 && (
                                          <span className="text-[9px] mt-0.5 font-bold uppercase text-white/80">
                                            {skillLearnings.length} {skillLearnings.length === 1 ? 'Aprendizaje' : 'Aprendizajes'}
                                          </span>
                                        )}
                                      </div>
                                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                                    </button>
                                  );
                                }

                                return (
                                  <UnlockSkillDialog
                                    key={skill.id}
                                    skill={skill}
                                    category={category}
                                    learnings={state.learnings || []}
                                    onUnlock={handleUnlockWithValidation}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <div className="pt-4 border-t border-border/20">
                          <AddSkillDialog 
                            categoryId={category.id} 
                            onAdd={handleAddSkill} 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
