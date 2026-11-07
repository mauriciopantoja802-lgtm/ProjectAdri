import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { BotonConfirmarServidor } from "@/components/admin/boton-confirmar-servidor";
import { DialogoCategoria, DialogoMarca } from "@/components/admin/productos/dialogos-catalogo";
import { listarCategorias, listarMarcas } from "@/features/productos/queries";
import { eliminarCategoria, eliminarMarca } from "@/features/productos/actions";

export const metadata: Metadata = { title: "Categorías y marcas" };

export default async function PaginaCategorias() {
  const [categorias, marcas] = await Promise.all([listarCategorias(), listarMarcas()]);

  return (
    <>
      <EncabezadoPagina titulo="Categorías y marcas" descripcion="Organiza tu catálogo para que las clientas encuentren todo rápido." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-suave">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-berry">Categorías ({categorias.length})</h2>
            <DialogoCategoria
              disparador={
                <Button variant="glow" size="sm">
                  <Plus aria-hidden /> Nueva
                </Button>
              }
            />
          </div>
          <ul className="divide-y divide-border">
            {categorias.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="font-medium">
                    <span className="mr-2 text-xs text-muted-foreground">#{c.orden}</span>
                    {c.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    /categoria/{c.slug} · {c._count.productos} producto(s)
                  </p>
                </div>
                <div className="flex gap-1">
                  <DialogoCategoria
                    categoria={{ id: c.id, nombre: c.nombre, slug: c.slug, imagen: c.imagen, orden: c.orden }}
                    disparador={
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${c.nombre}`}>
                        <Pencil aria-hidden />
                      </Button>
                    }
                  />
                  <BotonConfirmarServidor
                    titulo={`¿Eliminar la categoría “${c.nombre}”?`}
                    descripcion="Solo se puede eliminar si no tiene productos."
                    accion={eliminarCategoria.bind(null, c.id)}
                    etiqueta={`Eliminar ${c.nombre}`}
                    icono={<Trash2 className="text-destructive" aria-hidden />}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-suave">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-berry">Marcas ({marcas.length})</h2>
            <DialogoMarca
              disparador={
                <Button variant="glow" size="sm">
                  <Plus aria-hidden /> Nueva
                </Button>
              }
            />
          </div>
          <ul className="divide-y divide-border">
            {marcas.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="font-medium">{m.nombre}</p>
                  <p className="text-xs text-muted-foreground">{m._count.productos} producto(s)</p>
                </div>
                <div className="flex gap-1">
                  <DialogoMarca
                    marca={{ id: m.id, nombre: m.nombre, slug: m.slug }}
                    disparador={
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${m.nombre}`}>
                        <Pencil aria-hidden />
                      </Button>
                    }
                  />
                  <BotonConfirmarServidor
                    titulo={`¿Eliminar la marca “${m.nombre}”?`}
                    descripcion="Sus productos quedarán como “sin marca”."
                    accion={eliminarMarca.bind(null, m.id)}
                    etiqueta={`Eliminar ${m.nombre}`}
                    icono={<Trash2 className="text-destructive" aria-hidden />}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
