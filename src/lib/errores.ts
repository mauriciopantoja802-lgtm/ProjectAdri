/**
 * Error de regla de negocio (ej: "no hay stock suficiente").
 * Su mensaje se muestra tal cual a la usuaria, por eso siempre va en español y sin datos técnicos.
 */
export class ErrorNegocio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorNegocio";
  }
}
