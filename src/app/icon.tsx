import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Ícono de la pestaña: "G" en Playfair sobre el degradado fucsia de la marca. */
export default function Icono() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
          background: "linear-gradient(135deg, #E91E8C, #F06AB5)",
          color: "white",
          fontSize: 44,
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        G
      </div>
    ),
    size,
  );
}
