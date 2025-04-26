import React from 'react';

interface NodeProps {
  person: {
    name: string;
    gender: string;
    birthDate?: string;
    deathDate?: string;
    imageUrl?: string;
    notes?: string;
  };
  toggleNode: () => void;
}

const GenealogyNode: React.FC<NodeProps> = ({ person, toggleNode }) => {
  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).getFullYear();
  };

  const lifespan = () => {
    const birth = formatDate(person.birthDate);
    const death = formatDate(person.deathDate);
    
    if (birth && death) {
      return `${birth} - ${death}`;
    } else if (birth) {
      return `b. ${birth}`;
    } else if (death) {
      return `d. ${death}`;
    }
    return '';
  };

  const nodeClass = `node-card node-gender-${person.gender}`;

  return (
    <div className={nodeClass} onClick={toggleNode}>
      {person.imageUrl && (
        <div className="node-image">
          <img 
            src={person.imageUrl} 
            alt={person.name} 
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
        </div>
      )}
      <div className="node-name">{person.name}</div>
      <div className="node-dates">{lifespan()}</div>
      {person.notes && <div className="node-notes" style={{ fontSize: '10px' }}>{person.notes}</div>}
    </div>
  );
};

export default GenealogyNode;