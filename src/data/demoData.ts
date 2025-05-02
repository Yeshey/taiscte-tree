// src/data/demoData.ts
// --- START OF FILE src/data/demoData.ts ---
import { Person } from '../types/models';
import * as AppStrings from '../constants/strings'; // Use constants for hierarchy

// Helper to get default hierarchy names
const getHierarchyName = (key: typeof AppStrings.HIERARCHIA_BASE_LEVELS[number]['key']): string => {
    return AppStrings.HIERARCHIA_BASE_LEVELS.find(level => level.key === key)?.defaultName || key;
};

export const demoData: Person[] = [
  // Founding Members / Early Generation (No Padrinhos in this set)
  {
    id: 'padrinho_mestre',
    name: 'Matias Alves',
    familyName: 'Alves', // Added Family Name
    nickname: "O Fundador",
    gender: 'male',
    padrinhoId: undefined, // Correct: No padrinho listed
    children: ['afilhado_1', 'afilhado_2'], // Afilhados IDs
    birthDate: '1970-01-15',
    imageUrl: 'https://i.imgur.com/0lluid3.jpeg',
    notes: 'Um dos membros fundadores da Tuna.',
    curso: 'Engenharia Informática',
    naipeVocal: 'Baixo',
    mainInstrument: 'Guitarra Clássica',
    otherInstruments: ['Cavaquinho'],
    subidaPalcoDate: '1990-10-01',
    passagemTunoDate: '1991-05-15',
    dataSaidaDaTuna: '1995-06-30',
    hierarquia: getHierarchyName('cota_veterano'),
  },
  {
    id: 'madrinha_mestra',
    name: 'Sofia Costa',
    familyName: 'Costa', // Added Family Name
    nickname: "Eterna",
    gender: 'female',
    padrinhoId: undefined, // Correct: No padrinho listed
    children: ['afilhado_3'], // Afilhados IDs
    birthDate: '1972-03-22',
    notes: 'Sempre presente, uma referência.',
    curso: 'Gestão',
    naipeVocal: 'Contralto',
    mainInstrument: 'Acordeão',
    otherInstruments: [],
    subidaPalcoDate: '1991-03-01',
    passagemTunoDate: '1992-09-20',
    hierarquia: getHierarchyName('cota_veterano'),
  },

  // Second Generation (Afilhados of Founders)
  {
    id: 'afilhado_1',
    name: 'Ricardo Lima',
    familyName: 'Lima', // Added Family Name
    nickname: 'Ritmo',
    gender: 'male',
    padrinhoId: 'padrinho_mestre', // Correct: Padrinho is Matias
    children: ['neto_1'], // Afilhados IDs
    birthDate: '1985-05-10',
    curso: 'Economia',
    naipeVocal: 'Barítono',
    mainInstrument: 'Viola Baixo',
    otherInstruments: ['Percussão'],
    subidaPalcoDate: '2004-04-10',
    passagemTunoDate: '2005-11-25',
    hierarquia: getHierarchyName('veterano'),
  },
  {
    id: 'afilhado_2',
    name: 'Ana Silva',
    familyName: 'Silva', // Added Family Name
    nickname: 'Melodia',
    gender: 'female',
    padrinhoId: 'padrinho_mestre', // Correct: Padrinho is Matias
    children: [], // Afilhados IDs
    birthDate: '1986-11-12',
    curso: 'Marketing',
    naipeVocal: 'Soprano',
    mainInstrument: 'Flauta Transversal',
    otherInstruments: [],
    subidaPalcoDate: '2005-04-15',
    passagemTunoDate: '2006-10-01',
    dataSaidaDaTuna: '2010-07-01',
    hierarquia: getHierarchyName('cota_veterano'),
  },
   {
    id: 'afilhado_3',
    name: 'Cláudia Morais',
    familyName: 'Morais', // Added Family Name
    nickname: 'Mé',
    gender: 'female',
    padrinhoId: 'madrinha_mestra', // Correct: Madrinha is Sofia
    children: ['neto_2'], // Afilhados IDs
    curso: 'Gestão',
    naipeVocal: 'Soprano',
    mainInstrument: 'Flauta Transversal',
    otherInstruments: ['Oboé'],
    subidaPalcoDate: '2014-04-15',
    passagemTunoDate: '2016-07-15',
    hierarquia: getHierarchyName('veterano'),
  },

  // Third Generation (Netos)
  {
      id: 'neto_1',
      name: 'Diogo Ferreira',
      familyName: 'Ferreira', // Added Family Name
      nickname: 'Dedos',
      gender: 'male',
      padrinhoId: 'afilhado_1', // Correct: Padrinho is Ricardo
      children: ['projetuno_1'], // Afilhados IDs
      birthDate: '1998-08-20',
      curso: 'Ciência de Computadores',
      naipeVocal: 'Tenor',
      mainInstrument: 'Bandolim',
      otherInstruments: ['Guitarra Clássica'],
      subidaPalcoDate: '2018-05-01',
      passagemTunoDate: '2019-11-11',
      hierarquia: getHierarchyName('tuno'),
  },
   {
      id: 'neto_2',
      name: 'Mariana Pinto',
      familyName: 'Pinto', // Added Family Name
      nickname: 'Voz',
      gender: 'female',
      padrinhoId: 'afilhado_3', // Correct: Madrinha is Cláudia
      children: [], // Afilhados IDs
      birthDate: '2000-02-05',
      curso: 'Psicologia',
      naipeVocal: 'Mezzo-Soprano',
      mainInstrument: 'Voz',
      otherInstruments: [],
      subidaPalcoDate: '2020-03-10',
      passagemTunoDate: undefined,
      hierarquia: getHierarchyName('caloiro'),
  },
   {
      id: 'projetuno_1',
      name: 'Luís Novato',
      familyName: 'Novato', // Added Family Name
      nickname: undefined,
      gender: 'male',
      padrinhoId: 'neto_1', // Correct: Padrinho is Diogo
      children: [], // Afilhados IDs
      birthDate: '2003-01-01',
      curso: 'Engenharia Civil',
      naipeVocal: undefined,
      mainInstrument: undefined,
      otherInstruments: [],
      subidaPalcoDate: undefined,
      passagemTunoDate: undefined,
      hierarquia: getHierarchyName('projetuno'),
  },
];

// Simple validation/default setting loop
demoData.forEach(p => {
    if (!p.children) p.children = [];
    if (!p.otherInstruments) p.otherInstruments = [];
    if (!p.hierarquia) p.hierarquia = getHierarchyName('projetuno');
    if (!p.familyName) p.familyName = "Unknown"; // Should not happen with above data, but good fallback
});
// --- END OF FILE src/data/demoData.ts ---