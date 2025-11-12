// Lightweight XMI -> nodes/edges parser
// This is intentionally generic: it extracts elements with an `xmi:id`/`id` and
// creates nodes for them. Attributes that reference other elements (values that
// match existing ids) are converted to edges.
export function parseXMI(xmlText: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const allElems = Array.from(doc.getElementsByTagName('*'));
  const idAttrNames = ['xmi:id', 'id'];

  const elementsById = new Map<string, Element>();
  allElems.forEach((el) => {
    for (const a of idAttrNames) {
      const v = el.getAttribute(a);
      if (v) {
        elementsById.set(v, el);
        break;
      }
    }
  });

  const nodes: any[] = [];
  let idx = 0;
  for (const [id, el] of elementsById) {
    const type = el.getAttribute('xsi:type') || el.tagName;
    const name =
      el.getAttribute('name') || el.getAttribute('label') || el.getAttribute('simpleName') || `${type}`;

    nodes.push({
      id,
      data: { label: `${name} (${type})` },
      position: { x: 50 + (idx % 10) * 180, y: 50 + Math.floor(idx / 10) * 120 },
      style: { width: 180 },
    });
    idx++;
  }

  const edges: any[] = [];
  const idValues = Array.from(elementsById.keys());
  const idSet = new Set(idValues);

  const extractRefs = (val: string | null) => {
    if (!val) return [] as string[];
    return val
      .split(/\s+|,|;/)
      .map((s) => s.trim())
      .filter((s) => s && idSet.has(s));
  };

  elementsById.forEach((el, id) => {
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      const refs = extractRefs(a.value);
      refs.forEach((targetId) => {
        edges.push({ id: `${id}-${targetId}-${a.name}`, source: id, target: targetId, label: a.name });
      });
    }

    const children = Array.from(el.querySelectorAll('*'));
    children.forEach((child) => {
      const ref = child.getAttribute('xmi:idref') || child.getAttribute('href') || child.getAttribute('ref');
      if (ref && idSet.has(ref)) {
        edges.push({ id: `${id}-${ref}-child`, source: id, target: ref });
      }
    });
  });

  return { nodes, edges };
}

export default parseXMI;
