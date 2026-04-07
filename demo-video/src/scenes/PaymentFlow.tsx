import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { colors, fullScreen, cardStyle } from "../styles";
import { TerminalLine } from "../components/TerminalLine";

export const PaymentFlow = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const lines = [
    { text: "GET /api/demo/protected-resource", color: colors.primary, delay: 20 },
    { text: "HTTP 402 Payment Required", color: colors.yellow, prefix: "<", delay: 50 },
    { text: '  price: "1000000" (0.10 USDC)', color: colors.gray, prefix: " ", delay: 65 },
    { text: '  payTo: "G...MERCHANT"', color: colors.gray, prefix: " ", delay: 75 },
    { text: "contract.authorize_payment($0.10, merchant)", color: colors.stellar, delay: 100 },
    { text: "  paused? NO", color: colors.green, prefix: " ", delay: 120 },
    { text: "  whitelist? YES", color: colors.green, prefix: " ", delay: 130 },
    { text: "  max_tx? $0.10 <= $50.00 YES", color: colors.green, prefix: " ", delay: 140 },
    { text: "  daily_limit? $0.10 <= $100.00 YES", color: colors.green, prefix: " ", delay: 150 },
    { text: "  balance? YES", color: colors.green, prefix: " ", delay: 160 },
    { text: "USDC.transfer(contract -> merchant, 0.10)", color: colors.green, prefix: "$", delay: 180 },
    { text: "PAYMENT AUTHORIZED  tx: 5c4e69...  4.2s", color: colors.green, prefix: "OK", delay: 210 },
    { text: "Retry: HTTP 200 OK  data: Weather: sunny, 25C", color: colors.white, prefix: "<", delay: 240 },
  ];

  return (
    <div style={{ ...fullScreen, alignItems: "flex-start", padding: "60px 120px" }}>
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 36,
          fontWeight: 800,
          color: colors.green,
          marginBottom: 24,
        }}
      >
        x402 Payment Flow (Success)
      </div>

      <div
        style={{
          ...cardStyle,
          background: colors.bgDark,
          padding: "28px 36px",
          width: "100%",
          maxWidth: 1100,
        }}
      >
        {lines.map((line, i) => (
          <TerminalLine
            key={i}
            text={line.text}
            color={line.color}
            prefix={line.prefix}
            delay={line.delay}
          />
        ))}
      </div>
    </div>
  );
};
