import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "#0a0a0f",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "120px",
          height: "120px",
          background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
          borderRadius: "28px",
        }}
      >
        <span style={{ color: "white", fontSize: 80, fontWeight: 900 }}>A</span>
      </div>
    </div>,
    size
  );
}
