// src/types/models.ts
export interface Person {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  parents: string[];
  children: string[];
  spouses: string[];
  birthDate?: string; // Keep YYYY-MM-DD format for consistency
  deathDate?: string; // Keep YYYY-MM-DD format
  imageUrl?: string; // Will store Imgur URL
  notes?: string;

  // --- New Fields ---
  curso?: string; // e.g., "Gestão"
  vocalNaipe?: string; // e.g., "Soprano"
  instrumento?: string; // e.g., "Flauta Transversal/Oboé"
  subidaPalcoDate?: string; // Store as YYYY-MM (or YYYY-MM-DD if needed)
  passagemTunoDate?: string; // Store as YYYY-MM (or YYYY-MM-DD)
}

export interface FamilyLink {
  from: string;
  to: string;
  type: 'parent-child' | 'spouse';
}

export interface TreeData {
  nodes: Person[];
  links: FamilyLink[];
}