import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface CustomNodeProps {
  data: {
    label: string;
    icon?: React.ReactNode;
    attributes?: Record<string, string | number | boolean>;
  };
}

export const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const { label, icon, attributes = {} } = data;

  return (
      <div
          style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "12px",
              backgroundColor: "#fff",
              minWidth: "200px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
      >
          {/* Title with icon */}
          <div
              style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#222",
              }}
          >
              {icon && <span>{icon}</span>}
              <span>{label}</span>
          </div>

          {/* Horizontal divider */}
          <div
              style={{
                  borderTop: "1px solid #ddd",
                  marginBottom: "8px",
              }}
          />

          {/* Key-value list */}
          <div
              style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#666",
              }}
          >
              {Object.entries(attributes).length > 0 ? (
                  Object.entries(attributes).map(([key, value]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: "500" }}>{key}:</span>
                          <span>{String(value)}</span>
                      </div>
                  ))
              ) : (
                  <div style={{ color: "#999", fontStyle: "italic" }}>No attributes</div>
              )}
          </div>

          {/* Handles for connections */}
          <Handle type="target" position={Position.Left} />
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Right} />
          <Handle type="source" position={Position.Bottom} />
      </div>
  );
};

export default CustomNode;
