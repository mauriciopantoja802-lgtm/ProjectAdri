import type { Metadata } from "next";
import { PaginaTexto } from "@/components/tienda/pagina-texto";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { formatoCOP } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Envíos y devoluciones",
  description: "Domicilios en Popayán, envíos a toda Colombia, recogida en tienda, cambios, retracto y devoluciones.",
  alternates: { canonical: "/envios-y-devoluciones" },
};

export default async function EnviosDevoluciones() {
  const c = await obtenerConfiguracion();
  return (
    <PaginaTexto titulo="Envíos y devoluciones" actualizado="noviembre de 2026">
      <h2>Formas de entrega</h2>
      <ul>
        <li>
          <strong>Recoger en la tienda:</strong> gratis. Te avisamos por WhatsApp cuando tu pedido esté listo en {c.direccion} ({c.horario}).
        </li>
        <li>
          <strong>Domicilio en {c.ciudad}:</strong> {formatoCOP(c.costoDomicilio)}. Normalmente entregamos el mismo día o al día siguiente hábil.
        </li>
        <li>
          <strong>Envío nacional:</strong> {formatoCOP(c.costoNacional)} por transportadora. Llega entre 2 y 5 días hábiles según la ciudad. Te enviamos el número de guía por WhatsApp.
        </li>
      </ul>
      {c.envioGratisDesde ? <p>🎉 El envío es <strong>gratis</strong> en compras desde {formatoCOP(c.envioGratisDesde)}.</p> : null}

      <h2>Pago contra entrega</h2>
      <p>Disponible para domicilios en {c.ciudad} y para pedidos que recoges en la tienda. Para envíos nacionales el pago es anticipado (en línea o por transferencia).</p>

      <h2>Derecho de retracto (compras por internet)</h2>
      <p>
        Según el artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor), en las compras hechas por la página web o por WhatsApp puedes retractarte dentro de los
        <strong> cinco (5) días hábiles</strong> siguientes a la entrega. El producto debe devolverse en las mismas condiciones en que lo recibiste:
        <strong> sellado, sin abrir y sin uso</strong>, ya que por higiene los cosméticos abiertos no pueden volver a venderse. Los costos de transporte de la devolución corren por tu cuenta. Te
        devolvemos el dinero en un plazo máximo de 30 días calendario.
      </p>

      <h2>Cambios y garantía</h2>
      <ul>
        <li>Puedes cambiar un producto sellado por otro tono o referencia dentro de los 5 días siguientes a la compra, presentando tu comprobante.</li>
        <li>Si un producto llega defectuoso, dañado o vencido, escríbenos con una foto dentro de los 5 días siguientes: lo cambiamos sin costo o te devolvemos el dinero.</li>
        <li>No aceptamos cambios de productos abiertos o usados, salvo por defectos de calidad.</li>
      </ul>

      <h2>Reversión del pago</h2>
      <p>
        Si pagaste en línea y fuiste víctima de fraude, la operación no fue solicitada, el producto no fue recibido o no corresponde a lo solicitado, puedes pedir la
        reversión del pago (artículo 51 de la Ley 1480 de 2011) dentro de los cinco (5) días hábiles siguientes a que conociste el hecho, avisándonos y avisando a tu banco.
      </p>

      <h2>¿Cómo solicitar un cambio o devolución?</h2>
      <p>Escríbenos por WhatsApp con tu número de pedido (#GA-XXXX) y te indicamos los pasos.</p>
    </PaginaTexto>
  );
}
