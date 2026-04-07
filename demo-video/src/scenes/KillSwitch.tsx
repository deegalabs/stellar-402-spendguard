import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { colors, fullScreen, cardStyle } from "../styles";
import { TerminalLine } from "../components/TerminalLine";

export const KillSwitch = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({ frame, fps, config: { damping: 200 } });

  const modalOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const modalScale = spring({ frame, fps, delay: 30, config: { damping: 15, stiffness: 200 } });

  const pausedBanner = interpolate(frame, [140, 155], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const pulseOpacity =
    frame > 155
      ? interpolate(Math.sin((frame - 155) * 0.1), [-1, 1], [0.7, 1])
      : 0;

  return (
    <div style={{ ...fullScreen, gap: 24, position: "relative" }}>
      <div
        style={{
          opacity: titleEntrance,
          fontSize: 42,
          fontWeight: 900,
          color: colors.red,
        }}
      >
        Emergency Kill Switch
      </div>

      {/* Modal */}
      <div
        style={{
          opacity: modalOpacity,
          transform: `scale(${modalScale})`,
          ...cardStyle,
          background: colors.bgDark,
          border: `2px solid ${colors.red}`,
          padding: "40px 48px",
          maxWidth: 700,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 800, color: colors.red, marginBottom: 16 }}>
          Confirm Emergency Pause
        </div>
        <div style={{ fontSize: 18, color: colors.gray, lineHeight: 1.6, marginBottom: 24 }}>
          This will immediately block ALL new payment authorizations.
        </div>
        <div
          style={{
            fontSize: 15,
            color: colors.yellow,
            lineHeight: 1.5,
            padding: "12px 16px",
            background: "rgba(234, 179, 8, 0.1)",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          Transactions already submitted to the Stellar ledger
          <br />
          are final and cannot be reversed.
        </div>

        {frame > 90 && (
          <div
            style={{
              display: "inline-block",
              background: colors.red,
              color: colors.white,
              fontSize: 18,
              fontWeight: 700,
              padding: "12px 32px",
              borderRadius: 10,
            }}
          >
            Yes, Pause Now
          </div>
        )}
      </div>

      {/* PAUSED banner */}
      {frame > 140 && (
        <div
          style={{
            opacity: pulseOpacity,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            background: colors.red,
            padding: "14px",
            textAlign: "center",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          CONTRACT PAUSED -- ALL AGENT PAYMENTS BLOCKED
        </div>
      )}
    </div>
  );
};
