import { useCurrentFrame, useVideoConfig, interpolate, Sequence } from "remotion";
import { colors } from "../styles";

type TerminalLineProps = {
  text: string;
  color?: string;
  prefix?: string;
  delay?: number;
};

export const TerminalLine = ({
  text,
  color = colors.white,
  prefix = ">",
  delay = 0,
}: TerminalLineProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const charsToShow = Math.floor(
    interpolate(frame - delay, [0, text.length * 1.5], [0, text.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  const opacity = interpolate(frame - delay, [0, 3], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        fontSize: 22,
        lineHeight: 1.6,
        fontFamily: "ui-monospace, 'Cascadia Code', monospace",
      }}
    >
      <span style={{ color: colors.green }}>{prefix} </span>
      <span style={{ color }}>{text.slice(0, charsToShow)}</span>
      {charsToShow < text.length && (
        <span
          style={{
            color: colors.primary,
            opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
          }}
        >
          _
        </span>
      )}
    </div>
  );
};
