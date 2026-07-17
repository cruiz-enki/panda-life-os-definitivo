/**
 * **Ruta** — Admin: gestión de invitaciones.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsOwner } from "@/hooks/use-is-owner";
import { Trash2, UserPlus, ShieldCheck, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invites")({
  head: () => ({
    meta: [{ title: "Invitados · Panda's LIFE OS" }],
  }),
  component: InvitesPage,
});

type AllowedEmail = {
  id: string;
  email: string;
  is_owner: boolean;
  note: string | null;
  created_at: string;
};

function InvitesPage() {
  const { isOwner, loading: roleLoading } = useIsOwner();
  const navigate = useNavigate();
  const [list, setList] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isOwner) {
      navigate({ to: "/" });
    }
  }, [isOwner, roleLoading, navigate]);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("allowed_emails")
      .select("id,email,is_owner,note,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList((data as AllowedEmail[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isOwner) refresh();
  }, [isOwner]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setBusy(true);
    const { error } = await supabase
      .from("allowed_emails")
      .insert({ email: clean, note: note.trim() || null });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${clean} invitado`);
    setEmail("");
    setNote("");
    refresh();
  };

  const remove = async (row: AllowedEmail) => {
    if (row.is_owner) {
      toast.error("No puedes quitar al owner.");
      return;
    }
    if (!confirm(`¿Quitar acceso a ${row.email}? Su sesión actual seguirá activa hasta que cierre.`)) return;
    const { error } = await supabase.from("allowed_emails").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Acceso revocado");
    refresh();
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-3xl animate-pulse">🐼</div>
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h1 className="font-display text-3xl font-bold">Invitados</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Esta app es privada. Solo los emails de esta lista pueden crear cuenta o iniciar sesión.
      </p>

      <form onSubmit={add} className="rounded-2xl border border-border bg-card p-5 mb-8 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <UserPlus className="w-4 h-4" /> Invitar a alguien
        </div>
        <input
          type="email"
          required
          placeholder="email@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary"
        />
        <input
          type="text"
          placeholder="Nota (opcional, ej: 'mi hermano')"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-50"
        >
          {busy ? "Añadiendo..." : "Añadir invitado"}
        </button>
      </form>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
          {list.length} email{list.length === 1 ? "" : "s"} autorizado{list.length === 1 ? "" : "s"}
        </div>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando...</div>
        ) : list.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Sin invitados aún.</div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                {row.is_owner ? (
                  <Crown className="w-4 h-4 text-[var(--xp)]" />
                ) : (
                  <span className="w-4 h-4" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{row.email}</div>
                  {row.note && <div className="text-xs text-muted-foreground truncate">{row.note}</div>}
                </div>
                {!row.is_owner && (
                  <button
                    onClick={() => remove(row)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    title="Revocar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 text-xs text-muted-foreground space-y-1">
        <p>• El email debe ser exactamente el que tu invitado use para registrarse (case-insensitive).</p>
        <p>• Funciona tanto con email/contraseña como con Google.</p>
        <p>• Revocar el acceso impide nuevos logins; para forzar el cierre de sesión actual, bórrale el usuario desde Cloud → Users.</p>
      </div>
    </div>
  );
}
