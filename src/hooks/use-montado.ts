"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve true solo después de que el componente se montó en el navegador.
 * Sirve para mostrar datos de localStorage (como el carrito) sin errores de
 * hidratación: el servidor no conoce el carrito, así que al principio no se muestra.
 */
export function useMontado(): boolean {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}
