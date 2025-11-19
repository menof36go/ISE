import { initialNodes, initialEdges } from "./initialElements.js";
import ELK from "elkjs/lib/elk.bundled.js";
import React, { useCallback, useLayoutEffect, useRef } from "react";
import { Background, ReactFlow, ReactFlowProvider, addEdge, Panel, useNodesState, useEdgesState, useReactFlow } from "@xyflow/react";
import parseXMI from "../xmiParser";
import CustomNode from "../flow/CustomNode";
import SupertypeEdge from "../flow/SupertypeEdge";
import ConfigurableEdge from "../flow/ConfigurableEdge";


import "@xyflow/react/dist/style.css";

const elk = new ELK();

// Elk has a *huge* amount of options to configure. To see everything you can
// tweak check out:
//
// - https://www.eclipse.org/elk/reference/algorithms.html
// - https://www.eclipse.org/elk/reference/options.html
const elkOptions = {
    "elk.algorithm": "layered",
    "elk.layered.spacing.nodeNodeBetweenLayers": "150",
    "elk.spacing.nodeNode": "120",
};

const nodeTypes = {
    custom: CustomNode
};

const edgeTypes = {
    supertype: SupertypeEdge,
    configurable: ConfigurableEdge,
};

const getLayoutedElements = (nodes, edges, options = {}) => {
    const isHorizontal = options?.["elk.direction"] === "RIGHT";
    const graph = {
        id: "root",
        layoutOptions: options,
        children: nodes.map((node) => ({
            ...node,
            // Adjust the target and source handle positions based on the layout
            // direction.
            targetPosition: isHorizontal ? "left" : "top",
            sourcePosition: isHorizontal ? "right" : "bottom",

            // Hardcode a width and height for elk to use when layouting.
            width: node?.measured?.width ?? 150,
            height: node?.measured?.height ?? 50,
        })),
        edges: edges,
    };

    return elk
        .layout(graph)
        .then((layoutedGraph) => ({
            nodes: layoutedGraph.children.map((node) => ({
                ...node,
                // React Flow expects a position property on the node instead of `x`
                // and `y` fields.
                position: { x: node.x, y: node.y },
            })),

            edges: layoutedGraph.edges,
        }))
        .catch(console.error);
};

function LayoutFlow({ nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange }) {
    const { fitView } = useReactFlow();

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    const onLayout = useCallback(
        ({ direction, useInitialNodes = false }) => {
            const opts = { "elk.direction": direction, ...elkOptions };
            const ns = useInitialNodes ? initialNodes : nodes;
            const es = useInitialNodes ? initialEdges : edges;

            getLayoutedElements(ns, es, opts).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
                fitView();
            });
        },
        [nodes, edges]
    );

    // Calculate the initial layout on mount.
    useLayoutEffect(() => {
        onLayout({ direction: "DOWN", useInitialNodes: false });
    }, []);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
        >
            <Panel position="top-right">
                <button className="xy-theme__button" onClick={() => onLayout({ direction: "DOWN" })}>
                    vertical layout
                </button>

                <button className="xy-theme__button" onClick={() => onLayout({ direction: "RIGHT" })}>
                    horizontal layout
                </button>
            </Panel>
            <Background />
        </ReactFlow>
    );
}

export default function Elk() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const onFile = useCallback((file: File) => {
            const reader = new FileReader();
            reader.onload = () => {
                const txt = String(reader.result || '');
                try {
                    const { nodes: parsedNodes, edges: parsedEdges } = parseXMI(txt);
                    setNodes(parsedNodes);
                    setEdges(parsedEdges);
                } catch (err) {
                    console.error('Error parsing XMI', err);
                    alert('Failed to parse XMI file. See console for details.');
                }
            };
            reader.readAsText(file);
        }, []);

    const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0];
        if (f) onFile(f);
    }, [onFile]);

    return (
        <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <input ref={fileInputRef} type="file" accept=".xmi,.xml,.ecore" onChange={onFileChange} style={{ display: "inline-block" }} />
                </label>
                <div style={{ color: "#666" }}>Drop an XMI/XML file onto the canvas or use the file input.</div>
            </div>
            <div style={{ height: "75vh", border: "1px solid #ddd", borderRadius: 6 }}>
                <ReactFlowProvider>
                    <LayoutFlow
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                    />
                </ReactFlowProvider>
            </div>
        </div>
    );
}
