import "server-only";
import ExcelJS from "exceljs";
import { formatoFechaHoraCO } from "@/lib/formato";

export interface Columna<T> {
  titulo: string;
  valor: (fila: T) => string | number | Date | null;
  tipo?: "texto" | "pesos" | "numero" | "fecha" | "porcentaje";
  ancho?: number;
}

export interface Hoja<T = unknown> {
  nombre: string;
  columnas: Columna<T>[];
  filas: T[];
}

/**
 * Evita la "inyección de fórmulas": si una celda de texto empieza con = + - @,
 * Excel la ejecutaría como fórmula al abrir el archivo. Se le antepone un apóstrofo.
 */
function textoSeguro(v: string) {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

export async function generarExcel(hojas: Hoja[], titulo: string): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Glow by Adri";
  libro.created = new Date();
  for (const h of hojas) {
    const hoja = libro.addWorksheet(h.nombre.slice(0, 31), { views: [{ state: "frozen", ySplit: 1 }] });
    hoja.columns = h.columnas.map((c) => ({
      header: c.titulo,
      width: c.ancho ?? (c.tipo === "texto" || !c.tipo ? 28 : 16),
      style:
        c.tipo === "pesos"
          ? { numFmt: '"$"#,##0' }
          : c.tipo === "fecha"
            ? { numFmt: "dd/mm/yyyy hh:mm" }
            : c.tipo === "porcentaje"
              ? { numFmt: "0%" }
              : {},
    }));
    for (const fila of h.filas) {
      hoja.addRow(
        h.columnas.map((c) => {
          const v = c.valor(fila);
          if (typeof v === "string") return textoSeguro(v);
          // Excel guarda fechas sin zona horaria: las convertimos a la hora de Bogotá (UTC-5)
          if (v instanceof Date) return new Date(v.getTime() - 5 * 60 * 60 * 1000);
          return v;
        }),
      );
    }
    const cabecera = hoja.getRow(1);
    cabecera.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cabecera.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE91E8C" } };
    cabecera.alignment = { vertical: "middle" };
    cabecera.height = 22;
    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: h.columnas.length } };
  }
  libro.title = titulo;
  return Buffer.from(await libro.xlsx.writeBuffer());
}

/** CSV con separador ";" y BOM UTF-8: Excel en español lo abre con columnas y tildes correctas. */
export function generarCSV(hoja: Hoja): string {
  const celda = (v: string | number | Date | null) => {
    if (v === null || v === undefined) return "";
    // Decimales con coma: es lo que espera Excel configurado en español (Colombia)
    const s =
      v instanceof Date
        ? formatoFechaHoraCO(v)
        : typeof v === "number"
          ? Number.isInteger(v)
            ? String(v)
            : v.toFixed(4).replace(".", ",")
          : textoSeguro(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [hoja.columnas.map((c) => celda(c.titulo)).join(";"), ...hoja.filas.map((f) => hoja.columnas.map((c) => celda(c.valor(f))).join(";"))];
  return "﻿" + lineas.join("\r\n");
}
