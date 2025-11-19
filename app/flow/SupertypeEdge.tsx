import { BaseEdge, EdgeText, getBezierPath, type EdgeProps } from "@xyflow/react";

export default function SupertypeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Use CSS variable for color scheme awareness
  const color = selected ? "var(--edge-supertype-selected, #999)" : "var(--edge-supertype, #ccc)";
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      <svg style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <marker
            id="supertype-arrowhead"
            markerWidth="20"
            markerHeight="20"
            viewBox="-10 -10 20 20"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
            refX="0"
            refY="0"
          >
            <polyline
              style={{
                strokeWidth: 1.5,
                stroke: color,
                fill: color,
              }}
              strokeLinecap="round"
              strokeLinejoin="round"
              points="-5,-4 0,0 -5,4 -5,-4"
            />
          </marker>
        </defs>
      </svg>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd="url(#supertype-arrowhead)"
        style={{
          stroke: color,
          strokeWidth,
        }}
      />
      <EdgeText x={labelX} y={labelY} label={label} />
    </>
  );
}
