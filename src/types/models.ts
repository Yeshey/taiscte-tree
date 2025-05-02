// src/types/models.ts

export interface Person {
  id: string;
  name: string;
  nickname?: string; // Added Nickname
  gender: 'male' | 'female' | 'other';
  // parents: string[]; // Removed
  // spouses: string[]; // Removed
  padrinhoId?: string; // Added - ID of the Padrinho/Madrinha
  children: string[]; // Kept - Represents 'Afilhados' in this context
  birthDate?: string; // Format: YYYY-MM-DD
  deathDate?: string; // Format: YYYY-MM-DD
  imageUrl?: string; // Imgur URL
  notes?: string;
  curso?: string;
  naipeVocal?: string; // Renamed from vocalNaipe
  mainInstrument?: string; // Renamed from instrumento
  otherInstruments?: string[]; // Added for multiple instruments
  subidaPalcoDate?: string; // Format: YYYY-MM-DD
  passagemTunoDate?: string; // Format: YYYY-MM-DD
  dataSaidaDaTuna?: string; // Added - Format: YYYY-MM-DD
  hierarquia?: string; // Added - Stores the current name/key
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