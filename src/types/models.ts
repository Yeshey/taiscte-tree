export interface Person {
    id: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    parents: string[];
    children: string[];
    spouses: string[];
    birthDate?: string;
    deathDate?: string;
    imageUrl?: string;
    notes?: string;
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