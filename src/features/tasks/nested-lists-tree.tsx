/**
 * **NestedListsTree** — sidebar de listas de tareas con jerarquía padre → hijo,
 * drag & drop para reordenar entre hermanos y anidar bajo otra lista.
 *
 * - Drop en el centro (>25% desde arriba, <75%): anida como hijo.
 * - Drop cerca del borde superior: reinserta encima del target (mismo padre).
 * - Drop cerca del borde inferior: reinserta debajo (mismo padre).
 */
import { useMemo, useState } from "react";
import type { Task, TaskList } from "@/lib/storage";
import { ChevronDown, ChevronRight, Edit3, Trash2 } from "lucide-react";

type Props = {
  lists: TaskList[];
  tasks: Task[];
  activeView: string;
  onSelect: (id: string) => void;
  onDelete: (list: TaskList) => void;
  onEdit: (id: string) => void;
  onReorder: (orderedIds: string[], parentId: string | null) => void;
  onSetParent: (childId: string, parentId: string | null) => void;
};

type DropZone = "before" | "after" | "inside" | null;

export function NestedListsTree({
  lists,
  tasks,
  activeView,
  onSelect,
  onDelete,
  onEdit,
  onReorder,
  onSetParent,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState<{ id: string; zone: DropZone } | null>(null);

  const { childrenOf, roots } = useMemo(() => {
    const bySort = [...lists].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    );
    const map = new Map<string | null, TaskList[]>();
    for (const l of bySort) {
      const key = l.parentId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return { childrenOf: map, roots: map.get(null) ?? [] };
  }, [lists]);

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const countTasks = (listId: string) =>
    tasks.filter((t) => t.listId === listId && t.status !== "completed").length;

  // Evita ciclos: no se puede mover un padre bajo un descendiente propio.
  const isDescendantOf = (candidate: string, ancestor: string): boolean => {
    const kids = childrenOf.get(ancestor) ?? [];
    for (const k of kids) {
      if (k.id === candidate) return true;
      if (isDescendantOf(candidate, k.id)) return true;
    }
    return false;
  };

  const handleDrop = (targetId: string, targetParentId: string | null, zone: DropZone) => {
    const draggedId = dragging;
    setDragging(null);
    setDropOver(null);
    if (!draggedId || !zone || draggedId === targetId) return;
    if (isDescendantOf(targetId, draggedId)) return;

    if (zone === "inside") {
      onSetParent(draggedId, targetId);
      return;
    }
    // before / after: reordenar dentro de targetParentId
    const siblings = (childrenOf.get(targetParentId) ?? []).map((l) => l.id).filter((id) => id !== draggedId);
    const idx = siblings.indexOf(targetId);
    const insertAt = zone === "before" ? idx : idx + 1;
    const newOrder = [...siblings.slice(0, insertAt), draggedId, ...siblings.slice(insertAt)];
    // Si venía de otro padre, primero muévelo
    const dragged = lists.find((l) => l.id === draggedId);
    if (dragged && (dragged.parentId ?? null) !== targetParentId) {
      onSetParent(draggedId, targetParentId);
    }
    onReorder(newOrder, targetParentId);
  };

  const renderNode = (list: TaskList, depth: number) => {
    const kids = childrenOf.get(list.id) ?? [];
    const active = activeView === list.id;
    const isCollapsed = collapsed.has(list.id);
    const count = countTasks(list.id);
    const isDragOver = dropOver?.id === list.id;

    return (
      <div key={list.id} className="select-none">
        <div
          className="group relative"
          draggable
          onDragStart={(e) => {
            setDragging(list.id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", list.id);
          }}
          onDragEnd={() => { setDragging(null); setDropOver(null); }}
          onDragOver={(e) => {
            if (!dragging || dragging === list.id) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const y = e.clientY - rect.top;
            const h = rect.height;
            let zone: DropZone = "inside";
            if (y < h * 0.25) zone = "before";
            else if (y > h * 0.75) zone = "after";
            setDropOver({ id: list.id, zone });
          }}
          onDragLeave={(e) => {
            const next = (e.relatedTarget as Node | null);
            if (next && (e.currentTarget as HTMLElement).contains(next)) return;
            if (dropOver?.id === list.id) setDropOver(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (!dropOver || dropOver.id !== list.id) return;
            handleDrop(list.id, list.parentId ?? null, dropOver.zone);
          }}
        >
          {isDragOver && dropOver?.zone === "before" && (
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary rounded-full" />
          )}
          {isDragOver && dropOver?.zone === "after" && (
            <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary rounded-full" />
          )}
          <button
            onClick={() => onSelect(list.id)}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            className={`w-full flex items-center gap-1.5 pr-2 py-2 rounded-xl text-sm transition-all ${
              active
                ? "bg-primary/15 text-primary font-medium"
                : isDragOver && dropOver?.zone === "inside"
                  ? "bg-primary/20"
                  : "hover:bg-secondary/50 text-foreground/80"
            }`}
          >
            {kids.length > 0 ? (
              <span
                onClick={(e) => { e.stopPropagation(); toggle(list.id); }}
                className="p-0.5 rounded hover:bg-secondary/70 text-muted-foreground shrink-0"
                aria-label={isCollapsed ? "Expandir" : "Colapsar"}
              >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </span>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span>{list.emoji}</span>
            <span className="flex-1 text-left truncate">{list.name}</span>
            {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
          </button>
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(list.id); }}
              className="text-muted-foreground hover:text-primary p-1"
              aria-label="Editar lista"
              title="Editar"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(list); }}
              className="text-muted-foreground hover:text-destructive p-1"
              aria-label="Eliminar lista"
              title="Eliminar"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {!isCollapsed && kids.length > 0 && (
          <div className="space-y-0.5 mt-0.5">
            {kids.map((k) => renderNode(k, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="space-y-1"
      onDragOver={(e) => {
        // Permite soltar en zona vacía para llevar al root
        if (!dragging) return;
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (!dragging) return;
        // Si no hay hover específico, mover al root al final
        if (!dropOver) {
          const rootSiblings = roots.map((l) => l.id).filter((id) => id !== dragging);
          onSetParent(dragging, null);
          onReorder([...rootSiblings, dragging], null);
        }
        setDragging(null);
        setDropOver(null);
      }}
    >
      {roots.map((l) => renderNode(l, 0))}
      {roots.length === 0 && (
        <p className="text-[11px] text-muted-foreground px-3 py-2">Aún no hay listas.</p>
      )}
    </div>
  );
}
