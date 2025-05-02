// src/utils/treeTransform.ts
import { Person } from '../types/models';
import TaiscteLogo from '../assets/TAISCTE_logo.png';

// TreeNode definition - Children array is still needed for react-d3-tree
export interface TreeNode {
    name: string;
    // Keep attributes similar, ensure parentId is there if needed for debugging
    attributes: Partial<Person> & { id: string; name: string; gender: string; familyName?: string; parentId?: string };
    children?: TreeNode[]; // This array is BUILT during transformation
    // Internal properties added by react-d3-tree
    __rd3t?: {
      id: string;
      depth: number;
      collapsed: boolean;
    };
    _children?: TreeNode[];
}

// Color generation function (no change)
export function generateHslColor(hue: number): string {
  const saturation = 75;
  const lightness = 60;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// --- Tree Transformation Logic - REWRITTEN ---

export const transformTunaDataForTree = (people: Person[]): TreeNode => {
    if (!people || people.length === 0) {
         return { name: 'No Data', attributes: { id: 'no_data', name: 'No Data', gender: 'other' } };
    }

    const peopleMap = new Map(people.map(p => [p.id, p]));
    const nodesMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // 1. Create a TreeNode for each person and store it in a map
    people.forEach(person => {
        const treeNode: TreeNode = {
            name: person.name,
            attributes: {
                ...(person as any), // Spread all person data into attributes
                id: person.id,
                name: person.name,
                gender: person.gender,
                familyName: person.familyName,
                parentId: person.parentId // Keep parentId in attributes if helpful
            },
            children: [] // Initialize children array - this will be populated
        };
        nodesMap.set(person.id, treeNode);
    });

    // 2. Link nodes based on parentId
    nodesMap.forEach(node => {
        const parentId = node.attributes.parentId;
        if (parentId) {
            const parentNode = nodesMap.get(parentId);
            if (parentNode) {
                // Ensure parentNode.children exists (it should due to initialization)
                parentNode.children = parentNode.children || [];
                parentNode.children.push(node); // Add current node as a child of its parent
            } else {
                // Parent mentioned but not found in the data - treat as a root node
                console.warn(`Person ${node.name} (ID: ${node.attributes.id}) has parentId ${parentId}, but parent node not found. Treating as root.`);
                rootNodes.push(node);
            }
        } else {
            // No parentId means it's a root node
            rootNodes.push(node);
        }
    });

    // 3. Determine final structure (single root or artificial root)
    if (rootNodes.length === 0 && nodesMap.size > 0) {
        // Should not happen if data is consistent, but handle cyclic data case
        console.error("Circular dependency detected or no root nodes found! Returning all nodes under artificial root.");
        return { name: 'TAISCTE (Error)', attributes: { id: 'error_root', name: 'TAISCTE (Error)', gender: 'other', imageUrl: TaiscteLogo }, children: Array.from(nodesMap.values()) };
    } else if (rootNodes.length === 1) {
        // Single root node - this is the tree
        return rootNodes[0];
    } else {
        // Multiple root nodes - create an artificial root
        console.log(`Found ${rootNodes.length} root nodes. Creating artificial TAISCTE root.`);
        return { name: 'TAISCTE', attributes: { id: 'root', name: 'TAISCTE', gender: 'other', imageUrl: TaiscteLogo }, children: rootNodes };
    }
};

// buildTunaTree function is no longer needed with this approach
// export const buildTunaTree = (...) => { ... };