import { BaseEdge, EdgeText, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

interface ConfigurableEdgeData {
  containment?: boolean;
  derived?: boolean;
  label?: string;
}

export default function ConfigurableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  selected,
}: EdgeProps<ConfigurableEdgeData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
  });

  const isContainment = data?.containment ?? false;
  const isDerived = data?.derived ?? false;
  // Use CSS variable for color scheme awareness
  const color = `var(--edge-configurable${isDerived ? "-derived" : ""}${selected ? "-selected" : ""}, #333)`;
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      <svg style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          {/* Closed diamond marker for start (containment) */}
          {isContainment && (
            <marker
              id="containment-diamond-start"
              markerWidth="20"
              markerHeight="20"
              viewBox="-10 -10 20 20"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
              refX="0"
              refY="0"
            >
              <polygon
                style={{
                  strokeWidth: 1.5,
                  stroke: color,
                  fill: color,
                }}
                points="0,-6 6,0 0,6 -6,0"
              />
            </marker>
          )}

          {/* Open arrow marker for end */}
          <marker
            id="open-arrow-end"
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
                fill: "none",
              }}
              strokeLinecap="round"
              strokeLinejoin="round"
              points="-5,-4 0,0 -5,4"
            />
          </marker>
        </defs>
      </svg>

      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={isContainment ? "url(#containment-diamond-start)" : undefined}
        markerEnd="url(#open-arrow-end)"
        style={{
          stroke: color,
          strokeWidth,
        }}
      />
      <EdgeText x={labelX} y={labelY} label={label} />
    </>
  );
}
