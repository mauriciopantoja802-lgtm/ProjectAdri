import type { Metadata } from "next";
import Link from "next/link";
import { PaginaTexto } from "@/components/tienda/pagina-texto";
import { obtenerConfiguracion } from "@/features/configuracion/queries";

export const metadata: Metadata = { title: "Términos y condiciones", alternates: { canonical: "/terminos" } };

export default async function Terminos() {
  const c = await obtenerConfiguracion();
  return (
    <PaginaTexto titulo="Términos y condiciones" actualizado="noviembre de 2026">
      <p>
        Estos términos regulan el uso de la tienda en línea de <strong>{c.nombre}</strong>, establecimiento de comercio ubicado en {c.direccion}, {c.ciudad} (Colombia),
        de propiedad de [NOMBRE COMPLETO DE LA PROPIETARIA], identificada con [CÉDULA / NIT]. Al hacer un pedido aceptas estas condiciones.
      </p>
      <h2>1. Productos y precios</h2>
      <ul>
        <li>Los precios están en pesos colombianos (COP) e incluyen los impuestos aplicables. El costo de envío se muestra antes de confirmar el pedido.</li>
        <li>Las imágenes son ilustrativas; el tono puede variar ligeramente según la pantalla.</li>
        <li>Las ofertas son válidas hasta agotar existencias o hasta la fecha indicada.</li>
      </ul>
      <h2>2. Pedidos</h2>
      <ul>
        <li>Un pedido se considera confirmado cuando recibimos el pago (en línea o transferencia) o, en contra entrega, cuando lo confirmamos contigo por WhatsApp.</li>
        <li>Los pedidos por WhatsApp sin confirmar pueden cancelarse si no recibimos respuesta.</li>
        <li>Si un producto se agota después de tu pago, te ofreceremos otro tono, un producto equivalente o la devolución total del dinero.</li>
      </ul>
      <h2>3. Pagos</h2>
      <p>
        Los pagos en línea se procesan a través de Wompi (Bancolombia). {c.nombre} no almacena datos de tarjetas. También aceptamos transferencia, Nequi, Daviplata,
        efectivo y pago contra entrega en {c.ciudad}.
      </p>
      <h2>4. Envíos, cambios y devoluciones</h2>
      <p>
        Consulta las condiciones en <Link href="/envios-y-devoluciones">Envíos y devoluciones</Link>, incluyendo el derecho de retracto y la reversión del pago (Ley 1480 de 2011).
      </p>
      <h2>5. Cuentas</h2>
      <p>Eres responsable de mantener la confidencialidad de tu contraseña. Puedes comprar sin crear una cuenta.</p>
      <h2>6. Datos personales</h2>
      <p>
        El tratamiento de tus datos se rige por nuestra <Link href="/privacidad">Política de privacidad</Link>.
      </p>
      <h2>7. Peticiones, quejas y reclamos</h2>
      <p>Puedes comunicarte por WhatsApp al número publicado en la página. Responderemos en un plazo máximo de 15 días hábiles.</p>
      <p className="rounded-2xl bg-nude p-4 text-sm">
        Nota para la propietaria: completa los datos entre corchetes y haz revisar este documento por un abogado antes de publicar.
      </p>
    </PaginaTexto>
  );
}
