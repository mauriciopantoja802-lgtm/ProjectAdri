import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Títulos: Playfair Display (elegante). Textos: Poppins (moderna y legible en celular).
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const urlSitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: {
    default: "Glow by Adri ✨ | Maquillaje en Popayán",
    template: "%s | Glow by Adri",
  },
  description:
    "Tienda de maquillaje y skincare en Popayán, Cauca. Labiales, bases, sombras y más. Domicilios en Popayán y envíos a toda Colombia.",
  applicationName: "Glow by Adri",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Glow by Adri",
  },
};

export const viewport: Viewport = {
  themeColor: "#E91E8C",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={`${playfair.variable} ${poppins.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
