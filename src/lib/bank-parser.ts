/**
 * Parser de estados de cuenta bancarios: CSV (BBVA, Nu, genérico) y OFX.
 * Devuelve movimientos normalizados listos para importar como finance_expenses.
 */

export type ParsedTxn = {
  date: string;        // YYYY-MM-DD
  amount: number;      // positivo = gasto, negativo = abono/ingreso
  description: string;
  raw: string;         // línea original para debug
  hash: string;        // dedup key
};

export type ParseResult = {
  bank: string;
  txns: ParsedTxn[];
  errors: string[];
};

/** Normaliza descripción para hash: minúsculas, colapsa espacios, quita acentos. */
function normDesc(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hash simple djb2 (suficiente para dedup local, no criptográfico). */
function hashKey(date: string, amount: number, desc: string): string {
  const key = `${date}|${amount.toFixed(2)}|${normDesc(desc)}`;
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  return `bnk_${(h >>> 0).toString(36)}`;
}

/** Parsea fechas comunes: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YY. */
function parseDate(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  // YYYY-MM-DD
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // DD/MM/YYYY o DD-MM-YYYY
  m = t.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // DD/MM/YY
  m = t.match(/^(\d{2})[/-](\d{2})[/-](\d{2})$/);
  if (m) {
    const yy = Number(m[3]);
    const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;
    return `${yyyy}-${m[2]}-${m[1]}`;
  }
  // OFX YYYYMMDD
  m = t.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

/** Parsea monto MXN: "$1,234.56" o "1234.56" o "-500,00". */
function parseAmount(s: string): number | null {
  if (!s) return null;
  let t = s.replace(/[$\s]/g, "").trim();
  if (!t) return null;
  const isNeg = /^-/.test(t) || /^\(.*\)$/.test(t);
  t = t.replace(/^\(/, "").replace(/\)$/, "").replace(/^-/, "");
  // Si tiene coma como decimal (formato europeo)
  if (/,\d{1,2}$/.test(t) && !/\.\d/.test(t)) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else {
    t = t.replace(/,/g, "");
  }
  const n = Number(t);
  if (isNaN(n)) return null;
  return isNeg ? -n : n;
}

/** Detecta separador CSV predominante. */
function detectDelim(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const n = line.split(c).length;
    if (n > bestCount) {
      best = c;
      bestCount = n;
    }
  }
  return best;
}

/** Split CSV con soporte básico de comillas dobles. */
function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === delim && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

const HEADER_HINTS = {
  date: ["fecha", "date", "fecha operacion", "fecha op", "posting date", "trans date"],
  amount: ["monto", "importe", "amount", "valor", "cargo", "abono", "debito", "credito"],
  charge: ["cargo", "debito", "débito", "retiro", "compra"],
  credit: ["abono", "credito", "crédito", "deposito", "depósito", "pago"],
  desc: ["descripcion", "descripción", "concepto", "detalle", "description", "memo", "referencia"],
};

function matchIdx(headers: string[], hints: string[]): number {
  const norm = headers.map((h) => normDesc(h));
  for (const hi of hints) {
    const i = norm.findIndex((h) => h.includes(hi));
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Parser CSV genérico. Detecta encabezados de fecha, monto/cargo/abono y descripción.
 * Compatible con exportaciones típicas de BBVA México, Nu, HSBC, Banorte y Citibanamex.
 */
export function parseBankCsv(text: string, bank = "Auto"): ParseResult {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { bank, txns: [], errors: ["CSV vacío o sin filas"] };
  }
  const delim = detectDelim(text);

  // Encuentra la primera fila que parezca encabezado (contiene "fecha" o "date")
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const norm = normDesc(lines[i]);
    if (/fecha|date/.test(norm) && /(monto|importe|amount|cargo|abono|debito|credito)/.test(norm)) {
      headerIdx = i;
      break;
    }
  }
  const headers = splitCsvLine(lines[headerIdx], delim);
  const iDate = matchIdx(headers, HEADER_HINTS.date);
  const iAmount = matchIdx(headers, HEADER_HINTS.amount);
  const iCharge = matchIdx(headers, HEADER_HINTS.charge);
  const iCredit = matchIdx(headers, HEADER_HINTS.credit);
  const iDesc = matchIdx(headers, HEADER_HINTS.desc);

  if (iDate < 0) {
    return { bank, txns: [], errors: ["No se encontró columna de fecha"] };
  }
  if (iAmount < 0 && iCharge < 0 && iCredit < 0) {
    return { bank, txns: [], errors: ["No se encontró columna de monto/cargo/abono"] };
  }

  const txns: ParsedTxn[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    const cols = splitCsvLine(raw, delim);
    const date = parseDate(cols[iDate] ?? "");
    if (!date) continue;

    let amount: number | null = null;
    if (iAmount >= 0) {
      amount = parseAmount(cols[iAmount] ?? "");
    } else {
      const cargo = iCharge >= 0 ? parseAmount(cols[iCharge] ?? "") : null;
      const abono = iCredit >= 0 ? parseAmount(cols[iCredit] ?? "") : null;
      if (cargo && cargo !== 0) amount = Math.abs(cargo);
      else if (abono && abono !== 0) amount = -Math.abs(abono);
    }
    if (amount === null || amount === 0) continue;

    const description = iDesc >= 0 ? cols[iDesc] ?? "" : cols.filter((_, k) => k !== iDate && k !== iAmount).join(" ").slice(0, 200);
    txns.push({
      date,
      amount,
      description,
      raw,
      hash: hashKey(date, amount, description),
    });
  }
  return { bank, txns, errors };
}

/** Parser OFX (Open Financial Exchange) — busca bloques STMTTRN. */
export function parseOfx(text: string, bank = "OFX"): ParseResult {
  const errors: string[] = [];
  const txns: ParsedTxn[] = [];
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  for (const b of blocks) {
    const dt = b.match(/<DTPOSTED>([^<\s]+)/i)?.[1];
    const amt = b.match(/<TRNAMT>([^<\s]+)/i)?.[1];
    const memo = b.match(/<MEMO>([^<]+)/i)?.[1] ?? b.match(/<NAME>([^<]+)/i)?.[1] ?? "";
    const date = dt ? parseDate(dt) : null;
    const amountRaw = amt ? parseAmount(amt) : null;
    if (!date || amountRaw === null) continue;
    // En OFX, TRNAMT negativo = gasto → invertir para nuestra convención
    const amount = -amountRaw;
    txns.push({
      date,
      amount,
      description: memo.trim(),
      raw: b,
      hash: hashKey(date, amount, memo),
    });
  }
  if (blocks.length === 0) errors.push("No se encontraron transacciones OFX (<STMTTRN>)");
  return { bank, txns, errors };
}

/** Detecta tipo por contenido y ejecuta el parser adecuado. */
export function parseStatement(text: string, hintBank?: string): ParseResult {
  const t = text.trim();
  if (/<OFX|<STMTTRN/i.test(t)) return parseOfx(t, hintBank ?? "OFX");
  return parseBankCsv(t, hintBank ?? "Auto");
}
