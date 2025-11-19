import { useCallback, useState, useRef } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, applyNodeChanges, applyEdgeChanges, type OnNodesChange, type OnEdgesChange } from '@xyflow/react';
import parseXMI, { exampleEdges, exampleNodes } from '../xmiParser';
import CustomNode from '../flow/CustomNode';
import SupertypeEdge from '../flow/SupertypeEdge';
import ConfigurableEdge from '../flow/ConfigurableEdge';

import "@xyflow/react/dist/style.css";

const nodeTypes = {
	custom: CustomNode
};

const edgeTypes = {
    supertype: SupertypeEdge,
	configurable: ConfigurableEdge,
};

export default function View() {
	const [nodes, setNodes] = useState<any[]>(exampleNodes);
	const [edges, setEdges] = useState<any[]>(exampleEdges);
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

	const onDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			onFile(e.dataTransfer.files[0]);
		}
	}, [onFile]);

	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const onNodesChange : OnNodesChange = useCallback((changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)), []);
    const onEdgesChange : OnEdgesChange = useCallback((changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)), []);

	return (
        <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <input ref={fileInputRef} type="file" accept=".xmi,.xml,.ecore" onChange={onFileChange} style={{ display: "inline-block" }} />
                </label>
                <div style={{ color: "#666" }}>Drop an XMI/XML file onto the canvas or use the file input.</div>
            </div>

            <div onDrop={onDrop} onDragOver={onDragOver} style={{ height: "75vh", border: "1px solid #ddd", borderRadius: 6 }}>
                <ReactFlowProvider>
                    <ReactFlow nodes={nodes} edges={edges} fitView nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} attributionPosition="bottom-left">
                        <Background color="#2f2f2f"/>
                        <Controls />
                    </ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    );
}
