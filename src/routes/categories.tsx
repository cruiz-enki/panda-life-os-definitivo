/**
 * **Ruta** — Categorías de finanzas (CRUD).
 */
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useFinance } from "@/hooks/use-finance";
import { DEFAULT_CATEGORIES, type FinanceCategory, type ExpenseKind } from "@/lib/finance-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categorías — ENKI Life OS" },
      { name: "description", content: "Gestiona tus categorías de gastos e ingresos" },
    ],
  }),
  component: CategoriesPage,
});

const DEFAULT_COLOR = "oklch(0.65 0.20 260)";

function CategoriesPage() {
  const { categories, createCategory, updateCategory, deleteCategory, loading } = useFinance();
  const [editing, setEditing] = useState<FinanceCategory | null>(null);
  const [form, setForm] = useState<{ name: string; emoji: string; kind: ExpenseKind; color: string }>({
    name: "",
    emoji: "📦",
    kind: "expense",
    color: DEFAULT_COLOR,
  });

  const startCreate = () => {
    setEditing(null);
    setForm({ name: "", emoji: "📦", kind: "expense", color: DEFAULT_COLOR });
  };

  const startEdit = (c: FinanceCategory) => {
    setEditing(c);
    setForm({ name: c.name, emoji: c.emoji || "📦", kind: c.kind, color: c.color || DEFAULT_COLOR });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Ponle un nombre");
    if (editing) {
      const err = await updateCategory(editing.id, form);
      if (err) return toast.error(err.message);
      toast.success("Categoría actualizada");
    } else {
      const err = await createCategory(form);
      if (err) return toast.error(err.message);
      toast.success("Categoría creada");
    }
    startCreate();
  };

  const remove = async (c: FinanceCategory) => {
    if (!confirm(`¿Eliminar "${c.name}"? Los gastos que la usan quedarán con el nombre pero sin vínculo.`)) return;
    const err = await deleteCategory(c.id);
    if (err) return toast.error(err.message);
    toast.success("Eliminada");
  };

  const seedDefaults = async () => {
    const existing = new Set(categories.map((c) => c.name.toLowerCase()));
    const missing = DEFAULT_CATEGORIES.filter((d) => !existing.has(d.name.toLowerCase()));
    if (missing.length === 0) return toast.info("Ya tienes todas las categorías default");
    for (const d of missing) {
      await createCategory({ name: d.name, emoji: d.emoji, kind: d.kind, color: DEFAULT_COLOR });
    }
    toast.success(`Agregadas ${missing.length}`);
  };

  const expenses = categories.filter((c) => c.kind === "expense");
  const incomes = categories.filter((c) => c.kind === "income");

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link to="/finance">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Categorías</h1>
            <p className="text-sm text-muted-foreground">Personaliza cómo clasificas tus gastos e ingresos</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={seedDefaults}>
          <Sparkles className="w-4 h-4 mr-1" /> Cargar default
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editing ? "Editar categoría" : "Nueva categoría"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[80px,1fr] gap-3">
            <div>
              <Label>Emoji</Label>
              <Input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                maxLength={4}
                className="text-center text-xl"
              />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Café, Uber, Renta"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as ExpenseKind })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="income">Ingreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <Input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="oklch(...) o #hex"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} className="flex-1">
              <Plus className="w-4 h-4 mr-1" /> {editing ? "Guardar cambios" : "Crear"}
            </Button>
            {editing && (
              <Button variant="outline" onClick={startCreate}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <CategoryList title="Gastos" items={expenses} onEdit={startEdit} onDelete={remove} loading={loading} />
      <CategoryList title="Ingresos" items={incomes} onEdit={startEdit} onDelete={remove} loading={loading} />
    </div>
  );
}

function CategoryList({
  title, items, onEdit, onDelete, loading,
}: {
  title: string;
  items: FinanceCategory[];
  onEdit: (c: FinanceCategory) => void;
  onDelete: (c: FinanceCategory) => void;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant="secondary">{items.length}</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tienes categorías de este tipo.</p>
        ) : (
          <ul className="divide-y">
            {items.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <span className="text-2xl">{c.emoji || "📦"}</span>
                <span className="flex-1 font-medium">{c.name}</span>
                <Button variant="ghost" size="icon" onClick={() => onEdit(c)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(c)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
