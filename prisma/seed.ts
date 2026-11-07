/**
 * Datos de ejemplo para Glow by Adri.
 * Ejecutar con:  npm run db:seed
 *
 * ⚠️ Borra TODOS los datos existentes antes de cargar los de ejemplo.
 * El seed reproduce una historia coherente para que el kardex cuadre:
 *   1. Compra inicial al proveedor  → entradas de inventario (ENTRADA_COMPRA)
 *   2. 15 pedidos en orden cronológico → salidas (SALIDA_VENTA) según las reglas de negocio
 *   3. Un pedido cancelado después de confirmado → DEVOLUCION
 *   4. Un ajuste por producto dañado → AJUSTE_NEGATIVO
 */
import {
  PrismaClient,
  CanalVenta,
  EstadoPedido,
  EstadoPago,
  MetodoPago,
  TipoEntrega,
  TipoMovimiento,
  Rol,
  type Prisma,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { siguienteCodigoPedido } from "../src/features/pedidos/codigo";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Generador pseudoaleatorio con semilla: el seed da siempre el mismo resultado. */
function crearAleatorio(semilla: number) {
  let s = semilla;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const azar = crearAleatorio(20261104);
const entero = (min: number, max: number) => Math.floor(azar() * (max - min + 1)) + min;

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const ahora = Date.now();
const haceDias = (dias: number, horasExtra = 0) => new Date(ahora - dias * DIA - horasExtra * HORA);


/** Código EAN-13 válido con prefijo de Colombia (770), para probar el lector de barras. */
function ean13(consecutivo: number) {
  const base = `770${String(consecutivo).padStart(9, "0")}`;
  const suma = [...base].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return base + ((10 - (suma % 10)) % 10);
}

function imagenEjemplo(texto: string, fondo = "F8BBD9", color = "6A0D45") {
  return `https://placehold.co/800x800/${fondo}/${color}/png?text=${encodeURIComponent(texto)}`;
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

const CATEGORIAS = ["Labios", "Ojos", "Rostro", "Cejas", "Uñas", "Skincare", "Accesorios"];
const MARCAS = ["Vogue", "Samy", "Ruby Rose", "Trendy", "Maybelline", "Glow Essentials"];

interface ProductoSeed {
  nombre: string;
  categoria: string;
  marca: string;
  descripcion: string;
  modoUso: string;
  precio: number;
  costo: number;
  oferta?: number;
  esNuevo?: boolean;
  destacado?: boolean;
  tonos: [nombre: string, hex: string | null][];
}

const PRODUCTOS: ProductoSeed[] = [
  // Labios
  {
    nombre: "Labial Mate Larga Duración",
    categoria: "Labios",
    marca: "Vogue",
    descripcion: "Labial de acabado mate aterciopelado que dura hasta 12 horas sin resecar los labios.",
    modoUso: "Aplica desde el centro hacia las comisuras. Para mayor intensidad, aplica una segunda capa.",
    precio: 32000,
    costo: 17000,
    destacado: true,
    tonos: [
      ["Tono 01 - Rojo Pasión", "#B3001B"],
      ["Tono 03 - Rosa Nude", "#C98B8B"],
      ["Tono 05 - Berry", "#7B1E3A"],
    ],
  },
  {
    nombre: "Brillo Labial Glow Gloss",
    categoria: "Labios",
    marca: "Glow Essentials",
    descripcion: "Gloss de efecto espejo con aceite de jojoba que hidrata y da volumen visual.",
    modoUso: "Úsalo solo o sobre tu labial favorito para un acabado jugoso.",
    precio: 24900,
    costo: 12000,
    oferta: 21900,
    esNuevo: true,
    tonos: [
      ["Cristal", "#F6E7EA"],
      ["Rosa", "#F4A6C0"],
      ["Durazno", "#F7B89A"],
    ],
  },
  {
    nombre: "Bálsamo Labial con Color",
    categoria: "Labios",
    marca: "Samy",
    descripcion: "Bálsamo con un toque de color, manteca de karité y protección solar FPS 15.",
    modoUso: "Aplica cuantas veces quieras durante el día.",
    precio: 15900,
    costo: 7500,
    tonos: [
      ["Cereza", "#C2185B"],
      ["Coral", "#FF7F6E"],
    ],
  },
  {
    nombre: "Delineador de Labios",
    categoria: "Labios",
    marca: "Ruby Rose",
    descripcion: "Lápiz cremoso que define el contorno y evita que el labial se corra.",
    modoUso: "Delinea el contorno natural de tus labios y rellena suavemente hacia el centro.",
    precio: 12000,
    costo: 5500,
    tonos: [
      ["Nude", "#B07A6A"],
      ["Malva", "#A05A7A"],
      ["Rojo", "#A4161A"],
    ],
  },
  // Ojos
  {
    nombre: "Paleta de Sombras Sunset 12 tonos",
    categoria: "Ojos",
    marca: "Ruby Rose",
    descripcion: "12 sombras mate y brillantes en tonos cálidos, altamente pigmentadas y fáciles de difuminar.",
    modoUso: "Aplica el tono claro en todo el párpado, el medio en la cuenca y el oscuro en la esquina externa.",
    precio: 45900,
    costo: 24000,
    oferta: 39900,
    destacado: true,
    tonos: [["Única", null]],
  },
  {
    nombre: "Máscara de Pestañas Volumen Extremo",
    categoria: "Ojos",
    marca: "Maybelline",
    descripcion: "Pestañas con volumen y longitud desde la primera capa, sin grumos.",
    modoUso: "Aplica desde la raíz hacia las puntas en zigzag. Agrega capas mientras esté húmeda.",
    precio: 38900,
    costo: 22000,
    destacado: true,
    tonos: [["Negro", "#111111"]],
  },
  {
    nombre: "Delineador Líquido Punta Fina",
    categoria: "Ojos",
    marca: "Trendy",
    descripcion: "Delineador a prueba de agua con punta tipo plumón para trazos precisos.",
    modoUso: "Traza desde el lagrimal hacia afuera. Para el delineado de gato, extiende la línea hacia la sien.",
    precio: 18000,
    costo: 8500,
    tonos: [
      ["Negro", "#000000"],
      ["Café", "#4B2E20"],
    ],
  },
  {
    nombre: "Lápiz Delineador Kajal",
    categoria: "Ojos",
    marca: "Vogue",
    descripcion: "Lápiz suave para la línea de agua, de alta pigmentación y larga duración.",
    modoUso: "Aplica en la línea de agua o difumina en las pestañas para un efecto ahumado.",
    precio: 12900,
    costo: 6000,
    tonos: [
      ["Negro", "#000000"],
      ["Blanco", "#FFFFFF"],
    ],
  },
  // Rostro
  {
    nombre: "Base Líquida Cobertura Media",
    categoria: "Rostro",
    marca: "Maybelline",
    descripcion: "Base de acabado natural que unifica el tono y controla el brillo hasta 16 horas.",
    modoUso: "Aplica pequeños puntos en el rostro y difumina con brocha o esponja húmeda.",
    precio: 52900,
    costo: 31000,
    destacado: true,
    tonos: [
      ["Marfil", "#F1D3B5"],
      ["Beige", "#E0B48F"],
      ["Canela", "#C68E5E"],
      ["Miel", "#A9713F"],
    ],
  },
  {
    nombre: "Corrector Alta Cobertura",
    categoria: "Rostro",
    marca: "Samy",
    descripcion: "Cubre ojeras, manchas e imperfecciones con una textura ligera que no se cuartea.",
    modoUso: "Aplica en triángulo bajo los ojos y difumina con toques suaves.",
    precio: 24000,
    costo: 12000,
    tonos: [
      ["Claro", "#F3D6BD"],
      ["Medio", "#D9A77F"],
      ["Oscuro", "#A87048"],
    ],
  },
  {
    nombre: "Polvo Compacto Matificante",
    categoria: "Rostro",
    marca: "Vogue",
    descripcion: "Sella el maquillaje y controla el brillo con un acabado mate natural.",
    modoUso: "Aplica con la borla o una brocha grande sobre la base, insistiendo en la zona T.",
    precio: 28900,
    costo: 15000,
    tonos: [
      ["Translúcido", "#F5E6DA"],
      ["Natural", "#E2BC98"],
    ],
  },
  {
    nombre: "Rubor en Crema",
    categoria: "Rostro",
    marca: "Glow Essentials",
    descripcion: "Rubor cremoso que se funde con la piel para un rubor natural y luminoso.",
    modoUso: "Aplica con los dedos en las mejillas y difumina hacia las sienes.",
    precio: 22900,
    costo: 10500,
    esNuevo: true,
    tonos: [
      ["Rosa Glow", "#F48FB1"],
      ["Durazno", "#FFAB91"],
    ],
  },
  // Cejas
  {
    nombre: "Lápiz para Cejas con Cepillo",
    categoria: "Cejas",
    marca: "Trendy",
    descripcion: "Lápiz de trazo fino con cepillo en espiral para rellenar y peinar las cejas.",
    modoUso: "Peina las cejas hacia arriba, rellena con trazos cortos y vuelve a peinar.",
    precio: 14900,
    costo: 6500,
    tonos: [
      ["Castaño claro", "#8B6B4E"],
      ["Castaño oscuro", "#5A3E2B"],
      ["Negro", "#2B1D14"],
    ],
  },
  {
    nombre: "Gel Fijador de Cejas",
    categoria: "Cejas",
    marca: "Samy",
    descripcion: "Gel transparente que fija las cejas todo el día con efecto laminado.",
    modoUso: "Peina las cejas hacia arriba y hacia afuera con el aplicador.",
    precio: 19900,
    costo: 9000,
    esNuevo: true,
    tonos: [["Transparente", null]],
  },
  // Uñas
  {
    nombre: "Esmalte Gel Efecto Brillo",
    categoria: "Uñas",
    marca: "Vogue",
    descripcion: "Esmalte de secado rápido con efecto gel y alto brillo, sin necesidad de lámpara.",
    modoUso: "Aplica dos capas delgadas dejando secar un minuto entre cada una.",
    precio: 9900,
    costo: 4200,
    tonos: [
      ["Rojo", "#C1121F"],
      ["Nude", "#D8A7A0"],
      ["Fucsia", "#E91E8C"],
      ["Blanco", "#FAFAFA"],
    ],
  },
  {
    nombre: "Kit Manicure Básico",
    categoria: "Uñas",
    marca: "Glow Essentials",
    descripcion: "Incluye cortaúñas, lima, empujador de cutícula, pinza y estuche.",
    modoUso: "Desinfecta las herramientas antes y después de cada uso.",
    precio: 35000,
    costo: 18000,
    tonos: [["Única", null]],
  },
  // Skincare
  {
    nombre: "Agua Micelar 400 ml",
    categoria: "Skincare",
    marca: "Samy",
    descripcion: "Limpia, desmaquilla y refresca en un solo paso. Apta para piel sensible.",
    modoUso: "Humedece un algodón y pásalo suavemente por el rostro y los ojos. No necesita enjuague.",
    precio: 29900,
    costo: 15500,
    destacado: true,
    tonos: [["Única", null]],
  },
  {
    nombre: "Sérum Facial Vitamina C",
    categoria: "Skincare",
    marca: "Glow Essentials",
    descripcion: "Ilumina, unifica el tono y ayuda a reducir manchas. Con ácido hialurónico.",
    modoUso: "Aplica 3 gotas en la mañana sobre el rostro limpio, antes del protector solar.",
    precio: 54900,
    costo: 28000,
    oferta: 49900,
    esNuevo: true,
    tonos: [["Única", null]],
  },
  // Accesorios
  {
    nombre: "Set de Brochas x12",
    categoria: "Accesorios",
    marca: "Ruby Rose",
    descripcion: "12 brochas de cerdas sintéticas suaves para rostro y ojos, con estuche.",
    modoUso: "Lávalas una vez por semana con jabón suave y déjalas secar acostadas.",
    precio: 69900,
    costo: 38000,
    tonos: [
      ["Rosa", "#F8BBD9"],
      ["Negro", "#1A1A1A"],
    ],
  },
  {
    nombre: "Esponja de Maquillaje Glow",
    categoria: "Accesorios",
    marca: "Trendy",
    descripcion: "Esponja sin látex que crece al humedecerse para un acabado uniforme.",
    modoUso: "Humedécela, escúrrela bien y aplica la base con toques suaves.",
    precio: 9900,
    costo: 3500,
    tonos: [
      ["Rosa", "#F48FB1"],
      ["Morada", "#9C27B0"],
    ],
  },
];

const CLIENTAS = [
  { nombre: "Valentina Muñoz", telefono: "573104567890", email: "valentina.munoz@example.com", barrio: "Centro" },
  { nombre: "Daniela Ordóñez", telefono: "573157778899", email: "daniela.o@example.com", barrio: "La Esmeralda" },
  { nombre: "Laura Camila Rengifo", telefono: "573201234567", email: null, barrio: "Bello Horizonte" },
  { nombre: "María José Paz", telefono: "573008889911", email: "majo.paz@example.com", barrio: "Pomona" },
  { nombre: "Sofía Hurtado", telefono: "573186665544", email: null, barrio: "El Recuerdo" },
  { nombre: "Juliana Erazo", telefono: "573122223344", email: "juli.erazo@example.com", barrio: "Lomas de Granada" },
  { nombre: "Camila Andrea Velasco", telefono: "573145556677", email: null, barrio: "Yanaconas" },
  { nombre: "Natalia Guzmán", telefono: "573176543210", email: "nata.guzman@example.com", barrio: "Cali (Valle)" },
];

const PLANTILLAS = [
  {
    clave: "PEDIDO_CONFIRMADO",
    mensaje:
      "¡Hola {nombre}! 💖 Tu pedido #{codigo} está confirmado. Total: {total}. Te avisamos apenas esté listo. ¡Gracias por elegir Glow by Adri! ✨",
  },
  {
    clave: "DATOS_PAGO",
    mensaje:
      "¡Hola {nombre}! Para completar tu pedido #{codigo} por {total}, puedes pagar por:\n{datosPago}\nCuando hagas el pago, envíanos el comprobante por aquí 🙏",
  },
  {
    clave: "ENVIADO",
    mensaje:
      "¡Hola {nombre}! 🚚 Tu pedido #{codigo} ya va en camino. Si tienes alguna pregunta, escríbenos. 💖",
  },
  {
    clave: "LISTO_RECOGER",
    mensaje:
      "¡Hola {nombre}! 🛍️ Tu pedido #{codigo} ya está listo para recoger en nuestra tienda: {direccionTienda}. ¡Te esperamos!",
  },
  {
    clave: "GRACIAS",
    mensaje:
      "¡Gracias por tu compra, {nombre}! 💕 Esperamos que ames tus productos. Cuéntanos cómo te fue y etiquétanos en Instagram. ✨",
  },
];

// ---------------------------------------------------------------------------
// Pedidos de ejemplo
// ---------------------------------------------------------------------------

const P = EstadoPedido;

interface PedidoSeed {
  canal: CanalVenta;
  dias: number; // hace cuántos días se creó
  horas: number; // horas adicionales hacia atrás
  ruta: EstadoPedido[]; // historial de estados, el último es el actual
  metodo: MetodoPago;
  entrega: TipoEntrega;
  clienta?: number; // índice en CLIENTAS
  ciudad?: string;
  cupon?: boolean;
  descuentoItem?: boolean; // descuento por ítem (ventas del POS)
  nota?: string;
}

const PEDIDOS: PedidoSeed[] = [
  { canal: "TIENDA_FISICA", dias: 28, horas: 5, ruta: [P.ENTREGADO], metodo: "EFECTIVO", entrega: "RECOGER_EN_TIENDA" },
  {
    canal: "WEB",
    dias: 25,
    horas: 3,
    ruta: [P.PENDIENTE, P.PAGADO, P.EN_PREPARACION, P.ENVIADO, P.ENTREGADO],
    metodo: "WOMPI",
    entrega: "DOMICILIO_POPAYAN",
    clienta: 0,
    cupon: true,
  },
  { canal: "TIENDA_FISICA", dias: 21, horas: 6, ruta: [P.ENTREGADO], metodo: "NEQUI", entrega: "RECOGER_EN_TIENDA", clienta: 1 },
  {
    canal: "WHATSAPP",
    dias: 18,
    horas: 4,
    ruta: [P.PENDIENTE, P.CONFIRMADO, P.PAGADO, P.EN_PREPARACION, P.ENVIADO, P.ENTREGADO],
    metodo: "TRANSFERENCIA",
    entrega: "DOMICILIO_POPAYAN",
    clienta: 2,
  },
  { canal: "TIENDA_FISICA", dias: 14, horas: 2, ruta: [P.ENTREGADO], metodo: "TARJETA", entrega: "RECOGER_EN_TIENDA", descuentoItem: true },
  {
    canal: "WEB",
    dias: 10,
    horas: 7,
    ruta: [P.PENDIENTE, P.CONFIRMADO, P.CANCELADO],
    metodo: "CONTRA_ENTREGA",
    entrega: "DOMICILIO_POPAYAN",
    clienta: 4,
    nota: "La clienta canceló porque ya no estará en casa.",
  },
  {
    canal: "INSTAGRAM",
    dias: 9,
    horas: 3,
    ruta: [P.ENTREGADO],
    metodo: "DAVIPLATA",
    entrega: "DOMICILIO_POPAYAN",
    clienta: 5,
    nota: "Pedido recibido por mensaje directo de Instagram.",
  },
  { canal: "TIENDA_FISICA", dias: 6, horas: 4, ruta: [P.ENTREGADO], metodo: "MIXTO", entrega: "RECOGER_EN_TIENDA", clienta: 3 },
  {
    canal: "WEB",
    dias: 3,
    horas: 8,
    ruta: [P.PENDIENTE, P.PAGADO, P.EN_PREPARACION, P.ENVIADO],
    metodo: "WOMPI",
    entrega: "ENVIO_NACIONAL",
    clienta: 7,
    ciudad: "Cali",
  },
  {
    // Pendiente hace más de 48 h → aparecerá como "por vencer" en el panel
    canal: "WHATSAPP",
    dias: 3,
    horas: 2,
    ruta: [P.PENDIENTE],
    metodo: "TRANSFERENCIA",
    entrega: "DOMICILIO_POPAYAN",
    clienta: 6,
  },
  {
    canal: "WHATSAPP",
    dias: 2,
    horas: 5,
    ruta: [P.PENDIENTE, P.CONFIRMADO, P.PAGADO, P.EN_PREPARACION, P.LISTO_PARA_RECOGER],
    metodo: "NEQUI",
    entrega: "RECOGER_EN_TIENDA",
    clienta: 1,
  },
  {
    canal: "WEB",
    dias: 1,
    horas: 3,
    ruta: [P.PENDIENTE, P.PAGADO],
    metodo: "WOMPI",
    entrega: "RECOGER_EN_TIENDA",
    clienta: 3,
  },
  { canal: "INSTAGRAM", dias: 1, horas: 1, ruta: [P.ENTREGADO], metodo: "NEQUI", entrega: "RECOGER_EN_TIENDA", clienta: 4 },
  { canal: "WEB", dias: 0, horas: 4, ruta: [P.PENDIENTE], metodo: "CONTRA_ENTREGA", entrega: "DOMICILIO_POPAYAN", clienta: 0 },
  { canal: "WHATSAPP", dias: 0, horas: 2, ruta: [P.PENDIENTE], metodo: "TRANSFERENCIA", entrega: "ENVIO_NACIONAL", clienta: 7, ciudad: "Pasto" },
];

const COSTO_DOMICILIO = 6000;
const COSTO_NACIONAL = 15000;
const ENVIO_GRATIS_DESDE = 150000;

/** ¿En qué punto de la ruta se descuenta el stock? (reglas de negocio del proyecto) */
function indiceDescuentoStock(p: PedidoSeed): number {
  // POS (tienda física, Instagram y registros manuales): se descuenta al cobrar.
  if (p.ruta[0] === P.ENTREGADO) return 0;
  // Wompi: cuando el webhook confirma el pago (PAGADO).
  // Contra entrega y WhatsApp: cuando Adri confirma (CONFIRMADO).
  const disparador = p.metodo === "WOMPI" ? P.PAGADO : P.CONFIRMADO;
  return p.ruta.indexOf(disparador); // -1 si nunca llegó a ese estado
}

// ---------------------------------------------------------------------------
// Ejecución
// ---------------------------------------------------------------------------

async function limpiar() {
  // Orden inverso a las dependencias
  await prisma.movimientoInventario.deleteMany();
  await prisma.itemPedido.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.historialEstado.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.itemCompra.deleteMany();
  await prisma.compra.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.imagenProducto.deleteMany();
  await prisma.variante.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.marca.deleteMany();
  await prisma.direccion.deleteMany();
  await prisma.clienta.deleteMany();
  await prisma.cierreCaja.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.cupon.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.plantillaWhatsapp.deleteMany();
  await prisma.configuracionTienda.deleteMany();
  await prisma.consecutivo.deleteMany();
}

async function main() {
  const emailAdmin = process.env.ADMIN_EMAIL ?? "admin@glowbyadri.com";
  const claveAdmin = process.env.ADMIN_PASSWORD;
  if (!claveAdmin) throw new Error("Falta ADMIN_PASSWORD en el archivo .env");

  console.log("🧹 Limpiando datos anteriores…");
  await limpiar();

  // --- Usuaria administradora ---------------------------------------------
  const adri = await prisma.usuario.create({
    data: {
      nombre: "Adriana",
      email: emailAdmin,
      password: await bcrypt.hash(claveAdmin, 12),
      rol: Rol.ADMIN,
      telefono: process.env.NEXT_PUBLIC_WHATSAPP ?? "573000000000",
    },
  });
  console.log(`👑 Administradora: ${emailAdmin}`);

  // --- Configuración, plantillas, banners y cupón -------------------------
  await prisma.configuracionTienda.create({
    data: {
      id: "tienda",
      whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "573000000000",
      instagram: process.env.SEED_TIENDA_INSTAGRAM ?? "glowbyadri",
      direccion: process.env.SEED_TIENDA_DIRECCION ?? "[DIRECCIÓN DE LA TIENDA], Popayán, Cauca",
      horario: process.env.SEED_TIENDA_HORARIO ?? "[HORARIO DE ATENCIÓN]",
      costoDomicilio: COSTO_DOMICILIO,
      costoNacional: COSTO_NACIONAL,
      envioGratisDesde: ENVIO_GRATIS_DESDE,
      datosPago: "Nequi: 300 000 0000\nDaviplata: 300 000 0000\nBancolombia ahorros: 000-000000-00 (Adriana)",
    },
  });
  await prisma.plantillaWhatsapp.createMany({ data: PLANTILLAS });
  await prisma.banner.createMany({
    data: [
      {
        titulo: "Resalta tu brillo natural",
        subtitulo: "Nueva colección de labiales mate",
        imagen: imagenEjemplo("Nueva colección", "E91E8C", "FFFFFF"),
        enlace: "/categoria/labios",
        orden: 0,
      },
      {
        titulo: "Skincare que se nota",
        subtitulo: "Sérum de Vitamina C en oferta",
        imagen: imagenEjemplo("Skincare", "F8BBD9", "6A0D45"),
        enlace: "/categoria/skincare",
        orden: 1,
      },
    ],
  });
  const cupon = await prisma.cupon.create({
    data: { codigo: "BIENVENIDA10", porcentaje: 10, minimoCompra: 50000, usosMaximos: 100 },
  });
  await prisma.consecutivo.create({ data: { clave: "PEDIDO", valor: 0 } });

  // --- Categorías y marcas -------------------------------------------------
  const categorias = new Map<string, string>();
  for (const [orden, nombre] of CATEGORIAS.entries()) {
    const c = await prisma.categoria.create({
      data: { nombre, slug: slugify(nombre), orden, imagen: imagenEjemplo(nombre, "FFF1F5", "E91E8C") },
    });
    categorias.set(nombre, c.id);
  }
  const marcas = new Map<string, string>();
  for (const nombre of MARCAS) {
    const m = await prisma.marca.create({ data: { nombre, slug: slugify(nombre) } });
    marcas.set(nombre, m.id);
  }
  console.log(`🗂️  ${CATEGORIAS.length} categorías y ${MARCAS.length} marcas`);

  // --- Productos y variantes ----------------------------------------------
  interface VarianteMem {
    id: string;
    nombreCompleto: string;
    precio: number;
    costo: number;
    stock: number;
  }
  const variantes: VarianteMem[] = [];
  let consecutivoBarras = 1;

  for (const [i, p] of PRODUCTOS.entries()) {
    const producto = await prisma.producto.create({
      data: {
        nombre: p.nombre,
        slug: slugify(p.nombre),
        descripcion: p.descripcion,
        modoUso: p.modoUso,
        categoriaId: categorias.get(p.categoria)!,
        marcaId: marcas.get(p.marca)!,
        esNuevo: p.esNuevo ?? false,
        destacado: p.destacado ?? false,
        creadoEn: haceDias(45 - i),
        imagenes: {
          create: [
            { url: imagenEjemplo(p.nombre), alt: p.nombre, orden: 0 },
            { url: imagenEjemplo(p.marca, "FFF1F5", "E91E8C"), alt: `${p.nombre} - ${p.marca}`, orden: 1 },
          ],
        },
      },
    });

    for (const [j, [tono, hex]] of p.tonos.entries()) {
      const v = await prisma.variante.create({
        data: {
          productoId: producto.id,
          nombre: tono,
          colorHex: hex,
          sku: `GA-${String(i + 1).padStart(3, "0")}-${String(j + 1).padStart(2, "0")}`,
          codigoBarras: ean13(consecutivoBarras++),
          precio: p.precio,
          precioOferta: p.oferta ?? null,
          costo: p.costo,
          stock: 0, // el stock entra con la compra inicial
          stockMinimo: 3,
        },
      });
      variantes.push({
        id: v.id,
        nombreCompleto: tono === "Única" ? p.nombre : `${p.nombre} (${tono})`,
        precio: p.oferta ?? p.precio,
        costo: p.costo,
        stock: 0,
      });
    }
  }
  console.log(`💄 ${PRODUCTOS.length} productos con ${variantes.length} variantes`);

  // --- Proveedor y compra inicial (ENTRADA_COMPRA) -------------------------
  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: "Distribuidora Belleza del Cauca S.A.S.",
      telefono: "573001112233",
      email: "ventas@bellezacauca.example.com",
      nit: "900123456-7",
    },
  });

  const fechaCompra = haceDias(40);
  // Algunas variantes entran con poco stock para que aparezcan las alertas de "stock bajo".
  const cantidades = variantes.map((_, idx) => (idx % 9 === 4 ? 2 : entero(8, 24)));
  await prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: {
        proveedorId: proveedor.id,
        fecha: fechaCompra,
        total: variantes.reduce((t, v, idx) => t + v.costo * cantidades[idx], 0),
        notas: "Compra inicial de inventario",
        items: {
          create: variantes.map((v, idx) => ({ varianteId: v.id, cantidad: cantidades[idx], costoUnit: v.costo })),
        },
      },
    });
    for (const [idx, v] of variantes.entries()) {
      v.stock += cantidades[idx];
      await tx.variante.update({ where: { id: v.id }, data: { stock: v.stock } });
      await tx.movimientoInventario.create({
        data: {
          varianteId: v.id,
          tipo: TipoMovimiento.ENTRADA_COMPRA,
          cantidad: cantidades[idx],
          stockFinal: v.stock,
          motivo: "Compra inicial de inventario",
          compraId: compra.id,
          usuarioId: adri.id,
          creadoEn: fechaCompra,
        },
      });
    }
  });
  console.log(`📦 Proveedor y compra inicial (${cantidades.reduce((a, b) => a + b, 0)} unidades)`);

  // --- Clientas --------------------------------------------------------------
  const clientas: { id: string; nombre: string; telefono: string; barrio: string }[] = [];
  for (const c of CLIENTAS) {
    const creada = await prisma.clienta.create({
      data: {
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email,
        creadoEn: haceDias(35),
        direcciones: {
          create: c.barrio.includes("Cali")
            ? { direccion: "Calle 5 # 38-20", barrio: "San Fernando", ciudad: "Cali", depto: "Valle del Cauca" }
            : { direccion: `Carrera ${entero(2, 15)} # ${entero(1, 30)}-${entero(10, 90)}`, barrio: c.barrio },
        },
      },
    });
    clientas.push({ id: creada.id, nombre: c.nombre, telefono: c.telefono, barrio: c.barrio });
  }
  console.log(`👩 ${clientas.length} clientas`);

  // --- Pedidos -------------------------------------------------------------
  interface EventoInventario {
    fecha: Date;
    tipo: TipoMovimiento;
    pedidoId: string;
    codigo: string;
    items: { v: VarianteMem; cantidad: number }[];
  }
  const eventos: EventoInventario[] = [];
  const stockKardex = new Map(variantes.map((v) => [v.id, v.stock])); // stock tras la compra inicial

  const pedidosOrdenados = [...PEDIDOS].sort((a, b) => b.dias * 24 + b.horas - (a.dias * 24 + a.horas));

  for (const p of pedidosOrdenados) {
    const fechaCreacion = haceDias(p.dias, p.horas);
    // Repartimos los cambios de estado entre la creación y "ahora" sin pasarnos del presente
    const pasoMs = Math.min(6 * HORA, (ahora - fechaCreacion.getTime()) / (p.ruta.length + 1));
    const fechaEstado = (k: number) => new Date(fechaCreacion.getTime() + k * pasoMs);

    // Elegimos 1 a 3 productos distintos con stock suficiente
    const disponibles = variantes.filter((v) => v.stock >= 3);
    const elegidos = new Set<VarianteMem>();
    const numItems = entero(1, 3);
    while (elegidos.size < numItems) elegidos.add(disponibles[entero(0, disponibles.length - 1)]);
    const items = [...elegidos].map((v, k) => {
      const cantidad = entero(1, 2);
      const descuento = p.descuentoItem && k === 0 ? 2000 * cantidad : 0;
      return { v, cantidad, descuento };
    });

    const subtotal = items.reduce((t, it) => t + it.v.precio * it.cantidad - it.descuento, 0);
    const descuentoCupon = p.cupon ? Math.round((subtotal * (cupon.porcentaje ?? 0)) / 100) : 0;
    const baseEnvio = subtotal - descuentoCupon;
    const costoEnvio =
      p.entrega === "RECOGER_EN_TIENDA" || baseEnvio >= ENVIO_GRATIS_DESDE
        ? 0
        : p.entrega === "DOMICILIO_POPAYAN"
          ? COSTO_DOMICILIO
          : COSTO_NACIONAL;
    const total = baseEnvio + costoEnvio;

    const clienta = p.clienta !== undefined ? clientas[p.clienta] : undefined;
    const estadoFinal = p.ruta[p.ruta.length - 1];
    const idxDescuento = indiceDescuentoStock(p);
    const seDescontoStock = idxDescuento >= 0;
    const seDevolvioStock = seDescontoStock && estadoFinal === P.CANCELADO;

    await prisma.$transaction(async (tx) => {
      const codigo = await siguienteCodigoPedido(tx);
      const pedido = await tx.pedido.create({
        data: {
          codigo,
          canal: p.canal,
          estado: estadoFinal,
          metodoPago: p.metodo,
          stockDescontado: seDescontoStock && !seDevolvioStock,
          clientaId: clienta?.id,
          nombreClienta: clienta?.nombre ?? "Venta de mostrador",
          telefono: clienta?.telefono,
          tipoEntrega: p.entrega,
          direccionEnvio:
            p.entrega === "RECOGER_EN_TIENDA" ? null : `Carrera ${entero(2, 15)} # ${entero(1, 30)}-${entero(10, 90)}`,
          ciudadEnvio: p.entrega === "RECOGER_EN_TIENDA" ? null : (p.ciudad ?? "Popayán"),
          subtotal,
          descuento: descuentoCupon,
          costoEnvio,
          total,
          cuponId: p.cupon ? cupon.id : null,
          notas: p.nota,
          creadoEn: fechaCreacion,
          items: {
            create: items.map((it) => ({
              varianteId: it.v.id,
              nombre: it.v.nombreCompleto,
              cantidad: it.cantidad,
              precioUnit: it.v.precio,
              costoUnit: it.v.costo,
              descuento: it.descuento,
            })),
          },
          historial: {
            create: p.ruta.map((estado, k) => ({
              estado,
              creadoEn: fechaEstado(k),
              nota:
                k === 0 && estado === P.ENTREGADO
                  ? `Venta registrada en el POS (${p.canal === "TIENDA_FISICA" ? "tienda física" : p.canal.toLowerCase()})`
                  : estado === P.CANCELADO
                    ? p.nota
                    : undefined,
            })),
          },
        },
      });

      // Pagos
      const pagoAprobado = estadoFinal !== P.PENDIENTE && estadoFinal !== P.CANCELADO;
      const pagos: Prisma.PagoCreateManyInput[] =
        p.metodo === "MIXTO"
          ? [
              { pedidoId: pedido.id, metodo: "EFECTIVO", monto: Math.round(total / 2), estado: EstadoPago.APROBADO, creadoEn: fechaCreacion },
              { pedidoId: pedido.id, metodo: "NEQUI", monto: total - Math.round(total / 2), estado: EstadoPago.APROBADO, creadoEn: fechaCreacion },
            ]
          : estadoFinal === P.CANCELADO || (p.canal === "WHATSAPP" && estadoFinal === P.PENDIENTE)
            ? []
            : [
                {
                  pedidoId: pedido.id,
                  metodo: p.metodo,
                  monto: total,
                  estado: pagoAprobado ? EstadoPago.APROBADO : EstadoPago.PENDIENTE,
                  referencia: p.metodo === "WOMPI" ? `test-${codigo.toLowerCase()}-${entero(100000, 999999)}` : null,
                  creadoEn: fechaCreacion,
                },
              ];
      if (pagos.length) await tx.pago.createMany({ data: pagos });

      // Inventario: el movimiento ocurre cuando se confirma/paga, que puede ser horas después de
      // creado el pedido. Lo guardamos como evento y lo aplicamos luego en orden de fecha real,
      // para que el stockFinal del kardex quede encadenado correctamente.
      if (seDescontoStock) {
        for (const it of items) it.v.stock -= it.cantidad; // reserva: evita elegir stock que ya no hay
        eventos.push({ fecha: fechaEstado(idxDescuento), tipo: TipoMovimiento.SALIDA_VENTA, pedidoId: pedido.id, codigo, items });
      }
      if (seDevolvioStock) {
        for (const it of items) it.v.stock += it.cantidad;
        eventos.push({ fecha: fechaEstado(p.ruta.length - 1), tipo: TipoMovimiento.DEVOLUCION, pedidoId: pedido.id, codigo, items });
      }
    });
  }

  eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  for (const evento of eventos) {
    const signo = evento.tipo === TipoMovimiento.SALIDA_VENTA ? -1 : 1;
    await prisma.$transaction(async (tx) => {
      for (const it of evento.items) {
        const nuevo = (stockKardex.get(it.v.id) ?? 0) + signo * it.cantidad;
        if (nuevo < 0) throw new Error(`Stock negativo en el seed para ${it.v.nombreCompleto}`);
        stockKardex.set(it.v.id, nuevo);
        await tx.variante.update({ where: { id: it.v.id }, data: { stock: nuevo } });
        await tx.movimientoInventario.create({
          data: {
            varianteId: it.v.id,
            tipo: evento.tipo,
            cantidad: signo * it.cantidad,
            stockFinal: nuevo,
            motivo: `${signo < 0 ? "Venta" : "Cancelación"} ${evento.codigo}`,
            pedidoId: evento.pedidoId,
            usuarioId: adri.id,
            creadoEn: evento.fecha,
          },
        });
      }
    });
  }

  await prisma.cupon.update({ where: { id: cupon.id }, data: { usos: PEDIDOS.filter((p) => p.cupon).length } });
  console.log(`🧾 ${PEDIDOS.length} pedidos de ejemplo (web, WhatsApp, tienda e Instagram)`);

  // --- Ajuste negativo de ejemplo (AJUSTE_NEGATIVO) ----------------------
  const danada = variantes.find((v) => v.stock >= 5)!;
  await prisma.$transaction(async (tx) => {
    danada.stock -= 1;
    await tx.variante.update({ where: { id: danada.id }, data: { stock: danada.stock } });
    await tx.movimientoInventario.create({
      data: {
        varianteId: danada.id,
        tipo: TipoMovimiento.AJUSTE_NEGATIVO,
        cantidad: -1,
        stockFinal: danada.stock,
        motivo: "Daño: el empaque llegó roto",
        usuarioId: adri.id,
      },
    });
  });

  const bajos = variantes.filter((v) => v.stock <= 3).length;
  console.log(`⚠️  ${bajos} variantes con stock bajo (para probar las alertas)`);
  console.log("✅ Seed completado");
}

main()
  .catch((error) => {
    console.error("❌ Error en el seed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
