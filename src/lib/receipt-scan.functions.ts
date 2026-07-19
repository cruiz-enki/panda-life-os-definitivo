/**
 * Cliente para invocar la edge function **ai-scan-receipt** en Supabase.
 * Usa tu OPENAI_API_KEY (no Lovable AI Gateway).
 */
import { supabase } from "@/integrations/supabase/client";

export type ScannedReceipt = {
  amount: number | null;
  date: string | null;
  merchant: string | null;
  category: string | null;
  payment_method: "cash" | "debit" | "credit" | "transfer" | "other" | null;
  note: string | null;
  confidence: "high" | "medium" | "low";
};

export async function scanReceipt(input: {
  data: { imageDataUrl: string; categories: string[]; today: string };
}): Promise<ScannedReceipt> {
  const { data, error } = await supabase.functions.invoke("ai-scan-receipt", {
    body: input.data,
  });
  if (error) throw new Error(error.message);
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as ScannedReceipt;
}
