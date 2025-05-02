// src/types/models.ts
// --- START OF FILE src/types/models.ts ---
export interface Person {
  id: string;
  name: string;
  familyName: string; // Added: Mandatory family name
  nickname?: string;
  gender: 'male' | 'female' | 'other';
  // parents: string[]; // Removed
  // spouses: string[]; // Removed
  padrinhoId?: string; // ID of the Padrinho/Madrinha
  children: string[]; // Represents 'Afilhados'
  birthDate?: string; // Format: YYYY-MM-DD
  deathDate?: string; // Format: YYYY-MM-DD
  imageUrl?: string; // Imgur URL
  notes?: string;
  curso?: string;
  naipeVocal?: string;
  mainInstrument?: string;
  otherInstruments?: string[];
  subidaPalcoDate?: string; // Format: YYYY-MM-DD
  passagemTunoDate?: string; // Format: YYYY-MM-DD
  dataSaidaDaTuna?: string; // Format: YYYY-MM-DD
  hierarquia?: string;
}

// FamilyLink might not be needed anymore if spouses/parents are gone,
// but keeping it doesn't hurt for potential future use.
export interface FamilyLink {
  from: string;
  to: string;
  type: 'parent-child' | 'spouse' | 'padrinho-afilhado'; // Added type
}

export interface TreeData {
  nodes: Person[];
  links: FamilyLink[];
}
// --- END OF FILE src/types/models.ts ---