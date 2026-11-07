/**
 * Conversores para `register(campo, { setValueAs })` de React Hook Form.
 * Los <input> siempre entregan texto; estos lo convierten al tipo que espera Zod.
 */

/** "" → null, "45900" → 45900 */
export const aNumeroONulo = (v: unknown): number | null =>
  v === "" || v === null || v === undefined ? null : Number(v);

/** "  " → null, " hola " → "hola" */
export const aTextoONulo = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
