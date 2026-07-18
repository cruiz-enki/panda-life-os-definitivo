/**
 * Hook **Bank Import**: parsea CSV/OFX, deduplica por hash y crea gastos
 * en finance_expenses aplicando reglas de auto-clasificación.
 */
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useMoneyTools } from "@/hooks/use-money-tools";
import { parseStatement, type ParsedTxn } from "@/lib/bank-parser";

export type StagedTxn = ParsedTxn & {
  duplicate: boolean;
  selected: boolean;
  category: string;
  ruleName?: string;
  kind: "expense" | "income";
};

export type BankImportSession = {
  id: string;
  source: string;
  bank: string | null;
  card_id: string | null;
  filename: string | null;
  rows_parsed: number;
  rows_imported: number;
  rows_skipped: number;
  created_at: string;
};

export function useBankImport() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const { applyRules } = useMoneyTools();
  const [staged, setStaged] = useState<StagedTxn[]>([]);
  const [meta, setMeta] = useState<{ bank: string; filename: string | null }>({
    bank: "Auto",
    filename: null,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["bank-import-sessions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("bank_import_sessions" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as unknown as BankImportSession[];
    },
  });

  /** Parsea texto pegado o archivo. Marca duplicados vs hashes existentes. */
  const stage = useCallback(
    async (text: string, opts: { bank?: string; filename?: string | null }) => {
      if (!userId) return { errors: ["no-user"] };
      const res = parseStatement(text, opts.bank);
      if (res.txns.length === 0) {
        setStaged([]);
        return { errors: res.errors };
      }
      const hashes = res.txns.map((t) => t.hash);
      const { data: existing } = await supabase
        .from("bank_import_hashes" as any)
        .select("hash")
        .in("hash", hashes);
      const dupSet = new Set(((existing ?? []) as any[]).map((r) => r.hash));
      const rows: StagedTxn[] = res.txns.map((t) => {
        const isIncome = t.amount < 0;
        const absAmount = Math.abs(t.amount);
        const rule = applyRules({
          amount: absAmount,
          note: t.description,
          date: t.date,
        });
        return {
          ...t,
          duplicate: dupSet.has(t.hash),
          selected: !dupSet.has(t.hash),
          category: rule.category ?? (isIncome ? "Otros ingresos" : "Otros"),
          ruleName: rule.ruleName,
          kind: isIncome ? "income" : "expense",
        };
      });
      setStaged(rows);
      setMeta({ bank: opts.bank ?? res.bank, filename: opts.filename ?? null });
      return { errors: res.errors, count: rows.length };
    },
    [userId, applyRules],
  );

  const toggle = (hash: string) =>
    setStaged((prev) =>
      prev.map((r) => (r.hash === hash ? { ...r, selected: !r.selected } : r)),
    );
  const updateRow = (hash: string, patch: Partial<StagedTxn>) =>
    setStaged((prev) => prev.map((r) => (r.hash === hash ? { ...r, ...patch } : r)));
  const selectAll = (v: boolean) =>
    setStaged((prev) => prev.map((r) => ({ ...r, selected: v && !r.duplicate })));
  const clear = () => setStaged([]);

  /** Commit: crea finance_expenses + bank_import_hashes + session. */
  const commit = async (opts: { cardId?: string | null; paymentMethod?: string }) => {
    if (!userId) return { error: "no-user" };
    const toImport = staged.filter((r) => r.selected && !r.duplicate);
    if (toImport.length === 0) return { error: "nothing-selected" };

    const { data: session, error: sErr } = await supabase
      .from("bank_import_sessions" as any)
      .insert([
        {
          user_id: userId,
          source: /ofx/i.test(meta.filename ?? "") ? "ofx" : "csv",
          bank: meta.bank,
          card_id: opts.cardId ?? null,
          filename: meta.filename,
          rows_parsed: staged.length,
          rows_imported: toImport.length,
          rows_skipped: staged.length - toImport.length,
        } as any,
      ])
      .select()
      .single();
    if (sErr) return { error: sErr.message };
    const sessionId = (session as any).id as string;

    let imported = 0;
    const paymentMethod = opts.paymentMethod ?? (opts.cardId ? "credit" : "debit");

    for (const r of toImport) {
      const amount = Math.abs(r.amount);
      const { data: exp, error: eErr } = await supabase
        .from("finance_expenses")
        .insert([
          {
            user_id: userId,
            amount,
            date: r.date,
            category: r.category,
            payment_method: paymentMethod,
            card_id: opts.cardId ?? null,
            note: r.description.slice(0, 200),
            tags: ["bank-import", ...(r.ruleName ? [`rule:${r.ruleName}`] : [])],
            kind: r.kind,
            expense_type: "normal",
          } as any,
        ])
        .select()
        .single();
      if (eErr) continue;
      await supabase.from("bank_import_hashes" as any).insert([
        {
          user_id: userId,
          hash: r.hash,
          session_id: sessionId,
          expense_id: (exp as any).id,
        } as any,
      ]);
      imported++;
    }

    await qc.invalidateQueries({ queryKey: ["finance"] });
    await qc.invalidateQueries({ queryKey: ["bank-import-sessions"] });
    setStaged([]);
    return { imported, sessionId };
  };

  return {
    sessions,
    staged,
    meta,
    stage,
    toggle,
    updateRow,
    selectAll,
    clear,
    commit,
  };
}
