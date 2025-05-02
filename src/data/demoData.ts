// src/data/demoData.ts
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
    name: 'Matias "O Fundador" Alves',
    nickname: "O Fundador",
    gender: 'male',
    padrinhoId: undefined, // No padrinho listed
    children: ['afilhado_1', 'afilhado_2'], // Afilhados
    birthDate: '1970-01-15',
    imageUrl: 'https://i.imgur.com/0lluid3.jpeg',
    notes: 'Um dos membros fundadores da Tuna.',
    curso: 'Engenharia Informática',
    naipeVocal: 'Baixo',
    mainInstrument: 'Guitarra Clássica',
    otherInstruments: ['Cavaquinho'],
    subidaPalcoDate: '1990-10-01', // YYYY-MM-DD
    passagemTunoDate: '1991-05-15',
    dataSaidaDaTuna: '1995-06-30',
    hierarquia: getHierarchyName('cota_veterano'),
  },
  {
    id: 'madrinha_mestra',
    name: 'Sofia "A Eterna" Costa',
    nickname: "A Eterna",
    gender: 'female',
    padrinhoId: undefined,
    children: ['afilhado_3'],
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
    name: 'Ricardo "Ritmo" Lima',
    nickname: 'Ritmo',
    gender: 'male',
    padrinhoId: 'padrinho_mestre', // Matias
    children: ['neto_1'],
    birthDate: '1985-05-10',
    curso: 'Economia',
    naipeVocal: 'Barítono',
    mainInstrument: 'Viola Baixo',
    otherInstruments: ['Percussão'],
    subidaPalcoDate: '2004-04-10',
    passagemTunoDate: '2005-11-25',
    hierarquia: getHierarchyName('veterano'), // Still active maybe
  },
  {
    id: 'afilhado_2',
    name: 'Ana "Melodia" Silva',
    nickname: 'Melodia',
    gender: 'female',
    padrinhoId: 'padrinho_mestre', // Matias
    children: [],
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
    name: 'Cláudia “Mé“ Morais', // Example from user prompt
    nickname: 'Mé',
    gender: 'female',
    padrinhoId: 'madrinha_mestra', // Sofia
    children: ['neto_2'],
    curso: 'Gestão',
    naipeVocal: 'Soprano',
    mainInstrument: 'Flauta Transversal',
    otherInstruments: ['Oboé'],
    subidaPalcoDate: '2014-04-15', // Approximate from 04/2014
    passagemTunoDate: '2016-07-15', // Approximate from 07/2016
    hierarquia: getHierarchyName('veterano'), // Active Veterano
  },

  // Third Generation (Netos)
  {
      id: 'neto_1',
      name: 'Diogo "Dedos" Ferreira',
      nickname: 'Dedos',
      gender: 'male',
      padrinhoId: 'afilhado_1', // Ricardo
      children: [], // No afilhados yet
      birthDate: '1998-08-20',
      curso: 'Ciência de Computadores',
      naipeVocal: 'Tenor',
      mainInstrument: 'Bandolim',
      otherInstruments: ['Guitarra Clássica'],
      subidaPalcoDate: '2018-05-01',
      passagemTunoDate: '2019-11-11',
      hierarquia: getHierarchyName('tuno'), // Less than 2 years as Tuno
  },
   {
      id: 'neto_2',
      name: 'Mariana "Voz" Pinto',
      nickname: 'Voz',
      gender: 'female',
      padrinhoId: 'afilhado_3', // Cláudia
      children: [],
      birthDate: '2000-02-05',
      curso: 'Psicologia',
      naipeVocal: 'Mezzo-Soprano',
      mainInstrument: 'Voz', // Can list 'Voz' as instrument
      otherInstruments: [],
      subidaPalcoDate: '2020-03-10',
      passagemTunoDate: undefined, // Still Caloira
      hierarquia: getHierarchyName('caloiro'),
  },
   {
      id: 'projetuno_1',
      name: 'Luís Novato',
      nickname: undefined,
      gender: 'male',
      padrinhoId: 'neto_1', // Diogo is padrinho
      children: [],
      birthDate: '2003-01-01',
      curso: 'Engenharia Civil',
      naipeVocal: undefined,
      mainInstrument: undefined,
      otherInstruments: [],
      subidaPalcoDate: undefined, // Not yet
      passagemTunoDate: undefined,
      hierarquia: getHierarchyName('projetuno'),
  },
];

// Simple validation to ensure all demo items have necessary array fields
demoData.forEach(p => {
    if (!p.children) p.children = [];
    if (!p.otherInstruments) p.otherInstruments = [];
    // Add defaults for other potentially missing optional fields if needed
     if (!p.hierarquia) p.hierarquia = getHierarchyName('projetuno'); // Default hierarchy
});