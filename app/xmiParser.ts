import type { Edge, Node } from "@xyflow/react";
import { EList, EObject, ResourceSet, XMI, type EResource } from "ecore-ts";

export type XMIParseResult = { nodes: Node[]; edges: Edge[] };
function mergeParseResults(acc: XMIParseResult, curr: XMIParseResult): XMIParseResult {
    acc.nodes.push(...curr.nodes);
    acc.edges.push(...curr.edges);
    return acc;
}

function handleStructuralFeature(obj: EObject, classNode: Node): XMIParseResult {
    const result = { nodes: [] as Node[], edges: [] as Edge[] };
    switch (obj.eClass.get("name")) {
        case "EAttribute":
            const attrName = obj.get("name") as string;
            const type = obj.get("eType") as EObject | null;
            let attrType: string;
            if (type === null) {
                const eGenericType = obj.get("eGenericType") as EObject | null;
                const eClassifier = eGenericType?.get("eClassifier") as EObject | null;
                attrType = eClassifier?.get("name") as string;
                if (attrType == null) {
                    throw new Error(`Unable to determine type for attribute ${attrName}`);
                }
            } else {
                attrType = type.get("name") as string;
            }
            classNode.data.attributes[attrName] = attrType;
            break;
        case "EReference":
            const refName = obj.get("name") as string;
            // EClass
            const eReferenceType = obj.get("eType") as EObject;
            const targetName = eReferenceType.get("name") as string;
            const upperBound = Number(obj.get("upperBound"));
            const lowerBound = Number(obj.get("lowerBound"));
            let labelPrefix = "";
            if (!Number.isNaN(upperBound) || !Number.isNaN(lowerBound)) {
                const lower = Number.isNaN(lowerBound) ? 0 : lowerBound;
                const upper = Number.isNaN(upperBound) ? lowerBound : upperBound === -1 ? "*" : upperBound;
                labelPrefix = `[${lower}..${upper}] `;
            }
            const edge: Edge = {
                id: crypto.randomUUID(),
                source: classNode.id,
                target: targetName,
                type: "configurable",
                data: {
                    containment: Boolean(obj.get("containment")),
                },
                label: labelPrefix + refName,
            };
            result.edges.push(edge);
            break;
    }
    return result;
}

function handleELiterals(obj: EObject, enumNode: Node): XMIParseResult {
    const result = { nodes: [] as Node[], edges: [] as Edge[] };
    const name = obj.get("name") as string;
    const value = obj.get("name") ? Number(obj.get("value")) : "auto";
    enumNode.data.attributes[name] = value;
    return result;
}

function handleESuperTypes(obj: EObject, classNode: Node): XMIParseResult {
    const result = { nodes: [] as Node[], edges: [] as Edge[] };
    const targetName = obj.get("name") as string;
    const edge: Edge = {
        id: crypto.randomUUID(),
        source: classNode.id,
        target: targetName,
        type: "supertype",
    };
    result.edges.push(edge);
    return result;
}

function handleEOperations(obj: EObject, classNode: Node): XMIParseResult {
    const result = { nodes: [] as Node[], edges: [] as Edge[] };
    const opName = obj.get("name") as string;
    const eType = obj.get("eType") as EObject | null;
    let opReturnType: string;
    if (eType === null) {
        const eGenericType = obj.get("eGenericType") as EObject | null;
        const eClassifier = eGenericType?.get("eClassifier") as EObject | null;
        opReturnType = eClassifier?.get("name") as string;
    } else {
        opReturnType = eType.get("name") as string;
    }
    opReturnType ??= "void";
    const eParameters = obj.get("eParameters") as EList<EObject> | null;
    let params = "";
    if (eParameters && eParameters.length > 0) {
        params = eParameters
            ?.map((param) => {
                const eType = param.get("eType") as EObject | null;
                let paramType: string;
                if (eType === null) {
                    const eGenericType = param.get("eGenericType") as EObject | null;
                    const eClassifier = eGenericType?.get("eClassifier") as EObject | null;
                    paramType = eClassifier?.get("name") as string;
                    if (paramType == null) {
                        throw new Error(`Unable to determine type for parameter ${param.get("name")} of operation ${opName}`);
                    }
                } else {
                    paramType = eType.get("name") as string;
                }

                return param.get("name") + " " + paramType;
            })
            .reduce((acc, curr) => acc + ", " + curr);
    }
    classNode.data.attributes[`${opName}(${params})`] = " " + opReturnType;
    return result;
}

function handleEClass(obj: EObject): XMIParseResult {
    const node: Node = {
        id: obj.get("name")!,
        type: "custom",
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        data: {
            label: obj.get("name"),
            icon: "🧩",
            attributes: {},
        },
    };
    const abstractFlag = Boolean(obj.get("abstract"));
    if (abstractFlag) {
        node.data.attributes["abstract"] = String(abstractFlag);
    }
    const interfaceFlag = Boolean(obj.get("interface"));
    if (interfaceFlag) {
        node.data.attributes["interface"] = String(interfaceFlag);
    }
    const result = { nodes: [node] as Node[], edges: [] as Edge[] };
    const eStructuralFeatures: EList<EObject> | null = obj.get("eStructuralFeatures");
    const eSuperTypes: EList<EObject> | null = obj.get("eSuperTypes");
    const eOperations: EList<EObject> | null = obj.get("eOperations");
    eStructuralFeatures?.map((feat) => handleStructuralFeature(feat, node)).reduce(mergeParseResults, result);
    eSuperTypes?.map((st) => handleESuperTypes(st, node)).reduce(mergeParseResults, result);
    eOperations?.map((op) => handleEOperations(op, node)).reduce(mergeParseResults, result);
    return result;
}

function handleEEnum(obj: EObject): XMIParseResult {
    const node: Node = {
        id: obj.get("name")!,
        type: "custom",
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        data: {
            label: obj.get("name"),
            icon: "🔢",
            attributes: {},
        },
    };
    const result = { nodes: [node] as Node[], edges: [] as Edge[] };
    const eLiterals: EList<EObject> | null = obj.get("eLiterals");
    eLiterals?.map((lit) => handleELiterals(lit, node)).reduce(mergeParseResults, result);
    return result;
}

function handleEClassifier(obj: EObject): XMIParseResult {
    const result = { nodes: [] as Node[], edges: [] as Edge[] };
    switch (obj.eClass.get("name")) {
        case "EClass":
            return handleEClass(obj);
        case "EEnum":
            return handleEEnum(obj);
    }
    return result;
}

function handleEPackage(obj: EObject): XMIParseResult {
    const result = { nodes: [] as Node[], edges: [] as Edge[] };
    const classifiers: EList<EObject> | null = obj.get("eClassifiers");
    const subPackages: EList<EObject> | null = obj.get("eSubPackages");
    classifiers?.map(handleEClassifier).reduce(mergeParseResults, result);
    subPackages?.map(handleEPackage).reduce(mergeParseResults, result);
    return result;
}

function createNodesAndEdgesFromEObject(obj: EObject): XMIParseResult {
    const result = { nodes: [] as Node[], edges: [] as Edge[] };
    switch (obj.eClass.get("name")) {
        case "EPackage":
            return handleEPackage(obj);
    }
    return result;
}

export function parseXMI(xmlText: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    const allElems = Array.from(doc.getElementsByTagName("*"));

    const resourceSet = ResourceSet.create()!;
    const resource = resourceSet.create({ uri: "resources/cad.ecore" }) as EResource;

    resource.parse(xmlText, XMI as any);
    const contents: EList<EObject> | null = resource.get("contents");
    if (!contents) {
        throw new Error("No contents found in XMI resource");
    }

    const result = contents.map(createNodesAndEdgesFromEObject).reduce(mergeParseResults);
    return result;
}

export default parseXMI;

// Example nodes and edges using the `custom` node type (maps to `CustomNode`) and
// `custom` edge type (maps to `CustomEdge`). These are small samples you can use
// when wiring up React Flow in the app (register your nodeTypes/edgeTypes accordingly).
export const exampleNodes = [
    {
        id: "node-1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
            label: "ecore:EPackage",
            icon: "📦",
            attributes: {
                nsURI: "http://www.eclipse.org/emf/2002/Ecore",
                nsPrefix: "ecore",
            },
        },
    },
    {
        id: "node-2",
        type: "custom",
        position: { x: 420, y: 120 },
        data: {
            label: "ecore:EClass",
            icon: "🧩",
            attributes: {
                name: "EClass",
                abstract: "false",
            },
        },
    },
];

export const exampleEdges = [
    {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        type: "supertype",
        label: "contains",
    },
];
