// src/utils/treeHelpers.ts
// We keep this file for potential future generic helpers,
// but the main tree transformation logic for the Tuna structure
// is now within GenealogyTree.tsx for simplicity with Padrinho logic.

import { Person } from '../types/models';

// Helper function to find a person by ID (still useful)
export const findPersonById = (id: string, people: Person[]): Person | undefined => {
  return people.find(person => person.id === id);
};

// Get 'Afilhados' (direct children in the new structure)
export const getAfilhados = (person: Person, allPeople: Person[]): Person[] => {
    if (!person?.id) return [];
    return allPeople.filter(p => p.padrinhoId === person.id);
};

// Get 'Padrinho' (direct parent in the new structure)
export const getPadrinho = (person: Person, allPeople: Person[]): Person | undefined => {
    if (!person?.padrinhoId) return undefined;
    return findPersonById(person.padrinhoId, allPeople);
};

// Get all descendants ('Afilhado' lineage)
export const getDescendants = (person: Person, allPeople: Person[]): Person[] => {
  if (!person?.id) return [];
  const descendants: Person[] = [];
  const directAfilhados = getAfilhados(person, allPeople);
  descendants.push(...directAfilhados);

  for (const afilhado of directAfilhados) {
    descendants.push(...getDescendants(afilhado, allPeople));
  }
  return descendants;
};

// Get all ancestors ('Padrinho' lineage)
export const getAncestors = (person: Person, allPeople: Person[]): Person[] => {
   if (!person?.padrinhoId) return [];
   const ancestors: Person[] = [];
   const padrinho = getPadrinho(person, allPeople);

   if (padrinho) {
       ancestors.push(padrinho);
       ancestors.push(...getAncestors(padrinho, allPeople));
   }
   return ancestors;
};

// NOTE: transformDataForTree based on 'parents' is removed.
// The Tuna-specific transformation happens inside GenealogyTree.tsx's useMemo.