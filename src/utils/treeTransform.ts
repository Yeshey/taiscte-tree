// src/utils/treeTransform.ts
import { Person } from '../types/models';
import TaiscteLogo from '../assets/TAISCTE_logo.png'; // Need logo for artificial root

// TreeNode definition needs to be accessible here too or imported from a shared types file
export interface TreeNode {
    name: string;
    attributes: Partial<Person> & { id: string; name: string; gender: string; familyName?: string };
    children?: TreeNode[];
    __rd3t?: {
      id: string;
      depth: number;
      collapsed: boolean;
    };
    _children?: TreeNode[];
}

// --- HSL Color Generation Logic ---
export function generateHslColor(hue: number): string {
  const saturation = 75; // Fixed saturation
  const lightness = 60; // Fixed lightness
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// --- Tree Transformation Logic ---
export const buildTunaTree = (personId: string | null, peopleMap: Map<string, Person>, processedIds: Set<string>): TreeNode | null => {
    const person = personId ? peopleMap.get(personId) : null;
    if (!person || processedIds.has(person.id)) return null;

    processedIds.add(person.id);

    const treeNode: TreeNode = {
        name: person.name,
        attributes: {
            ...(person as any), // Spread all attributes
            id: person.id,
            name: person.name,
            gender: person.gender,
            familyName: person.familyName // Include familyName in attributes
        },
        children: []
    };

    const afilhados: TreeNode[] = [];
    peopleMap.forEach(potentialAfilhado => {
        // Check padrinhoId exists and is not the person themselves (prevent self-reference loop)
        if (potentialAfilhado.padrinhoId && potentialAfilhado.padrinhoId === person.id && potentialAfilhado.id !== person.id) {
            const childNode = buildTunaTree(potentialAfilhado.id, peopleMap, processedIds);
            if (childNode) { afilhados.push(childNode); }
        }
    });

    if (afilhados.length > 0) { treeNode.children = afilhados; }
    return treeNode;
};

export const transformTunaDataForTree = (people: Person[]): TreeNode => {
    if (!people || people.length === 0) {
         return { name: 'No Data', attributes: { id: 'no_data', name: 'No Data', gender: 'other' } };
    }
    const peopleMap = new Map(people.map(p => [p.id, p]));
    const processedIds = new Set<string>();
    const rootPeople = people.filter(p => !p.padrinhoId || !peopleMap.has(p.padrinhoId));

    if (rootPeople.length === 0 && people.length > 0) {
        console.warn("No clear root nodes found. Creating artificial root.");
        const allNodes = people
            .map(p => buildTunaTree(p.id, peopleMap, new Set())) // Use new Set for each top-level build attempt
            .filter(node => node !== null) as TreeNode[];
        return { name: 'TAISCTE', attributes: { id: 'artificial_root', name: 'TAISCTE', gender: 'other',  imageUrl: TaiscteLogo }, children: allNodes };
    } else if (rootPeople.length === 1) {
        // If single root, build the tree starting from them
        return buildTunaTree(rootPeople[0].id, peopleMap, processedIds) || { name: 'Error', attributes: { id: 'error', name: 'Error generating tree', gender: 'other' } };
    } else {
         // If multiple roots, create an artificial root above them
         return { name: 'TAISCTE', attributes: { id: 'root', name: 'TAISCTE', gender: 'other', imageUrl: TaiscteLogo }, children: rootPeople.map(root => buildTunaTree(root.id, peopleMap, processedIds)).filter(node => node !== null) as TreeNode[] };
    }
};