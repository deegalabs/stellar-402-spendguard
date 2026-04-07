import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../styles";

type BadgeProps = {
  label: string;
  bg?: string;
  color?: string;
  delay?: number;
};

export const Badge = ({
  label,
  bg = colors.primary,
  color = colors.white,
  delay = 0,
}: BadgeProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, delay, config: { damping: 200 } });

  return (
    <span
      style={{
        display: "inline-block",
        transform: `scale(${scale})`,
        background: bg,
        color,
        fontSize: 18,
        fontWeight: 700,
        padding: "6px 16px",
        borderRadius: 8,
        letterSpacing: 1,
        fontFamily: "ui-monospace, monospace",
      }}
    >
      {label}
    </span>
  );
};
