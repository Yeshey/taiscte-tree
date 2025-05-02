// src/components/PersonDetailsModal.tsx
import React from 'react';
import { Person } from '../types/models';

const placeholderImageUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjY2NjY2NjIiBkPSJNMTIgMTJhMi41IDIuNSAwIDAgMSAyLjUgMi41IDIuNSAyLjUgMCAwIDEgLTIuNSAyLjUgMi41IDIuNSAwIDAgMSAtMi41IC0yLjUgMi41IDIuNSAwIDAgMSAyLjUgLTIuNXptMCAtOWMzLjMxMyAwIDYgMi42ODcgNiA2IDAgMy4zMTQtMi42ODcgNiAtNiA2cy02LTIuNjg2LTYtNiAwLTMuMzEzIDIuNjg3LTYgNi02em0wIDEwYzIuNjcgMCA4IDEuMzMgOCA0djJoLTE2di0yYzAtMi42NyA1LjMzLTQgOC00eiIvPjwvc3ZnPg==";

interface PersonDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  allPeople: Person[];
}

const formatDate = (dateStr: string | undefined, format: 'year' | 'month' | 'day'): string => {
    // ... (implementation)
    if (!dateStr || typeof dateStr !== 'string') return 'N/A';
    try {
        const date = new Date(dateStr + 'T00:00:00');
        if (isNaN(date.getTime())) return `Invalid: ${dateStr}`;
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        if (format === 'year') return year.toString();
        if (format === 'month') return `${month}/${year}`;
        if (format === 'day') return `${day}/${month}/${year}`;
    } catch (e) { return `Error: ${dateStr}`; }
    return dateStr;
};

const PersonDetailsModal: React.FC<PersonDetailsModalProps> = ({ isOpen, onClose, person, allPeople }) => {
  if (!isOpen || !person) return null;

  // Renamed function and updated logic
  const getParentName = (parentId: string | undefined): string => {
    if (!parentId) return 'N/A (Root)'; // Indicate root if no parentId
    const parent = allPeople.find(p => p.id === parentId);
    return parent?.name || `Unknown (ID: ${parentId})`;
  };

  const displayName = person.nickname ? `${person.name} "${person.nickname}"` : person.name;
  const parentName = getParentName(person.parentId); // Use new function
  const otherInstrumentsText = person.otherInstruments?.join(', ') || 'None';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeButton}>×</button>
        <div style={styles.modalContent}>
            <img
                src={person.imageUrl || placeholderImageUrl}
                alt={displayName}
                style={styles.image}
                onError={(e) => { const t=e.target as HTMLImageElement; if(t.src!==placeholderImageUrl) t.src=placeholderImageUrl; }}
            />
           <h2 style={styles.name}>{displayName}</h2>
           <div style={styles.detailsGrid}>
                {person.familyName && <><span style={styles.label}>Família:</span> <span>{person.familyName}</span></>}
                {/* Updated label and value */}
                {(person.parentId !== undefined || parentName !== 'N/A (Root)') && <><span style={styles.label}>Parent:</span> <span>{parentName}</span></>}
                {person.hierarquia && <><span style={styles.label}>Hierarquia:</span> <span>{person.hierarquia}</span></>}
                {person.naipeVocal && <><span style={styles.label}>Naipe Vocal:</span> <span>{person.naipeVocal}</span></>}
                {person.mainInstrument && <><span style={styles.label}>Instrumento Principal:</span> <span>{person.mainInstrument}</span></>}
                {person.otherInstruments && person.otherInstruments.length > 0 && <><span style={styles.label}>Outros Instrumentos:</span> <span>{otherInstrumentsText}</span></>}
                {person.curso && <><span style={styles.label}>Curso:</span> <span>{person.curso}</span></>}
                {person.subidaPalcoDate && <><span style={styles.label}>Subida a Palco:</span> <span>{formatDate(person.subidaPalcoDate, 'day')}</span></>}
                {person.passagemTunoDate && <><span style={styles.label}>Passagem a Tuno:</span> <span>{formatDate(person.passagemTunoDate, 'day')}</span></>}
                {person.dataSaidaDaTuna && <><span style={styles.label}>Saída da Tuna:</span> <span>{formatDate(person.dataSaidaDaTuna, 'day')}</span></>}
                {person.birthDate && <><span style={styles.label}>Nascimento:</span> <span>{formatDate(person.birthDate, 'day')}</span></>}
                {person.deathDate && <><span style={styles.label}>Falecimento:</span> <span>{formatDate(person.deathDate, 'day')}</span></>}
           </div>
           {person.notes && (
               <div style={styles.notesSection}>
                   <span style={styles.label}>Notas:</span>
                   <p style={styles.notesText}>{person.notes}</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

// Styles remain the same
const styles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, cursor: 'pointer'},
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'relative', width: '90%', maxWidth: '550px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', cursor: 'default'},
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#888', lineHeight: 1},
    modalContent: { overflowY: 'auto', paddingRight: '10px' }, // Allow content scrolling
    image: { display: 'block', width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 15px auto', border: '2px solid #eee' },
    name: { textAlign: 'center', margin: '0 0 20px 0', color: '#333' },
    detailsGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 15px', alignItems: 'center', marginBottom: '15px' },
    label: { fontWeight: 'bold', color: '#555', textAlign: 'right' },
    notesSection: { marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' },
    notesText: { marginTop: '5px', whiteSpace: 'pre-wrap', color: '#444', fontSize: '0.95em' } // Allow wrapping
};

export default PersonDetailsModal;