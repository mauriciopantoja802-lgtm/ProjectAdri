-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CLIENTE');

-- CreateEnum
CREATE TYPE "CanalVenta" AS ENUM ('WEB', 'WHATSAPP', 'TIENDA_FISICA', 'INSTAGRAM', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'LISTO_PARA_RECOGER', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'TARJETA', 'WOMPI', 'CONTRA_ENTREGA', 'MIXTO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('RECOGER_EN_TIENDA', 'DOMICILIO_POPAYAN', 'ENVIO_NACIONAL');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'DEVOLUCION');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clienta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "usuarioId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clienta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Direccion" (
    "id" TEXT NOT NULL,
    "clientaId" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "barrio" TEXT,
    "ciudad" TEXT NOT NULL DEFAULT 'Popayán',
    "depto" TEXT NOT NULL DEFAULT 'Cauca',
    "referencia" TEXT,

    CONSTRAINT "Direccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imagen" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "modoUso" TEXT,
    "categoriaId" TEXT NOT NULL,
    "marcaId" TEXT,
    "esNuevo" BOOLEAN NOT NULL DEFAULT false,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagenProducto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ImagenProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variante" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "colorHex" TEXT,
    "sku" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "precio" INTEGER NOT NULL,
    "precioOferta" INTEGER,
    "costo" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 3,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Variante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stockFinal" INTEGER NOT NULL,
    "motivo" TEXT,
    "pedidoId" TEXT,
    "compraId" TEXT,
    "usuarioId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "nit" TEXT,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" INTEGER NOT NULL,
    "notas" TEXT,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCompra" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costoUnit" INTEGER NOT NULL,

    CONSTRAINT "ItemCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "canal" "CanalVenta" NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "clientaId" TEXT,
    "nombreClienta" TEXT,
    "telefono" TEXT,
    "tipoEntrega" "TipoEntrega" NOT NULL DEFAULT 'RECOGER_EN_TIENDA',
    "direccionEnvio" TEXT,
    "ciudadEnvio" TEXT,
    "metodoPago" "MetodoPago",
    "stockDescontado" BOOLEAN NOT NULL DEFAULT false,
    "subtotal" INTEGER NOT NULL,
    "descuento" INTEGER NOT NULL DEFAULT 0,
    "costoEnvio" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "cuponId" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnit" INTEGER NOT NULL,
    "costoUnit" INTEGER NOT NULL,
    "descuento" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "monto" INTEGER NOT NULL,
    "referencia" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialEstado" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL,
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialEstado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cupon" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "porcentaje" INTEGER,
    "valorFijo" INTEGER,
    "minimoCompra" INTEGER NOT NULL DEFAULT 0,
    "usosMaximos" INTEGER,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "venceEn" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Cupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CierreCaja" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseInicial" INTEGER NOT NULL,
    "totalEfectivo" INTEGER NOT NULL,
    "totalOtros" INTEGER NOT NULL,
    "efectivoContado" INTEGER NOT NULL,
    "diferencia" INTEGER NOT NULL,
    "detalle" JSONB,
    "notas" TEXT,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "CierreCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "imagen" TEXT NOT NULL,
    "enlace" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaWhatsapp" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,

    CONSTRAINT "PlantillaWhatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionTienda" (
    "id" TEXT NOT NULL DEFAULT 'tienda',
    "nombre" TEXT NOT NULL DEFAULT 'Glow by Adri',
    "whatsapp" TEXT NOT NULL,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL DEFAULT 'Popayán',
    "horario" TEXT NOT NULL,
    "mapaUrl" TEXT,
    "costoDomicilio" INTEGER NOT NULL DEFAULT 0,
    "costoNacional" INTEGER NOT NULL DEFAULT 0,
    "envioGratisDesde" INTEGER,
    "datosPago" TEXT,

    CONSTRAINT "ConfiguracionTienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consecutivo" (
    "clave" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Consecutivo_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Clienta_telefono_key" ON "Clienta"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Clienta_usuarioId_key" ON "Clienta"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_slug_key" ON "Categoria"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_slug_key" ON "Marca"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_slug_key" ON "Producto"("slug");

-- CreateIndex
CREATE INDEX "Producto_categoriaId_idx" ON "Producto"("categoriaId");

-- CreateIndex
CREATE INDEX "Producto_marcaId_idx" ON "Producto"("marcaId");

-- CreateIndex
CREATE INDEX "ImagenProducto_productoId_idx" ON "ImagenProducto"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Variante_sku_key" ON "Variante"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Variante_codigoBarras_key" ON "Variante"("codigoBarras");

-- CreateIndex
CREATE INDEX "Variante_productoId_idx" ON "Variante"("productoId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_varianteId_creadoEn_idx" ON "MovimientoInventario"("varianteId", "creadoEn");

-- CreateIndex
CREATE INDEX "MovimientoInventario_pedidoId_idx" ON "MovimientoInventario"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_codigo_key" ON "Pedido"("codigo");

-- CreateIndex
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");

-- CreateIndex
CREATE INDEX "Pedido_canal_creadoEn_idx" ON "Pedido"("canal", "creadoEn");

-- CreateIndex
CREATE INDEX "Pedido_creadoEn_idx" ON "Pedido"("creadoEn");

-- CreateIndex
CREATE INDEX "Pedido_clientaId_idx" ON "Pedido"("clientaId");

-- CreateIndex
CREATE INDEX "ItemPedido_pedidoId_idx" ON "ItemPedido"("pedidoId");

-- CreateIndex
CREATE INDEX "ItemPedido_varianteId_idx" ON "ItemPedido"("varianteId");

-- CreateIndex
CREATE INDEX "Pago_pedidoId_idx" ON "Pago"("pedidoId");

-- CreateIndex
CREATE INDEX "Pago_referencia_idx" ON "Pago"("referencia");

-- CreateIndex
CREATE INDEX "HistorialEstado_pedidoId_idx" ON "HistorialEstado"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Cupon_codigo_key" ON "Cupon"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaWhatsapp_clave_key" ON "PlantillaWhatsapp"("clave");

-- AddForeignKey
ALTER TABLE "Clienta" ADD CONSTRAINT "Clienta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Direccion" ADD CONSTRAINT "Direccion_clientaId_fkey" FOREIGN KEY ("clientaId") REFERENCES "Clienta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagenProducto" ADD CONSTRAINT "ImagenProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCompra" ADD CONSTRAINT "ItemCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCompra" ADD CONSTRAINT "ItemCompra_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clientaId_fkey" FOREIGN KEY ("clientaId") REFERENCES "Clienta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cuponId_fkey" FOREIGN KEY ("cuponId") REFERENCES "Cupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialEstado" ADD CONSTRAINT "HistorialEstado_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreCaja" ADD CONSTRAINT "CierreCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
