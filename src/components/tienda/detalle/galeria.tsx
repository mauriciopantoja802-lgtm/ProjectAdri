"use client";

import { useState } from "react";
import Image from "next/image";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";
import { cn } from "@/lib/utils";

export function Galeria({ imagenes, nombre }: { imagenes: { url: string; alt: string | null }[]; nombre: string }) {
  const lista = imagenes.length ? imagenes : [{ url: IMAGEN_PLACEHOLDER, alt: nombre }];
  const [actual, setActual] = useState(0);
  const img = lista[Math.min(actual, lista.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-nude shadow-suave">
        <Image src={img.url} alt={img.alt ?? nombre} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      {lista.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Más imágenes">
          {lista.map((im, i) => (
            <li key={im.url + i}>
              <button
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === actual}
                className={cn(
                  "relative block size-20 overflow-hidden rounded-2xl ring-2 ring-transparent transition-all",
                  i === actual ? "ring-primary" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={im.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
