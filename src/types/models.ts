// src/types/models.ts
export interface Person {
  id: string;
  name: string;
  familyName: string;
  nickname?: string;
  gender: 'male' | 'female' | 'other';
  parentId?: string; // Renamed from padrinhoId
  // children: string[]; // REMOVED
  birthDate?: string;
  deathDate?: string;
  imageUrl?: string;
  notes?: string;
  curso?: string;
  naipeVocal?: string;
  mainInstrument?: string;
  otherInstruments?: string[];
  subidaPalcoDate?: string;
  passagemTunoDate?: string;
  dataSaidaDaTuna?: string;
  hierarquia?: string;
}

// FamilyLink is likely no longer needed for tree structure
// export interface FamilyLink { ... }

// TreeData might not be needed if the input is just Person[]
// export interface TreeData { ... }