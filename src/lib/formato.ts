/**
 * Formatos para Colombia: pesos sin decimales y fechas en la zona horaria de Bogotá.
 */

export const ZONA_HORARIA = "America/Bogota";
const LOCALE = "es-CO";

const formatoNumero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** 45900 → "$45.900" */
export function formatoCOP(valor: number): string {
  const signo = valor < 0 ? "-" : "";
  return `${signo}$${formatoNumero.format(Math.abs(Math.round(valor)))}`;
}

/** 1250 → "1.250" */
export function formatoNumeroCO(valor: number): string {
  return formatoNumero.format(valor);
}

type EntradaFecha = Date | string | number;

const formatoFechaCorta = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const formatoFechaLarga = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatoFechaHora = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** "04/11/2026" */
export function formatoFecha(fecha: EntradaFecha): string {
  return formatoFechaCorta.format(new Date(fecha));
}

/** "4 de noviembre de 2026" */
export function formatoFechaTexto(fecha: EntradaFecha): string {
  return formatoFechaLarga.format(new Date(fecha));
}

/** "04/11/2026, 02:35 p. m." */
export function formatoFechaHoraCO(fecha: EntradaFecha): string {
  return formatoFechaHora.format(new Date(fecha));
}

/**
 * Inicio y fin (exclusivo) de un día en Bogotá, como fechas UTC para consultar la BD.
 * Colombia no tiene horario de verano: siempre es UTC-5.
 */
export function rangoDiaBogota(dia: string): { desde: Date; hasta: Date } {
  const desde = new Date(`${dia}T00:00:00-05:00`);
  return { desde, hasta: new Date(desde.getTime() + 24 * 60 * 60 * 1000) };
}

/** Devuelve "AAAA-MM-DD" del día en Bogotá (útil para agrupar ventas por día). */
export function claveDiaBogota(fecha: EntradaFecha): string {
  // en-CA produce el formato ISO AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fecha));
}
