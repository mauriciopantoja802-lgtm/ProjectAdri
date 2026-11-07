import type { Metadata } from "next";
import { PaginaTexto } from "@/components/tienda/pagina-texto";
import { obtenerConfiguracion } from "@/features/configuracion/queries";

export const metadata: Metadata = {
  title: "Política de privacidad y tratamiento de datos",
  description: "Política de tratamiento de datos personales de Glow by Adri, según la Ley 1581 de 2012.",
  alternates: { canonical: "/privacidad" },
};

export default async function Privacidad() {
  const c = await obtenerConfiguracion();
  return (
    <PaginaTexto titulo="Política de tratamiento de datos personales" actualizado="noviembre de 2026">
      <p>
        En cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas sobre protección de datos
        personales (habeas data), {c.nombre} informa cómo recolecta, usa y protege tus datos.
      </p>
      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>Nombre: [NOMBRE COMPLETO DE LA PROPIETARIA] — {c.nombre}</li>
        <li>Identificación: [CÉDULA / NIT]</li>
        <li>Dirección: {c.direccion}, {c.ciudad}, Colombia</li>
        <li>Contacto: WhatsApp {c.whatsapp.replace(/^57/, "")} · [CORREO ELECTRÓNICO]</li>
      </ul>
      <h2>2. Datos que recolectamos</h2>
      <p>Nombre, número de celular, correo electrónico (opcional), direcciones de entrega e historial de compras. No recolectamos datos sensibles ni datos de tarjetas (los pagos en línea los procesa Wompi).</p>
      <h2>3. Finalidades</h2>
      <ul>
        <li>Procesar, entregar y hacer seguimiento a tus pedidos.</li>
        <li>Comunicarnos contigo por WhatsApp sobre el estado de tus compras.</li>
        <li>Atender peticiones, quejas, reclamos, cambios y garantías.</li>
        <li>Cumplir obligaciones contables, tributarias y legales.</li>
        <li>Enviarte novedades y promociones, solo si nos autorizas; puedes pedir que dejemos de hacerlo en cualquier momento.</li>
      </ul>
      <h2>4. Tus derechos como titular</h2>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos personales.</li>
        <li>Solicitar prueba de la autorización que nos diste.</li>
        <li>Ser informada sobre el uso que le damos a tus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
        <li>Revocar la autorización y/o pedir la supresión de tus datos, cuando no exista un deber legal de conservarlos.</li>
        <li>Acceder gratuitamente a tus datos personales.</li>
      </ul>
      <h2>5. Cómo ejercer tus derechos</h2>
      <p>
        Escríbenos por WhatsApp o al correo indicado con el asunto “Habeas data”, tu nombre, celular y la solicitud. Las <strong>consultas</strong> se responden en máximo
        10 días hábiles y los <strong>reclamos</strong> en máximo 15 días hábiles, prorrogables según la ley.
      </p>
      <h2>6. Seguridad y encargados</h2>
      <p>
        Protegemos tus datos con medidas técnicas razonables (conexión cifrada, contraseñas cifradas, acceso restringido). Para operar la tienda usamos proveedores que
        actúan como encargados: alojamiento web (Vercel), base de datos (Neon/Supabase), imágenes (Cloudinary), pagos (Wompi), mensajería (WhatsApp) y
        lectura automática de facturas de proveedores (Anthropic). Estos servicios
        pueden almacenar información fuera de Colombia con estándares adecuados de protección.
      </p>
      <h2>7. Vigencia</h2>
      <p>Esta política rige desde su publicación. Los datos se conservarán mientras exista una relación comercial o sea necesario para cumplir obligaciones legales.</p>
      <p className="rounded-2xl bg-nude p-4 text-sm">Nota para la propietaria: completa los datos entre corchetes y haz revisar esta política por un abogado antes de publicar.</p>
    </PaginaTexto>
  );
}
