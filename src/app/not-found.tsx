import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/compartidos/logo";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-glow-suave px-4 text-center">
      <Logo />
      <p className="font-heading text-7xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold text-berry">No encontramos esta página</h1>
      <p className="max-w-md text-muted-foreground">Puede que el producto ya no esté disponible o que el enlace tenga un error.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/productos" className={buttonVariants({ variant: "glow", size: "lg" })}>
          Ver productos
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
