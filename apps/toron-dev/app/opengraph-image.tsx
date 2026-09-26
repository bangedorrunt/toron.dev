import { ImageResponse } from "next/og";

export const alt = "toron.dev — the autonomous agent stack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#0a0a0f",
        color: "#f5f3ff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          color: "#8b5cf6",
          fontSize: 24,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 24,
        }}
      >
        toron.dev
      </div>
      <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05, maxWidth: 920 }}>
        Mail for machines.
      </div>
      <div style={{ color: "#a3a3b8", fontSize: 30, marginTop: 28 }}>
        The autonomous agent stack.
      </div>
      <div style={{ color: "#8b5cf6", fontSize: 20, marginTop: 52 }}>
        toron · flywheel · beads · chiebukuro
      </div>
    </div>,
    size,
  );
}
