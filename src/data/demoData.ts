import { Person } from '../types/models';

export const demoData: Person[] = [
  {
    id: '1',
    name: 'John Smith',
    gender: 'male',
    parents: [],
    children: ['3'],
    spouses: ['2'],
    birthDate: '1950-05-15',
    deathDate: '',
    notes: 'Family patriarch'
  },
  {
    id: '2',
    name: 'Mary Smith',
    gender: 'female',
    parents: [],
    children: ['3'],
    spouses: ['1'],
    birthDate: '1953-02-28',
    deathDate: '',
    notes: 'Family matriarch'
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    gender: 'female',
    parents: ['1', '2'],
    children: [],
    spouses: [],
    birthDate: '1975-11-10',
    deathDate: '',
    notes: 'Daughter of John and Mary'
  }
];