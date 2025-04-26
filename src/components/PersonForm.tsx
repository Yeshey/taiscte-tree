// src/components/PersonForm.tsx
import React, { useState, useEffect } from 'react';
import { Person } from '../types/models';

interface PersonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (personData: Omit<Person, 'id' | 'parents' | 'children' | 'spouses'> & { id?: string }) => void; // Submit partial data
  initialData?: Person | null; // For editing
  formTitle: string;
}

const PersonForm: React.FC<PersonFormProps> = ({ isOpen, onClose, onSubmit, initialData, formTitle }) => {
  // Initialize state based on initialData or defaults
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [curso, setCurso] = useState('');
  const [vocalNaipe, setVocalNaipe] = useState('');
  const [instrumento, setInstrumento] = useState('');
  const [subidaPalcoDate, setSubidaPalcoDate] = useState(''); // Use YYYY-MM format for input maybe?
  const [passagemTunoDate, setPassagemTunoDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setGender(initialData.gender || 'other');
      setBirthDate(initialData.birthDate || '');
      setDeathDate(initialData.deathDate || '');
      // setImageUrl(initialData.imageUrl || 'https://i.imgur.com/0lluid3.jpeg'); // Default Imgur URL
      setNotes(initialData.notes || '');
      setCurso(initialData.curso || '');
      setVocalNaipe(initialData.vocalNaipe || '');
      setInstrumento(initialData.instrumento || '');
      setSubidaPalcoDate(initialData.subidaPalcoDate || '');
      setPassagemTunoDate(initialData.passagemTunoDate || '');
    } else {
      // Reset form for adding new person
      setName('');
      setGender('other');
      setBirthDate('');
      setDeathDate('');
      // setImageUrl('https://i.imgur.com/0lluid3.jpeg'); // Default Imgur URL
      setNotes('');
      setCurso('');
      setVocalNaipe('');
      setInstrumento('');
      setSubidaPalcoDate('');
      setPassagemTunoDate('');
    }
  }, [initialData, isOpen]); // Reset form when initialData changes or modal opens

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !gender) {
        alert("Name and Gender are required.");
        return;
    }
    onSubmit({
      // Include id only if editing
      ...(initialData?.id && { id: initialData.id }),
      name,
      gender,
      // Only include optional fields if they have a value
      ...(birthDate && { birthDate }),
      ...(deathDate && { deathDate }),
      ...(imageUrl && { imageUrl }),
      ...(notes && { notes }),
      ...(curso && { curso }),
      ...(vocalNaipe && { vocalNaipe }),
      ...(instrumento && { instrumento }),
      ...(subidaPalcoDate && { subidaPalcoDate }),
      ...(passagemTunoDate && { passagemTunoDate }),
    });
    onClose(); // Close modal after submit
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>×</button>
        <h2>{formTitle}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Required Fields */}
          <div style={styles.inputGroup}>
            <label htmlFor="name">Name*:</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="gender">Gender*:</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as any)} required style={styles.input}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Optional Fields */}
          <div style={styles.inputGroup}>
            <label htmlFor="curso">Curso:</label>
            <input type="text" id="curso" value={curso} onChange={(e) => setCurso(e.target.value)} style={styles.input} />
          </div>
           <div style={styles.inputGroup}>
            <label htmlFor="vocalNaipe">Vocal Naipe:</label>
            <input type="text" id="vocalNaipe" value={vocalNaipe} onChange={(e) => setVocalNaipe(e.target.value)} style={styles.input} />
          </div>
           <div style={styles.inputGroup}>
            <label htmlFor="instrumento">Instrumento:</label>
            <input type="text" id="instrumento" value={instrumento} onChange={(e) => setInstrumento(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="subidaPalco">Subida a Palco (YYYY-MM):</label>
            <input type="month" id="subidaPalco" value={subidaPalcoDate} onChange={(e) => setSubidaPalcoDate(e.target.value)} style={styles.input} placeholder="YYYY-MM"/>
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="passagemTuno">Passagem a Tuno (YYYY-MM):</label>
             <input type="month" id="passagemTuno" value={passagemTunoDate} onChange={(e) => setPassagemTunoDate(e.target.value)} style={styles.input} placeholder="YYYY-MM"/>
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="birthDate">Birth Date:</label>
            <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="deathDate">Death Date:</label>
            <input type="date" id="deathDate" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="imageUrl">Image URL (Imgur):</label>
            <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={styles.input} placeholder="https://i.imgur.com/..." />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="notes">Notes:</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...styles.input, height: '60px' }} />
          </div>

          <button type="submit" style={styles.submitButton}>Save Person</button>
        </form>
      </div>
    </div>
  );
};

// Use similar styling to LoginModal, adjust as needed
const styles: { [key: string]: React.CSSProperties } = {
    overlay: { /* Same as LoginModal overlay */
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px'
    },
    modal: { /* Similar to LoginModal modal */
        backgroundColor: 'white', padding: '25px 35px', borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative',
        width: '90%', maxWidth: '500px', margin: 'auto'
    },
     form: {
        maxHeight: '70vh', // Limit form height and allow scrolling within modal
        overflowY: 'auto',
        paddingRight: '15px', // Space for scrollbar
    },
    closeButton: { /* Same as LoginModal closeButton */
        position: 'absolute', top: '10px', right: '10px', background: 'none',
        border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa',
    },
    inputGroup: { /* Same as LoginModal inputGroup */
        marginBottom: '15px', textAlign: 'left',
    },
    input: { /* Same as LoginModal input */
        width: '100%', padding: '8px', border: '1px solid #ccc',
        borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px',
    },
    submitButton: { /* Same as LoginModal submitButton */
        backgroundColor: '#28a745', color: 'white', padding: '10px 15px',
        border: 'none', borderRadius: '4px', cursor: 'pointer',
        width: '100%', fontSize: '16px', marginTop: '10px',
    }
};

export default PersonForm;