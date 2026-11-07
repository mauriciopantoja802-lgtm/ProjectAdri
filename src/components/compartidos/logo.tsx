import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** "claro" para fondos oscuros (footer berry) */
  variante?: "normal" | "claro";
}

export function Logo({ className, variante = "normal" }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Glow by Adri, ir al inicio"
      className={cn(
        "group inline-flex items-baseline gap-1 font-heading text-2xl font-bold tracking-tight",
        variante === "normal" ? "text-primary" : "text-white",
        className,
      )}
    >
      <span>Glow</span>
      <span className="font-normal italic">by</span>
      <span>Adri</span>
      <span
        aria-hidden
        className="texto-dorado inline-block transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125"
      >
        ✨
      </span>
    </Link>
  );
}
