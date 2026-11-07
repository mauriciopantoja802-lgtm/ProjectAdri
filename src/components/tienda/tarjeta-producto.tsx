import Image from "next/image";
import Link from "next/link";
import type { ProductoTarjeta } from "@/features/catalogo/queries";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";
import { Precio } from "./precio";
import { BotonAgregarRapido } from "./boton-agregar-rapido";

export function TarjetaProducto({ producto: p, prioridad }: { producto: ProductoTarjeta; prioridad?: boolean }) {
  const agotado = p.stock <= 0;
  const [img1, img2] = p.imagenes;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-suave transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
      <Link href={`/productos/${p.slug}`} className="relative block aspect-square overflow-hidden bg-nude" aria-label={p.nombre}>
        <Image
          src={img1?.url ?? IMAGEN_PLACEHOLDER}
          alt={img1?.alt ?? p.nombre}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={prioridad}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {img2 && (
          <Image
            src={img2.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {agotado ? (
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[0.7rem] font-semibold text-white">Agotado</span>
          ) : (
            <>
              {p.descuentoPct ? (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[0.7rem] font-semibold text-white">-{p.descuentoPct}%</span>
              ) : null}
              {p.esNuevo && <span className="rounded-full bg-white px-2.5 py-0.5 text-[0.7rem] font-semibold text-primary">Nuevo</span>}
              {p.destacado && <span className="rounded-full bg-accent px-2.5 py-0.5 text-[0.7rem] font-semibold text-berry">Top ventas</span>}
            </>
          )}
        </div>
      </Link>

      {p.varianteUnica && !agotado && (
        <BotonAgregarRapido
          className="absolute top-2.5 right-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          item={{
            varianteId: p.varianteUnica.id,
            productoSlug: p.slug,
            nombre: p.nombre,
            variante: p.varianteUnica.nombre,
            imagen: img1?.url,
            precio: p.precio,
            stock: p.varianteUnica.stock,
          }}
        />
      )}

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {p.marca && <p className="text-[0.7rem] font-semibold tracking-wider text-dorado uppercase">{p.marca.nombre}</p>}
        <h3 className="line-clamp-2 font-sans text-sm leading-snug font-medium">
          <Link href={`/productos/${p.slug}`} className="hover:text-primary">
            {p.nombre}
          </Link>
        </h3>
        {p.tonos.length > 1 && (
          <div className="flex items-center gap-1" role="img" aria-label={`${p.tonos.length} tonos disponibles`}>
            {p.tonos.slice(0, 5).map((t) => (
              <span key={t} className="size-3.5 rounded-full ring-1 ring-border" style={{ backgroundColor: t }} />
            ))}
            {p.tonos.length > 5 && <span className="text-xs text-muted-foreground">+{p.tonos.length - 5}</span>}
          </div>
        )}
        <Precio precio={p.precio} anterior={p.precioAnterior} className="mt-auto pt-1" />
      </div>
    </article>
  );
}

export function GrillaProductos({ productos }: { productos: ProductoTarjeta[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {productos.map((p, i) => (
        <li key={p.id}>
          <TarjetaProducto producto={p} prioridad={i < 4} />
        </li>
      ))}
    </ul>
  );
}
