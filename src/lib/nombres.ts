/** "Labial Mate" + "Tono 03" → "Labial Mate (Tono 03)". Las variantes "Única" no repiten el nombre. */
export function nombreCompleto(producto: string, variante: string) {
  return variante === "Única" ? producto : `${producto} (${variante})`;
}
