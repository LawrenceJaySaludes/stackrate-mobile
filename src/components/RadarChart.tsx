import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";
import { colors, spacing } from "../theme";

export interface RadarDataPoint {
  label: string;
  value: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size: number;
}

const LEVELS = 4;
const LEVEL_COLORS = [
  "rgba(99, 102, 241, 0.05)",
  "rgba(99, 102, 241, 0.08)",
  "rgba(99, 102, 241, 0.11)",
  "rgba(99, 102, 241, 0.05)",
];
const LINE_COLOR = "rgba(99, 102, 241, 0.15)";
const AXIS_COLOR = "rgba(99, 102, 241, 0.15)";
const FILL_COLOR = "rgba(99, 102, 241, 0.15)";
const STROKE_COLOR = "#6366F1";
const LABEL_COLOR = "#94A3B8";

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export default function RadarChart({ data, size }: RadarChartProps) {
  if (data.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const margin = 40;
  const radius = (size - margin * 2) / 2;
  const angleStep = 360 / data.length;
  const startAngle = -90;

  const labelRadius = radius + 22;

  const gridPolygons: string[] = [];
  for (let level = 1; level <= LEVELS; level++) {
    const r = (radius / LEVELS) * level;
    const pts: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const angle = startAngle + i * angleStep;
      const p = polarToCartesian(cx, cy, r, angle);
      pts.push(`${p.x},${p.y}`);
    }
    gridPolygons.push(pts.join(" "));
  }

  const axes: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    const angle = startAngle + i * angleStep;
    const end = polarToCartesian(cx, cy, radius, angle);
    axes.push({ x1: cx, y1: cy, x2: end.x, y2: end.y });
  }

  const dataPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    const angle = startAngle + i * angleStep;
    const r = (data[i].value / 100) * radius;
    const p = polarToCartesian(cx, cy, r, angle);
    dataPoints.push(p);
  }
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {gridPolygons.map((points, i) => (
          <Polygon
            key={`grid-${i}`}
            points={points}
            fill={LEVEL_COLORS[i]}
            stroke={LINE_COLOR}
            strokeWidth={1}
          />
        ))}

        {axes.map((axis, i) => (
          <Line
            key={`axis-${i}`}
            x1={axis.x1}
            y1={axis.y1}
            x2={axis.x2}
            y2={axis.y2}
            stroke={AXIS_COLOR}
            strokeWidth={1}
          />
        ))}

        {dataPolygon && (
          <>
            <Polygon
              points={dataPolygon}
              fill={FILL_COLOR}
              stroke={STROKE_COLOR}
              strokeWidth={2}
            />
            {dataPoints.map((p, i) => (
              <Circle
                key={`dot-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={STROKE_COLOR}
              />
            ))}
          </>
        )}

        {data.map((d, i) => {
          const angle = startAngle + i * angleStep;
          const pos = polarToCartesian(cx, cy, labelRadius, angle);
          return (
            <SvgText
              key={`label-${i}`}
              x={pos.x}
              y={pos.y}
              fill={LABEL_COLOR}
              fontSize={11}
              fontWeight="600"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
  },
});
