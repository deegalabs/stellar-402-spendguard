import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { colors, fullScreen } from "../styles";
import { Badge } from "../components/Badge";

const stats = [
  { label: "Tests", value: "37/37 GREEN" },
  { label: "Invariants", value: "12 enforced" },
  { label: "Attack vectors", value: "10 defended" },
  { label: "WASM size", value: "9.7 KB" },
];

export const Closing = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 200 } });
  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const statsOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const footerOpacity = interpolate(frame, [100, 120], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div style={{ ...fullScreen, gap: 28 }}>
      <div style={{ transform: `scale(${titleScale})`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: -2,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.stellar})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SpendGuard
        </div>
      </div>

      <div
        style={{
          opacity: taglineOpacity,
          fontSize: 26,
          color: colors.gray,
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.5,
        }}
      >
        The spending-policy contract that was missing
        <br />
        for x402 agents on Stellar
      </div>

      <div style={{ opacity: taglineOpacity, display: "flex", gap: 12, marginTop: 4 }}>
        <Badge label="SOROBAN" bg={colors.stellar} delay={40} />
        <Badge label="x402" bg={colors.primary} delay={45} />
        <Badge label="USDC SAC" bg={colors.green} color={colors.bgDark} delay={50} />
        <Badge label="APACHE 2.0" bg={colors.grayDark} delay={55} />
      </div>

      {/* Stats */}
      <div style={{ opacity: statsOpacity, display: "flex", gap: 32, marginTop: 20 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: colors.white }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: colors.grayDark, marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          opacity: footerOpacity,
          marginTop: 32,
          textAlign: "center",
          fontSize: 18,
          color: colors.grayDark,
        }}
      >
        <div>github.com/deegalabs/stellar-402-spendguard</div>
        <div style={{ marginTop: 8, color: colors.gray }}>Built by DeegaLabs</div>
      </div>
    </div>
  );
};
