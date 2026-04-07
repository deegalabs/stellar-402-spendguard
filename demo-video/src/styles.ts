import { CSSProperties } from "react";

export const colors = {
  bg: "#0f172a",
  bgCard: "#1e293b",
  bgDark: "#020617",
  primary: "#3b82f6",
  primaryLight: "#60a5fa",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  purple: "#a855f7",
  white: "#f8fafc",
  gray: "#94a3b8",
  grayDark: "#475569",
  stellar: "#6366f1",
};

export const fullScreen: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
  background: colors.bg,
  color: colors.white,
  overflow: "hidden",
};

export const cardStyle: CSSProperties = {
  background: colors.bgCard,
  borderRadius: 16,
  padding: "32px 40px",
  border: `1px solid ${colors.grayDark}`,
};
