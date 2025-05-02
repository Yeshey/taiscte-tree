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

// New interface for Invite Tokens
export interface InviteToken {
    id: string; // The token itself (UUID)
    status: 'unused' | 'used';
    creatorUid: string; // UID of the user who created the invite
    usedByEmail?: string; // Email of the user who used the invite
    // createdAt?: number; // Optional: Timestamp
    // expiresAt?: number; // Optional: Expiration timestamp
}


// FamilyLink is likely no longer needed for tree structure
// export interface FamilyLink { ... }

// TreeData might not be needed if the input is just Person[]
// export interface TreeData { ... }