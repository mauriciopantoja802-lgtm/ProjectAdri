import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";

export const ETIQUETA_CATALOGO = "catalogo";

/** Refresca la tienda pública (que se cachea 5 minutos) después de un cambio en el panel. */
export function revalidarTienda() {
  revalidateTag(ETIQUETA_CATALOGO);
  revalidatePath("/", "layout");
}
