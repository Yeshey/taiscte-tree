import { Person } from '../types/models';

export const demoData: Person[] = [
    {
      id: '1',
      name: 'João da Silva', // Portuguese names
      gender: 'male',
      parents: [],
      children: ['3'],
      spouses: ['2'],
      birthDate: '1950-05-15',
      deathDate: '',
      // imageUrl property is omitted (implies undefined)
      notes: 'Fundador'
    },
    {
      id: '2',
      name: 'Maria Pereira',
      gender: 'female',
      parents: [],
      children: ['3'],
      spouses: ['1'],
      birthDate: '1953-02-28',
      deathDate: '',
       // imageUrl property is omitted (implies undefined)
      notes: 'Matriarca'
    },
     {
      id: '3',
      name: 'Ana Silva',
      gender: 'female',
      parents: ['1', '2'],
      children: [],
      spouses: [],
      birthDate: '1975-11-10',
      deathDate: '',
      imageUrl: 'https://via.placeholder.com/50', // Example actual image URL for testing
      notes: 'Filha do João e Maria'
    }
  ];