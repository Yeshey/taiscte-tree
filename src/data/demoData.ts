// src/data/demoData.ts
import { Person } from '../types/models';
import * as AppStrings from '../constants/strings';

const getHierarchyName = (key: typeof AppStrings.HIERARCHIA_BASE_LEVELS[number]['key']): string => {
    return AppStrings.HIERARCHIA_BASE_LEVELS.find(level => level.key === key)?.defaultName || key;
};

export const demoData: Person[] = [
  // Founding Members / Early Generation (No parentId)
  {
    id: 'padrinho_mestre',
    name: 'Matias Alves',
    familyName: 'Alves',
    nickname: "O Fundador",
    gender: 'male',
    parentId: undefined, // No parent
    // children: ['afilhado_1', 'afilhado_2'], // REMOVED
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
    familyName: 'Costa',
    nickname: "Eterna",
    gender: 'female',
    parentId: undefined, // No parent
    // children: ['afilhado_3'], // REMOVED
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

  // Second Generation (Children of Founders)
  {
    id: 'afilhado_1',
    name: 'Ricardo Lima',
    familyName: 'Lima',
    nickname: 'Ritmo',
    gender: 'male',
    parentId: 'padrinho_mestre', // Parent is Matias
    // children: ['neto_1'], // REMOVED
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
    familyName: 'Silva',
    nickname: 'Melodia',
    gender: 'female',
    parentId: 'padrinho_mestre', // Parent is Matias
    // children: [], // REMOVED
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
    familyName: 'Morais',
    nickname: 'Mé',
    gender: 'female',
    parentId: 'madrinha_mestra', // Parent is Sofia
    // children: ['neto_2'], // REMOVED
    curso: 'Gestão',
    naipeVocal: 'Soprano',
    mainInstrument: 'Flauta Transversal',
    otherInstruments: ['Oboé'],
    subidaPalcoDate: '2014-04-15',
    passagemTunoDate: '2016-07-15',
    hierarquia: getHierarchyName('veterano'),
  },

  // Third Generation (Grandchildren)
  {
      id: 'neto_1',
      name: 'Diogo Ferreira',
      familyName: 'Ferreira',
      nickname: 'Dedos',
      gender: 'male',
      parentId: 'afilhado_1', // Parent is Ricardo
      // children: ['projetuno_1'], // REMOVED
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
      familyName: 'Pinto',
      nickname: 'Voz',
      gender: 'female',
      parentId: 'afilhado_3', // Parent is Cláudia
      // children: [], // REMOVED
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
      familyName: 'Novato',
      nickname: undefined,
      gender: 'male',
      parentId: 'neto_1', // Parent is Diogo
      // children: [], // REMOVED
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

// Default setting loop (no change needed for children removal)
demoData.forEach(p => {
    if (!p.otherInstruments) p.otherInstruments = [];
    if (!p.hierarquia) p.hierarquia = getHierarchyName('projetuno');
    if (!p.familyName) p.familyName = "Unknown";
});