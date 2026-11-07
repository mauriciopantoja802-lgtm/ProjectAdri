import { ImageResponse } from "next/og";

export const alt = "Glow by Adri ✨ — Maquillaje en Popayán";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen que aparece al compartir la tienda por WhatsApp, Facebook o Instagram. */
export default function ImagenOG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E91E8C 0%, #F06AB5 55%, #F8BBD9 100%)",
          color: "white",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 700, display: "flex", gap: 24 }}>
          <span>Glow</span>
          <span style={{ fontStyle: "italic", fontWeight: 400 }}>by</span>
          <span>Adri</span>
          <span style={{ color: "#FFE7B8" }}>✨</span>
        </div>
        <div style={{ fontSize: 42, marginTop: 24, fontFamily: "sans-serif" }}>Maquillaje y skincare en Popayán</div>
        <div style={{ fontSize: 30, marginTop: 18, fontFamily: "sans-serif", opacity: 0.9 }}>Domicilios · Envíos a toda Colombia · WhatsApp</div>
      </div>
    ),
    size,
  );
}
