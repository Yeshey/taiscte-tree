import { Person } from '../types/models';

interface TreeNode {
  name: string;
  attributes: {
    id: string;
    name: string;
    gender: string;
    birthDate?: string;
    deathDate?: string;
    imageUrl?: string;
    notes?: string;
  };
  children?: TreeNode[];
}

// Find root nodes (people with no parents in the dataset)
const findRootNodes = (people: Person[]): Person[] => {
  return people.filter(person => person.parents.length === 0);
};

// Build tree recursively from root nodes
const buildTree = (person: Person, allPeople: Person[]): TreeNode => {
    const children = allPeople.filter(p =>
      p.parents.length > 0 && p.parents[0] === person.id 
    );
  
    const treeNode: TreeNode = {
      name: person.name,
      attributes: {
        id: person.id,
        name: person.name,
        gender: person.gender,
        birthDate: person.birthDate,
        deathDate: person.deathDate,
        imageUrl: person.imageUrl,
        notes: person.notes
      }
    };
  
    // Add children nodes if any (recursively)
    if (children.length > 0) {
      treeNode.children = children.map(child => buildTree(child, allPeople));
    }
  
    return treeNode;
  };

// Transform our data structure to the format expected by react-d3-tree
export const transformDataForTree = (people: Person[]): TreeNode => {
  if (people.length === 0) {
    return { name: 'No Data', attributes: { id: '', name: 'No Data', gender: '' } };
  }
  
  const rootNodes = findRootNodes(people);
  
  if (rootNodes.length === 0) {
    // If no proper root, use the first person
    return buildTree(people[0], people);
  }
  
  // If multiple roots, create a fake root to hold them all
  if (rootNodes.length > 1) {
    return {
      name: 'Family',
      attributes: { id: 'root', name: 'Family Tree', gender: '' },
      children: rootNodes.map(root => buildTree(root, people))
    };
  }
  
  // Just one root
  return buildTree(rootNodes[0], people);
};

// Helper function to find a person by ID
export const findPersonById = (id: string, people: Person[]): Person | undefined => {
  return people.find(person => person.id === id);
};

// Get all descendants of a person
export const getDescendants = (person: Person, allPeople: Person[]): Person[] => {
  const descendants: Person[] = [];
  
  // Find direct children
  const children = allPeople.filter(p => p.parents.includes(person.id));
  descendants.push(...children);
  
  // Find their descendants recursively
  for (const child of children) {
    descendants.push(...getDescendants(child, allPeople));
  }
  
  return descendants;
};

// Get all ancestors of a person
export const getAncestors = (person: Person, allPeople: Person[]): Person[] => {
  const ancestors: Person[] = [];
  const parentIds = person.parents;
  
  const parents = allPeople.filter(p => parentIds.includes(p.id));
  ancestors.push(...parents);
  
  for (const parent of parents) {
    ancestors.push(...getAncestors(parent, allPeople));
  }
  
  return ancestors;
};