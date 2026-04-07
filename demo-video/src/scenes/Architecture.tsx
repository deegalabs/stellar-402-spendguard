import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { colors, fullScreen, cardStyle } from "../styles";

const steps = [
  { label: "Agent (Node.js)", detail: "GET /api/weather", icon: "A", color: colors.primary },
  { label: "Merchant API", detail: "HTTP 402 Payment Required", icon: "M", color: colors.yellow },
  { label: "BudgetGuard", detail: "authorize_payment(price, merchant)", icon: "B", color: colors.stellar },
  { label: "USDC SAC", detail: "token.transfer(contract -> merchant)", icon: "$", color: colors.green },
  { label: "Stellar Ledger", detail: "< 5s finality, $0.0001 fees", icon: "S", color: colors.purple },
];

export const Architecture = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div style={{ ...fullScreen, gap: 32 }}>
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 42,
          fontWeight: 800,
          color: colors.white,
        }}
      >
        How It Works
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((step, i) => {
          const entrance = spring({
            frame,
            fps,
            delay: 15 + i * 12,
            config: { damping: 200 },
          });
          const translateX = interpolate(entrance, [0, 1], [-100, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: entrance,
                transform: `translateX(${translateX}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              {/* Connector line */}
              {i > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 108,
                    marginTop: -40,
                    width: 2,
                    height: 20,
                    background: colors.grayDark,
                  }}
                />
              )}

              {/* Step number */}
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: step.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div style={{ ...cardStyle, padding: "16px 24px", flex: 1, maxWidth: 600 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.white }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 16, color: colors.gray, marginTop: 4, fontFamily: "monospace" }}>
                  {step.detail}
                </div>
              </div>

              {/* Step number label */}
              <div style={{ fontSize: 14, color: colors.grayDark, width: 30 }}>
                {i + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
