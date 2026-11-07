import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ConfiguracionTienda, ItemPedido, Pago, Pedido } from "@prisma/client";
import { CANAL_VENTA, METODO_PAGO, TIPO_ENTREGA } from "@/lib/etiquetas";
import { formatoCOP, formatoFechaHoraCO } from "@/lib/formato";

// Tirilla térmica de 80 mm. 1 mm = 2,8346 pt. Se dejan 4 mm de margen a cada lado.
const ANCHO = 80 * 2.8346;

const e = StyleSheet.create({
  pagina: { paddingHorizontal: 11, paddingVertical: 14, fontSize: 8, fontFamily: "Helvetica", color: "#000" },
  centro: { textAlign: "center" },
  marca: { fontSize: 15, fontFamily: "Helvetica-Bold", textAlign: "center" },
  sub: { fontSize: 7.5, textAlign: "center", marginTop: 1 },
  linea: { borderBottomWidth: 0.7, borderBottomColor: "#000", borderStyle: "dashed", marginVertical: 6 },
  fila: { flexDirection: "row", justifyContent: "space-between", marginVertical: 1 },
  negrita: { fontFamily: "Helvetica-Bold" },
  total: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  item: { marginBottom: 3 },
  pequeno: { fontSize: 7 },
});

type PedidoCompleto = Pedido & { items: ItemPedido[]; pagos: Pago[] };

function Fila({ izq, der, negrita }: { izq: string; der: string; negrita?: boolean }) {
  return (
    <View style={e.fila}>
      <Text style={negrita ? e.negrita : undefined}>{izq}</Text>
      <Text style={negrita ? e.negrita : undefined}>{der}</Text>
    </View>
  );
}

function Comprobante({ pedido, tienda }: { pedido: PedidoCompleto; tienda: ConfiguracionTienda }) {
  // Alto calculado según el contenido para no desperdiciar papel en la impresora térmica.
  const alto = 250 + pedido.items.length * 30 + pedido.pagos.length * 12 + (pedido.notas ? 30 : 0) + (pedido.direccionEnvio ? 24 : 0);
  return (
    <Document title={`Comprobante ${pedido.codigo}`} author={tienda.nombre}>
      <Page size={[ANCHO, alto]} style={e.pagina}>
        <Text style={e.marca}>{tienda.nombre}</Text>
        <Text style={e.sub}>Maquillaje y skincare</Text>
        <Text style={e.sub}>{tienda.direccion}</Text>
        <Text style={e.sub}>WhatsApp: {tienda.whatsapp.replace(/^57/, "")}</Text>
        {tienda.instagram && <Text style={e.sub}>Instagram: @{tienda.instagram.replace(/^@/, "")}</Text>}
        <View style={e.linea} />

        <Fila izq="Comprobante" der={pedido.codigo} negrita />
        <Fila izq="Fecha" der={formatoFechaHoraCO(pedido.creadoEn)} />
        <Fila izq="Canal" der={CANAL_VENTA[pedido.canal].etiqueta} />
        {pedido.nombreClienta && <Fila izq="Clienta" der={pedido.nombreClienta} />}
        {pedido.telefono && <Fila izq="Celular" der={pedido.telefono.replace(/^57/, "")} />}
        {pedido.canal === "WEB" || pedido.direccionEnvio ? <Fila izq="Entrega" der={TIPO_ENTREGA[pedido.tipoEntrega]} /> : null}
        {pedido.direccionEnvio && (
          <Text style={e.pequeno}>
            {pedido.direccionEnvio}
            {pedido.ciudadEnvio ? `, ${pedido.ciudadEnvio}` : ""}
          </Text>
        )}
        <View style={e.linea} />

        {pedido.items.map((it) => (
          <View key={it.id} style={e.item}>
            <Text>{it.nombre}</Text>
            <Fila izq={`  ${it.cantidad} x ${formatoCOP(it.precioUnit)}`} der={formatoCOP(it.cantidad * it.precioUnit)} />
            {it.descuento > 0 && <Fila izq="  Descuento" der={`-${formatoCOP(it.descuento)}`} />}
          </View>
        ))}
        <View style={e.linea} />

        <Fila izq="Subtotal" der={formatoCOP(pedido.subtotal)} />
        {pedido.descuento > 0 && <Fila izq="Descuento" der={`-${formatoCOP(pedido.descuento)}`} />}
        {pedido.costoEnvio > 0 && <Fila izq="Envío" der={formatoCOP(pedido.costoEnvio)} />}
        <View style={[e.fila, { marginTop: 4 }]}>
          <Text style={e.total}>TOTAL</Text>
          <Text style={e.total}>{formatoCOP(pedido.total)}</Text>
        </View>
        <View style={e.linea} />

        {pedido.pagos.map((p) => (
          <Fila key={p.id} izq={METODO_PAGO[p.metodo]} der={formatoCOP(p.monto)} />
        ))}
        {pedido.notas && <Text style={[e.pequeno, { marginTop: 3 }]}>{pedido.notas}</Text>}
        <View style={e.linea} />

        <Text style={[e.centro, e.negrita, { fontSize: 9 }]}>¡Gracias por tu compra!</Text>
        <Text style={[e.sub, { marginTop: 3 }]}>Cambios dentro de los 5 días siguientes con este comprobante y el producto sin abrir.</Text>
        <Text style={[e.sub, { marginTop: 3 }]}>Este documento no es una factura electrónica.</Text>
      </Page>
    </Document>
  );
}

export async function generarComprobantePDF(pedido: PedidoCompleto, tienda: ConfiguracionTienda): Promise<Buffer> {
  return renderToBuffer(<Comprobante pedido={pedido} tienda={tienda} />);
}
