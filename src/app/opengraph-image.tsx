import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Mandi Mitra — daily mandi prices across India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fafaf6 0%, #f3e7d0 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          fontFamily: "sans-serif",
          color: "#15171a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#1a3d2e" }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: "#1a3d2e",
              color: "#fafaf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            ₹
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Mandi Mitra</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 80, fontWeight: 600, lineHeight: 1.02, color: "#1a3d2e", letterSpacing: -2 }}>
            Daily mandi prices,
            <br /> for every corner of India.
          </div>
          <div style={{ fontSize: 26, color: "#3a3f47", maxWidth: 900 }}>
            Wholesale prices from 3,000+ markets. Sourced from AGMARKNET. Free to use.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
