/**
 * Agrupa los colores de los tonos en familias para el filtro "Tono" del catálogo.
 * Se calcula con el color hex de cada variante, así Adri no tiene que clasificar nada a mano.
 */
export const FAMILIAS_TONO = {
  rojos: { etiqueta: "Rojos", muestra: "#B3001B" },
  rosados: { etiqueta: "Rosados", muestra: "#F48FB1" },
  corales: { etiqueta: "Corales", muestra: "#FF7F6E" },
  nudes: { etiqueta: "Nudes", muestra: "#D8A7A0" },
  cafes: { etiqueta: "Cafés", muestra: "#6B4430" },
  morados: { etiqueta: "Morados", muestra: "#8E24AA" },
  negros: { etiqueta: "Negros", muestra: "#111111" },
  blancos: { etiqueta: "Blancos y claros", muestra: "#F5F0EE" },
} as const;

export type FamiliaTono = keyof typeof FAMILIAS_TONO;

function aHSL(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

export function familiaDeColor(hex: string | null): FamiliaTono | null {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const { h, s, l } = aHSL(hex);
  if (l >= 0.92) return "blancos";
  if (l <= 0.16 || (s < 0.12 && l < 0.5)) return "negros";
  if (s < 0.12) return "blancos";
  if (h >= 255 && h < 300) return "morados";
  if (h >= 300 && h < 345) return l < 0.38 ? "rojos" : "rosados";
  if (h >= 345 || h < 5) return l > 0.62 && s < 0.5 ? "nudes" : "rojos";
  if (h < 20) return s >= 0.5 && l > 0.55 ? "corales" : s < 0.45 ? "nudes" : "rojos";
  if (h < 50) return l < 0.5 ? "cafes" : s > 0.75 && l < 0.8 ? "corales" : "nudes";
  return l < 0.4 ? "cafes" : "nudes";
}
