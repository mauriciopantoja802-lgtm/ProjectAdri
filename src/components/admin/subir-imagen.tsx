"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { esUrlImagenPermitida } from "@/lib/imagenes";

const CLOUDINARY_LISTO = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
);

/**
 * Botón para subir imágenes a Cloudinary (subida firmada) o, como alternativa,
 * pegar la URL de una imagen que ya está en Cloudinary.
 */
export function SubirImagen({
  alSubir,
  maximo = 10,
  carpeta = "glow-by-adri/productos",
}: {
  alSubir: (url: string) => void;
  maximo?: number;
  carpeta?: string;
}) {
  const [url, setUrl] = useState("");

  const agregarUrl = () => {
    const limpia = url.trim();
    if (!esUrlImagenPermitida(limpia)) {
      toast.error("La URL debe ser de Cloudinary (https://res.cloudinary.com/…)");
      return;
    }
    alSubir(limpia);
    setUrl("");
  };

  return (
    <div className="space-y-2">
      {CLOUDINARY_LISTO ? (
        <CldUploadWidget
          signatureEndpoint="/api/cloudinary/firma"
          options={{
            folder: carpeta,
            multiple: maximo > 1,
            maxFiles: maximo,
            sources: ["local", "camera", "url"],
            clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
            maxFileSize: 5_000_000,
            language: "es",
          }}
          onSuccess={(resultado) => {
            const info = resultado.info;
            if (info && typeof info === "object" && "secure_url" in info) alSubir(String(info.secure_url));
          }}
          onError={() => toast.error("No se pudo subir la imagen. Intenta de nuevo.")}
        >
          {({ open }) => (
            <Button type="button" variant="outline" onClick={() => open()} className="w-full border-dashed sm:w-auto">
              <ImagePlus aria-hidden /> Subir imágenes
            </Button>
          )}
        </CldUploadWidget>
      ) : (
        <p className="rounded-xl bg-nude p-3 text-xs text-muted-foreground">
          Para subir fotos desde el computador o el celular, configura Cloudinary en el archivo .env (ver README).
          Mientras tanto puedes pegar la URL de una imagen de Cloudinary.
        </p>
      )}
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarUrl();
            }
          }}
          placeholder="https://res.cloudinary.com/…"
          aria-label="URL de la imagen"
        />
        <Button type="button" variant="secondary" onClick={agregarUrl} disabled={!url.trim()}>
          <Link2 aria-hidden /> Agregar
        </Button>
      </div>
    </div>
  );
}
