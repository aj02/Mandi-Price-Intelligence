import { z } from "zod";

const numLike = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined || v === "" || v === "NR" || v === "NA")
      return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  });

const strLike = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null ? null : String(v).trim() || null));

const reqStr = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .pipe(z.string().min(1));

export const AgmarkRecordSchema = z
  .object({
    state: reqStr,
    district: reqStr,
    market: reqStr,
    commodity: reqStr,
    variety: strLike.optional(),
    grade: strLike.optional(),
    arrival_date: reqStr,
    min_price: numLike,
    max_price: numLike,
    modal_price: numLike,
  })
  .passthrough();

export type AgmarkRecord = z.infer<typeof AgmarkRecordSchema>;

export const AgmarkResponseSchema = z
  .object({
    records: z.array(z.unknown()).default([]),
    total: z.union([z.number(), z.string()]).optional(),
    count: z.union([z.number(), z.string()]).optional(),
    limit: z.union([z.number(), z.string()]).optional(),
    offset: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

export function parseAgmarkDate(s: string): string | null {
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  }
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export function ddmmyyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}
