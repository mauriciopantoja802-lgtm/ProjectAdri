"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * Carrusel de banners administrables. Usa scroll-snap nativo (se desliza con el dedo en celular)
 * y avanza solo cada 6 s, excepto si la persona prefiere menos movimiento o está interactuando.
 */
export function BannerPrincipal({ banners }: { banners: Banner[] }) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  const ir = (i: number) => {
    const el = pista.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (banners.length < 2 || pausado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => ir((actual + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [actual, pausado, banners.length]);

  if (!banners.length) return null;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Promociones"
      className="relative"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div
        ref={pista}
        onScroll={(e) => setActual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((b, i) => {
          const contenido = (
            <div className="relative h-[52vh] max-h-[520px] min-h-[340px] w-full">
              <Image src={b.imagen} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-berry/80 via-berry/40 to-transparent" />
              <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center gap-3 px-6 text-white sm:px-10">
                <h2 className="max-w-lg text-4xl leading-tight font-bold sm:text-6xl">{b.titulo}</h2>
                {b.subtitulo && <p className="max-w-md text-base text-white/90 sm:text-lg">{b.subtitulo}</p>}
                {b.enlace && (
                  <span className="bg-glow mt-2 inline-flex w-fit rounded-2xl px-6 py-3 font-semibold shadow-glow transition-transform group-hover:-translate-y-0.5">
                    Comprar ahora
                  </span>
                )}
              </div>
            </div>
          );
          return (
            <div key={b.id} className="w-full shrink-0 snap-start" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${banners.length}`}>
              {b.enlace ? (
                <Link href={b.enlace} className="group block">
                  {contenido}
                </Link>
              ) : (
                contenido
              )}
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              aria-current={i === actual}
              className={cn("h-2.5 rounded-full bg-white/70 transition-all", i === actual ? "w-7 bg-white" : "w-2.5")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
