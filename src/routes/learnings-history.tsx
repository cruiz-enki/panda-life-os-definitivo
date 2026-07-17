/**
 * **Ruta** — Historial completo de aprendizajes.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  Sparkles, 
  BookOpen, 
  Plus,
  Trash2,
  Calendar,
  Search,
  BookOpenCheck,
  Trophy,
  ChevronDown,
  Pencil
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState, type Learning } from "@/lib/storage";
import { toast } from "sonner";
import { todayCDMX } from "@/lib/date-utils";
import { SKILL_TREE_DATA } from "@/lib/skills-data";


export const Route = createFileRoute("/learnings-history")({
  head: () => ({
    meta: [
      { title: "Aprendizajes · Panda's LIFE OS" },
      { name: "description", content: "Tu bitácora personal de aprendizajes y conocimientos adquiridos." },
    ],
  }),
  component: LearningsPage,
});

function LearningsPage() {
  const { state, addLearning, deleteLearning, updateLearning } = useAppState();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newSkillId, setNewSkillId] = useState("");

  const allSkills = useMemo(() => {
    return SKILL_TREE_DATA.flatMap(cat => 
      cat.subCategories.flatMap(sub => 
        sub.skills.map(skill => ({
          ...skill,
          categoryName: cat.name
        }))
      )
    );
  }, []);


  const filtered = useMemo(() => {
    return state.learnings.filter(l => 
      l.title.toLowerCase().includes(search.toLowerCase()) || 
      l.notes.toLowerCase().includes(search.toLowerCase())
    );
  }, [state.learnings, search]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    if (editingId) {
      updateLearning(editingId, {
        title: newTitle,
        notes: newNotes,
        skillId: newSkillId || undefined
      });
      toast.success("Aprendizaje actualizado");
    } else {
      addLearning({
        title: newTitle,
        notes: newNotes,
        category: "other",
        skillId: newSkillId || undefined
      });
      toast.success("Aprendizaje guardado");
    }
    
    setNewTitle("");
    setNewNotes("");
    setNewSkillId("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (learning: Learning) => {
    setEditingId(learning.id);
    setNewTitle(learning.title);
    setNewNotes(learning.notes);
    setNewSkillId(learning.skillId || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => {
    setNewTitle("");
    setNewNotes("");
    setNewSkillId("");
    setEditingId(null);
    setShowForm(false);
  };


  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto pb-24">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight flex items-center gap-3">
            <BookOpenCheck className="w-10 h-10 text-primary" />
            Mis Aprendizajes
          </h1>
          <p className="mt-2 text-muted-foreground">Tu base de conocimientos personal 🐼📜</p>
        </div>
        <button 
          onClick={() => {
            if (showForm && !editingId) setShowForm(false);
            else {
              setEditingId(null);
              setNewTitle("");
              setNewNotes("");
              setNewSkillId("");
              setShowForm(true);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nuevo Aprendizaje
        </button>
      </header>

      {showForm && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{editingId ? "Editar aprendizaje" : "¿Qué aprendiste?"}</label>
                <input 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: La vida de Bazaine"
                  className="w-full px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 ring-primary/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Relacionar con Habilidad (Skill Tree)</label>
                <div className="relative">
                  <select
                    value={newSkillId}
                    onChange={e => setNewSkillId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 ring-primary/20 appearance-none pr-10 text-sm"
                  >
                    <option value="">-- Ninguna habilidad --</option>
                    {SKILL_TREE_DATA.map(cat => (
                      <optgroup key={cat.id} label={cat.name}>
                        {cat.subCategories.flatMap(sub => 
                          sub.skills.map(skill => (
                            <option key={skill.id} value={skill.id}>
                              {skill.name}
                            </option>
                          ))
                        )}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Notas / Detalles</label>
                <textarea 
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Detalles sobre este aprendizaje..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 ring-primary/20 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={cancelForm} className="px-4 py-2 text-sm text-muted-foreground">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold">
                  {editingId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en tus aprendizajes..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/30 border border-border focus:outline-none focus:ring-2 ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 text-center py-20 rounded-3xl border border-dashed border-border">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No se encontraron aprendizajes.</p>
          </div>
        ) : (
          filtered.map((l) => {
            const skill = allSkills.find(s => s.id === l.skillId);
            return (
              <Card key={l.id} className="group border-border bg-card hover:border-primary/30 transition-all flex flex-col relative overflow-hidden">
                <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{l.date}</span>
                      </div>
                      {skill && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                          <Trophy className="w-2.5 h-2.5" />
                          {skill.name}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg font-display font-bold leading-tight truncate pr-8">{l.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all absolute top-2 right-2">
                    <button 
                      onClick={() => startEdit(l)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteLearning(l.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{l.notes}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
