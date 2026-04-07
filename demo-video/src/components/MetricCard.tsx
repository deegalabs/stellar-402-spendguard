import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors, cardStyle } from "../styles";

type MetricCardProps = {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  delay?: number;
};

export const MetricCard = ({
  label,
  value,
  sub,
  alert,
  delay = 0,
}: MetricCardProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: { damping: 200 } });
  const translateY = interpolate(entrance, [0, 1], [40, 0]);

  return (
    <div
      style={{
        ...cardStyle,
        opacity: entrance,
        transform: `translateY(${translateY}px)`,
        borderColor: alert ? colors.red : colors.grayDark,
        minWidth: 220,
      }}
    >
      <div style={{ fontSize: 14, color: colors.gray, marginBottom: 8 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: alert ? colors.red : colors.white,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 13, color: colors.grayDark, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
};
