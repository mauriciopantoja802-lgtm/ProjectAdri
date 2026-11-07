import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/compartidos/logo";

export const metadata: Metadata = {
  robots: { index: false, follow: false }, // login y registro no deben aparecer en Google
};

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-glow-suave">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-6">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-sm font-medium text-berry transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden /> Volver a la tienda
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-glow sm:p-8">{children}</div>
      </main>
    </div>
  );
}
