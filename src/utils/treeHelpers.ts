// src/utils/treeHelpers.ts
import { Person } from '../types/models';

// Helper function to find a person by ID (no change needed)
export const findPersonById = (id: string, people: Person[]): Person | undefined => {
  return people.find(person => person.id === id);
};

// Renamed and updated to use parentId
export const getChildren = (person: Person, allPeople: Person[]): Person[] => {
    if (!person?.id) return [];
    // Find people whose parentId matches the current person's id
    return allPeople.filter(p => p.parentId === person.id);
};

// Renamed and updated to use parentId
export const getParent = (person: Person, allPeople: Person[]): Person | undefined => {
    // Use parentId
    if (!person?.parentId) return undefined;
    return findPersonById(person.parentId, allPeople);
};

// Updated to use renamed helpers and parentId
export const getDescendants = (person: Person, allPeople: Person[]): Person[] => {
  if (!person?.id) return [];
  const descendants: Person[] = [];
  // Use getChildren
  const directChildren = getChildren(person, allPeople);
  descendants.push(...directChildren);

  for (const child of directChildren) {
    // Recursive call remains the same conceptually
    descendants.push(...getDescendants(child, allPeople));
  }
  return descendants;
};

// Updated to use renamed helpers and parentId
export const getAncestors = (person: Person, allPeople: Person[]): Person[] => {
   // Use parentId
   if (!person?.parentId) return [];
   const ancestors: Person[] = [];
   // Use getParent
   const parent = getParent(person, allPeople);

   if (parent) {
       ancestors.push(parent);
       // Recursive call remains the same conceptually
       ancestors.push(...getAncestors(parent, allPeople));
   }
   return ancestors;
};

// NOTE: transformDataForTree based on 'parents' is removed.
// The Tuna-specific transformation happens inside GenealogyTree.tsx's useMemo. // This comment is now outdated as transformation is in treeTransform.ts