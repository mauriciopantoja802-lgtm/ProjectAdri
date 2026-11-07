# Glow by Adri ✨

Tienda en línea y sistema de gestión de **Glow by Adri**, tienda de maquillaje en Popayán, Cauca.
Ventas por **página web, WhatsApp, tienda física (POS) e Instagram**, con inventario, kardex, caja y reportes en un solo lugar.

**Stack:** Next.js 15 (App Router) · TypeScript estricto · Tailwind CSS v4 · shadcn/ui (Base UI) · Prisma 6 + PostgreSQL ·
Auth.js v5 · Zod + React Hook Form · Zustand · Cloudinary · Wompi · Recharts · @react-pdf/renderer · exceljs.

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Instalación](#2-instalación)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Base de datos y datos de ejemplo](#4-base-de-datos-y-datos-de-ejemplo)
5. [Ejecutar en local](#5-ejecutar-en-local)
6. [Configurar Cloudinary (imágenes)](#6-configurar-cloudinary-imágenes)
7. [Configurar Wompi (pagos en línea)](#7-configurar-wompi-pagos-en-línea)
8. [Despliegue en Vercel](#8-despliegue-en-vercel)
9. [Primeros pasos de Adri en el panel](#9-primeros-pasos-de-adri-en-el-panel)
10. [Cómo funciona (reglas de negocio)](#10-cómo-funciona-reglas-de-negocio)
11. [Seguridad](#11-seguridad)
12. [Estructura del proyecto](#12-estructura-del-proyecto)

---

## 1. Requisitos

- **Node.js 20 o superior** (probado con Node 22).
- Una base de datos **PostgreSQL**. Recomendado: [Neon](https://neon.tech) (plan gratis, sin tarjeta).
- Opcional para producción: cuentas en [Cloudinary](https://cloudinary.com) (imágenes) y [Wompi](https://comercios.wompi.co) (pagos).

## 2. Instalación

```bash
git clone <url-del-repositorio> glow-by-adri
cd glow-by-adri
npm install        # también genera el cliente de Prisma
```

## 3. Variables de entorno

```bash
cp .env.example .env
```

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `DATABASE_URL` | ✅ | Conexión *pooled* a PostgreSQL (la usa la app) |
| `DIRECT_URL` | ✅ | Conexión directa (la usan las migraciones). En local puede ser igual a `DATABASE_URL` |
| `AUTH_SECRET` | ✅ | Firma las sesiones y los enlaces de seguimiento. Genera uno con `npx auth secret` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL pública del sitio (en local `http://localhost:3000`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | Usuaria administradora que crea el seed |
| `NEXT_PUBLIC_WHATSAPP` | ✅ | WhatsApp del negocio, formato `57XXXXXXXXXX` |
| `NEXT_PUBLIC_CLOUDINARY_*`, `CLOUDINARY_API_SECRET` | Recomendada | Subir fotos de productos y banners |
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_*` | Opcional | Pago en línea. Mientras tengan `xxxx`, el pago en línea queda oculto |
| `ANTHROPIC_API_KEY` | Opcional | Lector de facturas con IA (botón **Escanear factura**) |
| `SEED_TIENDA_*` | Opcional | Dirección, horario e Instagram iniciales para el seed |
| `WHATSAPP_*` | Futuro | API oficial de WhatsApp Business (aún no se usa) |

### Cómo obtener las URLs en Neon

1. Crea un proyecto en Neon (región `aws-us-east-1` o `aws-sa-east-1`).
2. En **Connect**, copia la cadena con **Connection pooling** activado → `DATABASE_URL`.
3. Desactiva **Connection pooling** y copia la otra cadena → `DIRECT_URL`.

## 4. Base de datos y datos de ejemplo

```bash
npm run db:migrate          # aplica las migraciones (crea las tablas)
npm run db:seed             # carga los datos de ejemplo
```

> ⚠️ El seed **borra todos los datos** antes de cargar los de ejemplo. Úsalo solo en desarrollo o la primera vez.

El seed crea: la administradora (Adri), 7 categorías, 6 marcas, 20 productos con 43 tonos, 1 proveedor con su compra inicial,
8 clientas, 15 pedidos de todos los canales (con su historial y movimientos de kardex coherentes), plantillas de WhatsApp,
2 banners, el cupón `BIENVENIDA10` y la configuración de la tienda en Popayán.

| Comando | Qué hace |
|---|---|
| `npm run db:studio` | Abre una interfaz web para ver y editar los datos |
| `npm run db:reset` | Borra la base, reaplica migraciones y vuelve a correr el seed |
| `npm run db:deploy` | Aplica migraciones pendientes (producción) |

## 5. Ejecutar en local

```bash
npm run dev
```

- Tienda: <http://localhost:3000>
- Panel: <http://localhost:3000/admin> (entra con `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

Si el puerto 3000 está ocupado: `npx next dev -p 3005` (y ajusta `NEXT_PUBLIC_SITE_URL`).

Antes de subir cambios:

```bash
npm run typecheck && npm run lint && npm run build
```

## 6. Configurar Cloudinary (imágenes)

1. Crea una cuenta gratis en [cloudinary.com](https://cloudinary.com).
2. En **Settings → API Keys** copia `Cloud name`, `API Key` y `API Secret` a:
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.
3. Reinicia el servidor. En el formulario de producto aparecerá el botón **Subir imágenes** (desde el computador o la cámara del celular).

Las subidas son **firmadas por el servidor** (`/api/cloudinary/firma`): solo una ADMIN puede subir, y todo queda en la carpeta `glow-by-adri/`.
Sin Cloudinary configurado, se puede pegar la URL de una imagen de Cloudinary.

## 7. Configurar Wompi (pagos en línea)

1. Crea tu cuenta en [comercios.wompi.co](https://comercios.wompi.co). Empieza en **modo pruebas (sandbox)**.
2. En **Desarrolladores** copia:
   - Llave pública → `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` (`pub_test_…`)
   - Llave privada → `WOMPI_PRIVATE_KEY`
   - Secreto de **integridad** → `WOMPI_INTEGRITY_SECRET`
   - Secreto de **eventos** → `WOMPI_EVENTS_SECRET`
3. En **Desarrolladores → URL de eventos** configura: `https://TU-DOMINIO/api/webhooks/wompi`
4. Prueba con las tarjetas de sandbox de Wompi: `4242 4242 4242 4242` (aprobada) y `4111 1111 1111 1111` (rechazada), con cualquier fecha futura y CVC.
5. Para producción cambia a las llaves `pub_prod_…` y `WOMPI_API_URL="https://production.wompi.co/v1"`.

Cómo funciona: el pedido se crea **PENDIENTE**, la clienta paga en Wompi y vuelve a su página de seguimiento. Cuando Wompi confirma
(webhook firmado, o la consulta de respaldo al volver), el pedido pasa a **PAGADO** y se descuenta el stock **una sola vez**.
Si el pago es rechazado, la clienta puede reintentar con el botón **Pagar ahora**.

### Escanear facturas de proveedor (IA)

En **Inventario**, **Productos** o **Proveedores** → botón **Escanear factura**:

1. Toma una foto de la factura (o sube el PDF). La foto se comprime en el celular antes de subirla.
2. Claude (`claude-opus-5-5`, con salida estructurada) lee proveedor, número, fecha y cada línea: producto, tono, marca, cantidad y **precio de compra** (con IVA).
3. En la pantalla de revisión, cada línea viene marcada como **“Ya lo tengo”** (si coincide por código de barras, SKU o nombre + tono)
   o **“Producto nuevo”** (con categoría y marca sugeridas). Todo se puede corregir antes de guardar.
4. Al confirmar: se crean los productos nuevos **inactivos y sin precio de venta** (no aparecen en la tienda), se registra la compra
   y sube el stock. Luego entras a cada producto (**Definir precio y fotos**), pones el precio de venta, fotos y descripción, y lo activas.

Configuración: crea una llave en [console.anthropic.com](https://console.anthropic.com) y ponla en `ANTHROPIC_API_KEY`.
Cuesta unos pocos centavos de dólar por factura. Sin la llave, la página explica cómo activarla y se puede usar **Registrar compra** a mano.

### Ganancia por producto

**Inventario** muestra para cada variante el **precio de compra**, el **precio de venta** (con la oferta, si hay) y la **ganancia por unidad** en pesos y %,
más la **ganancia potencial** de todo el stock. Las variantes sin precio de venta aparecen marcadas como **Sin precio**. La exportación a Excel del inventario incluye la ganancia por unidad.

## 8. Despliegue en Vercel

1. Sube el proyecto a GitHub (el archivo `.env` **no** se sube; está en `.gitignore`).
2. En [vercel.com](https://vercel.com): **Add New → Project** e importa el repositorio.
3. En **Settings → Environment Variables** agrega las variables (el archivo `.env` no se sube a GitHub, por eso hay que cargarlas aquí):
   - `DATABASE_URL` y `DIRECT_URL`: las URLs de **Neon** (nunca `localhost`). Atajo: en Vercel → **Storage → Neon** se crea la base y
     las variables solas; si solo existe `DATABASE_URL_UNPOOLED`, el build la usa como `DIRECT_URL` automáticamente.
   - `AUTH_SECRET` (uno nuevo, no el de tu computador), `NEXT_PUBLIC_SITE_URL` = tu dominio (ej. `https://glowbyadri.vercel.app`),
     `NEXT_PUBLIC_WHATSAPP`, y las de Cloudinary, Wompi y Anthropic cuando las tengas.
4. Despliega. Vercel ejecuta `scripts/vercel-build.mjs`: revisa las variables (con un mensaje claro si falta alguna),
   **aplica las migraciones** y compila.
5. Solo la primera vez, carga los datos iniciales desde tu computador apuntando a la base de producción:
   ```bash
   DATABASE_URL="…" DIRECT_URL="…" npm run db:seed
   ```
   (o crea la administradora y la configuración a mano si no quieres los productos de ejemplo).
6. Configura en Wompi la URL de eventos con tu dominio y conecta el dominio propio en **Vercel → Domains**.
7. Registra el sitio en [Google Search Console](https://search.google.com/search-console) y envía `https://TU-DOMINIO/sitemap.xml`.
   Crea o actualiza el perfil de **Google Business** de la tienda en Popayán con la misma dirección.

## 9. Primeros pasos de Adri en el panel

1. **Cambia la contraseña temporal** en <http://localhost:3000/cuenta> → *Cambiar contraseña* (también desde el menú de tu usuario en la tienda).
2. **Configuración → Tienda y envíos:** dirección real, horario, WhatsApp, Instagram, costos de envío, monto para envío gratis y datos de pago.
3. **Configuración → Plantillas WhatsApp:** revisa los mensajes. Variables: `{nombre}`, `{codigo}`, `{total}`, `{direccionTienda}`, `{datosPago}`.
4. **Productos:** reemplaza los de ejemplo por los reales, con fotos, tonos y precios.
5. **Proveedores y compras:** registra la mercancía que llega; el stock sube solo.
6. Completa los datos entre corchetes en **Términos** y **Política de privacidad**, y hazlos revisar por un abogado.

## 10. Cómo funciona (reglas de negocio)

| Situación | Qué pasa con el stock |
|---|---|
| Venta en el POS (tienda, WhatsApp manual, Instagram) | Se descuenta al cobrar |
| Pedido web pagado con Wompi | Se descuenta cuando Wompi confirma el pago |
| Pedido web contra entrega o pedido de WhatsApp | Se descuenta cuando Adri lo **confirma** en el panel |
| Pedido cancelado que ya había descontado | Se devuelve automáticamente (movimiento DEVOLUCION) |
| Compra a proveedor | Entrada automática (ENTRADA_COMPRA) |
| Daño, pérdida, regalo, conteo | Ajuste manual desde Inventario, con motivo y usuaria |

- El stock **nunca** queda negativo: se descuenta con una operación atómica (`UPDATE … WHERE stock >= cantidad`) dentro de una transacción.
- Toda variación de stock deja un movimiento en el **kardex** con el stock resultante.
- Los códigos de pedido son consecutivos (`GA-0001`, `GA-0002`…) y nunca se repiten, aunque se vendan dos cosas al mismo tiempo.
- Cada ítem guarda el **precio y costo del momento de la venta**, así la utilidad de los reportes es exacta.
- Los pedidos de WhatsApp pendientes por más de **48 horas** se marcan como **“por vencer”** (no se cancelan solos).
- **Ventas** = pedidos confirmados en adelante. **Utilidad** = total − envío − costo de los productos.
- Todas las fechas se muestran en la hora de **Bogotá**.

## 11. Seguridad

- `/admin` protegido por middleware **y** verificación del rol ADMIN en la base de datos en cada página y Server Action.
- Contraseñas cifradas con bcrypt (12 rondas). Límite de intentos en login (8 por 15 min), registro y creación de pedidos.
- Precios siempre recalculados en el servidor: modificar el carrito en el navegador no cambia lo que se cobra.
- Webhook de Wompi verificado por checksum; firma de integridad en cada pago; procesamiento idempotente.
- Enlaces de seguimiento de pedido firmados (no se puede ver el pedido de otra clienta cambiando el número).
- Cabeceras de seguridad: CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Exportaciones a CSV/Excel protegidas contra inyección de fórmulas.
- Dependencias: `npm audit` reporta avisos en herramientas de desarrollo (Prisma CLI, shadcn CLI) y en `postcss`/`next-cloudinary`
  cuya corrección requiere Next 16. No afectan la tienda en producción; se resuelven al migrar a Next 16.

## 12. Estructura del proyecto

```
prisma/              schema.prisma, migraciones y seed.ts
src/app/(tienda)/    tienda pública: inicio, catálogo, producto, carrito, checkout, pedido, cuenta, páginas legales
src/app/(auth)/      login y registro
src/app/admin/       panel: dashboard, pedidos, POS, caja, clientas, productos, inventario, proveedores, reportes, configuración
src/app/api/         auth, webhook de Wompi, exportaciones, firma de Cloudinary
src/components/      ui (shadcn), tienda, admin, auth, compartidos
src/features/        lógica por dominio: productos, catalogo, inventario, pedidos, pos, pagos, whatsapp, reportes, clientas, configuracion, auth, cuenta
src/lib/             prisma, auth, formato (COP y fechas), etiquetas, errores, límites, utilidades
src/store/           carrito y ticket del POS (Zustand + localStorage)
```

**Identidad visual:** los colores están en `src/app/globals.css` (bloque “PALETA GLOW BY ADRI”). Al cambiarlos ahí, cambian en todo el sitio.
