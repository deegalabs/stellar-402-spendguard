import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { colors, fullScreen } from "../styles";
import { Badge } from "../components/Badge";

export const Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 200 } });
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const problemOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div style={{ ...fullScreen, gap: 24 }}>
      {/* Logo area */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
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
          opacity: subtitleOpacity,
          fontSize: 28,
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

      <div
        style={{
          opacity: subtitleOpacity,
          display: "flex",
          gap: 12,
          marginTop: 8,
        }}
      >
        <Badge label="SOROBAN" bg={colors.stellar} delay={30} />
        <Badge label="x402" bg={colors.primary} delay={35} />
        <Badge label="USDC" bg={colors.green} color={colors.bgDark} delay={40} />
      </div>

      <div
        style={{
          opacity: problemOpacity,
          marginTop: 40,
          fontSize: 20,
          color: colors.yellow,
          textAlign: "center",
          maxWidth: 650,
          lineHeight: 1.6,
        }}
      >
        AI agents that pay autonomously need on-chain guardrails.
        <br />
        Not off-chain rate limits. Not trust. Cryptographic enforcement.
      </div>
    </div>
  );
};
