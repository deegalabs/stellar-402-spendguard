import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { colors, fullScreen, cardStyle } from "../styles";
import { TerminalLine } from "../components/TerminalLine";
import { MetricCard } from "../components/MetricCard";

export const BlockedPayment = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const blockFlash =
    frame > 180
      ? interpolate(
          Math.sin((frame - 180) * 0.15),
          [-1, 1],
          [0.6, 1],
        )
      : 0;

  return (
    <div style={{ ...fullScreen, alignItems: "flex-start", padding: "60px 120px", gap: 28 }}>
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 36,
          fontWeight: 800,
          color: colors.red,
        }}
      >
        Daily Limit Enforcement
      </div>

      {/* Metric cards */}
      <div style={{ display: "flex", gap: 20 }}>
        <MetricCard label="Spent Today" value="$4.90" sub="of $5.00" alert delay={10} />
        <MetricCard label="Daily Limit" value="$5.00" sub="USDC per day" delay={15} />
        <MetricCard label="Requested" value="$2.00" sub="premium data" alert delay={20} />
      </div>

      {/* Terminal */}
      <div
        style={{
          ...cardStyle,
          background: colors.bgDark,
          padding: "24px 32px",
          width: "100%",
          maxWidth: 1000,
        }}
      >
        <TerminalLine
          text="authorize_payment($2.00, merchant)"
          color={colors.stellar}
          delay={40}
        />
        <TerminalLine
          text="$4.90 + $2.00 = $6.90 > $5.00 daily_limit"
          color={colors.yellow}
          prefix=" "
          delay={80}
        />
        <TerminalLine
          text="BLOCKED: ExceedsDailyLimit (Error #5)"
          color={colors.red}
          prefix="XX"
          delay={120}
        />
      </div>

      {/* Big blocked message */}
      {frame > 160 && (
        <div
          style={{
            opacity: blockFlash,
            fontSize: 28,
            fontWeight: 800,
            color: colors.red,
            textAlign: "center",
            width: "100%",
            padding: "16px",
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: 12,
            border: `2px solid ${colors.red}`,
          }}
        >
          The CONTRACT rejected this -- not the backend, not the agent.
          <br />
          On-chain governance.
        </div>
      )}
    </div>
  );
};
