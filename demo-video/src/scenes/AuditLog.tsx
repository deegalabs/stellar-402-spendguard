import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { colors, fullScreen, cardStyle } from "../styles";

const rows = [
  { status: "SETTLED", type: "payment_authorized", amount: "$0.10", hash: "5c4e69...", color: colors.green },
  { status: "SETTLED", type: "payment_authorized", amount: "$0.25", hash: "0eee29...", color: colors.green },
  { status: "SETTLED", type: "payment_authorized", amount: "$1.00", hash: "8d157d...", color: colors.green },
  { status: "SETTLED", type: "payment_authorized", amount: "$0.50", hash: "67cfe2...", color: colors.green },
  { status: "BLOCKED", type: "exceeds_daily_limit", amount: "$2.00", hash: "------", color: colors.red },
  { status: "SETTLED", type: "emergency_pause", amount: "--", hash: "a71a4f...", color: colors.yellow },
  { status: "SETTLED", type: "emergency_unpause", amount: "--", hash: "dbfb05...", color: colors.green },
  { status: "SETTLED", type: "payment_authorized", amount: "$3.00", hash: "fade29...", color: colors.green },
];

export const AuditLog = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div style={{ ...fullScreen, alignItems: "flex-start", padding: "50px 100px" }}>
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 36,
          fontWeight: 800,
          color: colors.white,
          marginBottom: 24,
        }}
      >
        Audit Log -- On-Chain Transparency
      </div>

      {/* Table */}
      <div
        style={{
          ...cardStyle,
          padding: 0,
          width: "100%",
          maxWidth: 1200,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 120px 140px",
            padding: "14px 24px",
            background: colors.bgDark,
            fontSize: 13,
            fontWeight: 700,
            color: colors.grayDark,
            letterSpacing: 1,
          }}
        >
          <span>STATUS</span>
          <span>TYPE</span>
          <span style={{ textAlign: "right" }}>AMOUNT</span>
          <span style={{ textAlign: "right" }}>TX HASH</span>
        </div>

        {/* Rows */}
        {rows.map((row, i) => {
          const entrance = spring({
            frame,
            fps,
            delay: 20 + i * 8,
            config: { damping: 200 },
          });

          return (
            <div
              key={i}
              style={{
                opacity: entrance,
                display: "grid",
                gridTemplateColumns: "120px 1fr 120px 140px",
                padding: "12px 24px",
                borderTop: `1px solid ${colors.grayDark}33`,
                background:
                  row.status === "BLOCKED"
                    ? "rgba(239, 68, 68, 0.08)"
                    : "transparent",
                fontSize: 16,
              }}
            >
              <span
                style={{
                  color: row.color,
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "2px 8px",
                  background: `${row.color}18`,
                  borderRadius: 4,
                  display: "inline-block",
                  width: "fit-content",
                }}
              >
                {row.status}
              </span>
              <span style={{ color: colors.gray }}>{row.type}</span>
              <span
                style={{
                  textAlign: "right",
                  fontWeight: 600,
                  color: colors.white,
                  fontFamily: "monospace",
                }}
              >
                {row.amount}
              </span>
              <span
                style={{
                  textAlign: "right",
                  color: colors.primary,
                  fontFamily: "monospace",
                }}
              >
                {row.hash}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div
        style={{
          opacity: interpolate(frame, [100, 120], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          marginTop: 20,
          fontSize: 16,
          color: colors.grayDark,
        }}
      >
        Every TX hash links to Stellar Expert -- fully verifiable on-chain
      </div>
    </div>
  );
};
