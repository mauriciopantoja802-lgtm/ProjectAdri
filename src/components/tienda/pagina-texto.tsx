/** Contenedor para páginas de texto (legales, sobre Adri, envíos): tipografía cómoda de leer. */
export function PaginaTexto({ titulo, actualizado, children }: { titulo: string; actualizado?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-berry sm:text-4xl">{titulo}</h1>
      {actualizado && <p className="mb-8 text-sm text-muted-foreground">Última actualización: {actualizado}</p>}
      <div className="space-y-4 leading-relaxed [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-berry [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}
