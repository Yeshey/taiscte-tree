// src/utils/treeTransform.ts
import { Person } from '../types/models';
import TaiscteLogo from '../assets/TAISCTE_logo.png';

// TreeNode definition - Children array is still needed for react-d3-tree
export interface TreeNode {
    name: string;
    // Keep attributes similar, ensure parentId is there if needed for debugging
    attributes: Partial<Person> & { id: string; name: string; gender: string; familyName?: string; parentId?: string; imageUrl?: string }; // Added imageUrl to attributes type
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

// --- Tree Transformation Logic - MODIFIED ---

export const transformTunaDataForTree = (people: Person[]): TreeNode => {
    // Create the artificial root first. It will always be returned.
    const artificialRoot: TreeNode = {
        name: 'TAISCTE',
        attributes: { id: 'root', name: 'TAISCTE', gender: 'other', imageUrl: TaiscteLogo },
        children: [], // Initialize children, will be populated
    };

    // Handle empty or invalid input data gracefully
    if (!people || people.length === 0) {
        console.log("No person data provided, returning only the artificial root.");
        return artificialRoot;
    }

    const peopleMap = new Map(people.map(p => [p.id, p]));
    const nodesMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = []; // Nodes from data that don't have a parentId

    // 1. Create a TreeNode for each person and store it in a map
    people.forEach(person => {
        // Basic check for essential fields to avoid errors later
        if (!person.id || !person.name || !person.gender) {
            console.warn(`Skipping person with missing essential data: ${JSON.stringify(person)}`);
            return;
        }
        const treeNode: TreeNode = {
            name: person.name,
            attributes: {
                ...(person as any), // Spread all person data into attributes
                id: person.id,
                name: person.name,
                gender: person.gender,
                familyName: person.familyName,
                parentId: person.parentId, // Keep parentId in attributes if helpful
                imageUrl: person.imageUrl // Ensure imageUrl is included
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
            // No parentId means it's a root node relative to the data
            rootNodes.push(node);
        }
    });

    // 3. Attach all identified root nodes from the data to the artificial root's children
    artificialRoot.children = rootNodes;

    // 4. Always return the artificial root
    if (rootNodes.length === 0 && nodesMap.size > 0) {
        // This might indicate an issue like circular dependencies if nodes exist but none are roots.
        // Still return the artificial root, but maybe log a more specific error.
        console.error("No root nodes found in the provided data, but nodes exist. Check for circular dependencies or data issues. Attaching all nodes under artificial root.");
        artificialRoot.children = Array.from(nodesMap.values()); // Attach all nodes as a fallback
    } else if (rootNodes.length > 1) {
         console.log(`Found ${rootNodes.length} root members. Displaying under main TAISCTE node.`);
    } else if (rootNodes.length === 1) {
         console.log(`Found single root member. Displaying under main TAISCTE node.`);
    } // Case of 0 rootNodes and 0 nodesMap size is handled by the initial empty check.


    return artificialRoot;
};