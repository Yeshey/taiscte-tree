// src/components/PersonForm.tsx
// --- START OF FILE src/components/PersonForm.tsx ---
import React, { useState, useEffect } from 'react';
import { Person } from '../types/models';
// Import string constants
import * as AppStrings from '../constants/strings';

// Define expected props including dropdown options
interface PersonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (personData: Omit<Person, 'id' | 'children' | 'padrinhoId'> & { id?: string }) => void; // Removed padrinhoId from submit type
  initialData?: Person | null;
  formTitle: string;
  // Dropdown Options - Calculated in App.tsx
  familyNameOptions: string[]; // Added
  naipeOptions: string[];
  instrumentOptions: string[];
  hierarchyOptions: string[];
  // padrinhoOptions: { id: string, name: string }[]; // Removed
  isEditMode: boolean;
}

const PersonForm: React.FC<PersonFormProps> = ({
    isOpen, onClose, onSubmit, initialData, formTitle,
    familyNameOptions, // Added
    naipeOptions, instrumentOptions, hierarchyOptions,
    isEditMode
}) => {
  // --- State for all fields ---
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState(''); // Added state
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  // const [padrinhoId, setPadrinhoId] = useState<string>(''); // Removed state
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [curso, setCurso] = useState('');
  const [naipeVocal, setNaipeVocal] = useState('');
  const [mainInstrument, setMainInstrument] = useState('');
  const [selectedOtherInstruments, setSelectedOtherInstruments] = useState<Set<string>>(new Set());
  const [subidaPalcoDate, setSubidaPalcoDate] = useState('');
  const [passagemTunoDate, setPassagemTunoDate] = useState('');
  const [dataSaidaDaTuna, setDataSaidaDaTuna] = useState('');
  const [hierarquia, setHierarquia] = useState('');

  // --- Populate form on open/initialData change ---
  useEffect(() => {
    if (isOpen) {
      const data = initialData;
      setName(data?.name || '');
      setFamilyName(data?.familyName || ''); // Populate familyName
      setNickname(data?.nickname || '');
      setGender(data?.gender || 'other');
      // setPadrinhoId(data?.padrinhoId || ''); // Removed
      setBirthDate(data?.birthDate || '');
      setDeathDate(data?.deathDate || '');
      setImageUrl(data?.imageUrl || 'https://i.imgur.com/0lluid3.jpeg'); // Default placeholder suggestion
      setNotes(data?.notes || '');
      setCurso(data?.curso || '');
      setNaipeVocal(data?.naipeVocal || '');
      setMainInstrument(data?.mainInstrument || '');
      setSelectedOtherInstruments(new Set(data?.otherInstruments || []));
      setSubidaPalcoDate(data?.subidaPalcoDate || '');
      setPassagemTunoDate(data?.passagemTunoDate || '');
      setDataSaidaDaTuna(data?.dataSaidaDaTuna || '');
      setHierarquia(data?.hierarquia || '');
    } else {
      // Optional: Reset state fully on close if desired
      // setName(''); setFamilyName(''); ... etc ...
    }
  }, [initialData, isOpen]);

  // --- Handlers for dynamic dropdowns ---
  const handleDropdownChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
        setter: React.Dispatch<React.SetStateAction<string>>,
        promptMessage: string
    ) => {
        const value = e.target.value;
        if (value === AppStrings.ADD_NEW_OPTION_VALUE) {
            const newValue = window.prompt(promptMessage);
            if (newValue && newValue.trim()) {
                const trimmedValue = newValue.trim();
                console.log(`Setting new value via prompt: ${trimmedValue}`); // Debug log
                setter(trimmedValue); // Set state to the newly added value
                // Ensure the select's value is updated immediately for display consistency
                e.target.value = trimmedValue;
            } else {
                // If user cancelled prompt or entered empty, reset select to previous state value
                // This requires knowing the previous state, simple reset to '' might be okay for now
                // Or better: Do nothing, let the state remain as it was before clicking "Add New"
                console.log("Prompt cancelled or empty, keeping previous value.");
                // Find the current state value for this setter to reset the dropdown
                // This is tricky, maybe just resetting to '' is acceptable UX for now
                e.target.value = ''; // Reset dropdown visually if cancelled
                // setter(''); // Resetting state might be unwanted if they just cancelled
            }
        } else {
            console.log(`Setting value from selection: ${value}`); // Debug log
            setter(value);
        }
    };

  // --- Handler for Other Instruments Checkboxes ---
  const handleOtherInstrumentChange = (instrument: string, checked: boolean) => {
      setSelectedOtherInstruments(prev => {
          const newSet = new Set(prev);
          if (checked) {
              newSet.add(instrument);
          } else {
              newSet.delete(instrument);
          }
          return newSet;
      });
  };

  // --- Form Submission ---
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Updated validation check
    if (!name || !gender || !familyName) {
        alert(AppStrings.ERROR_NAME_GENDER_FAMILYNAME_REQUIRED);
        return;
    }

    // Format dates: empty string becomes undefined
    const formatInputDate = (dateStr: string): string | undefined => dateStr || undefined;

    onSubmit({
      ...(isEditMode && initialData?.id && { id: initialData.id }),
      name,
      familyName, // Include familyName
      gender,
      // Removed padrinhoId from submitted object
      ...(nickname && { nickname }),
      birthDate: formatInputDate(birthDate),
      deathDate: formatInputDate(deathDate),
      imageUrl: imageUrl || undefined,
      notes: notes || undefined,
      curso: curso || undefined,
      naipeVocal: naipeVocal || undefined,
      mainInstrument: mainInstrument || undefined,
      otherInstruments: Array.from(selectedOtherInstruments),
      subidaPalcoDate: formatInputDate(subidaPalcoDate),
      passagemTunoDate: formatInputDate(passagemTunoDate),
      dataSaidaDaTuna: formatInputDate(dataSaidaDaTuna),
      hierarquia: hierarquia || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  const otherInstrumentCheckboxOptions = instrumentOptions.filter(inst => inst !== mainInstrument);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>×</button>
        <h2>{formTitle}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* --- Required & Core Fields --- */}
          <div style={styles.inputGroup}> <label htmlFor="name">Name*:</label> <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} /> </div>
          <div style={styles.inputGroup}> <label htmlFor="familyName">Family Name*:</label>
             <select id="familyName" value={familyName} onChange={(e) => handleDropdownChange(e, setFamilyName, AppStrings.PROMPT_ADD_NEW_FAMILY_NAME)} required style={styles.input}>
                <option value="">-- Select --</option>
                {familyNameOptions.map(n => <option key={n} value={n}>{n}</option>)}
                <option value={AppStrings.ADD_NEW_OPTION_VALUE}>{AppStrings.ADD_NEW_OPTION_TEXT}</option>
             </select>
          </div>
          <div style={styles.inputGroup}> <label htmlFor="nickname">Nickname:</label> <input type="text" id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} style={styles.input} /> </div>
          <div style={styles.inputGroup}> <label htmlFor="gender">Gender*:</label> <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as any)} required style={styles.input}> <option value="other">Other</option> <option value="male">Male</option> <option value="female">Female</option> </select> </div>

          {/* --- Padrinho Field Removed --- */}
          {/*
          <div style={styles.inputGroup}>
             <label htmlFor="padrinho">Padrinho/Madrinha:</label>
             <select id="padrinho" value={padrinhoId} onChange={(e) => setPadrinhoId(e.target.value)} style={styles.input}>
                <option value="">-- Select --</option>
                {padrinhoOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
          </div>
           */}

          {/* --- Tuna Specific Fields --- */}
           <div style={styles.inputGroup}>
             <label htmlFor="hierarquia">Hierarquia:</label>
             <select id="hierarquia" value={hierarquia} onChange={(e) => handleDropdownChange(e, setHierarquia, AppStrings.PROMPT_ADD_NEW_HIERARCHY)} style={styles.input}>
                <option value="">-- Select --</option>
                {hierarchyOptions.map(h => <option key={h} value={h}>{h}</option>)}
                <option value={AppStrings.ADD_NEW_OPTION_VALUE}>{AppStrings.ADD_NEW_OPTION_TEXT}</option>
             </select>
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="curso">Curso:</label>
            <input type="text" id="curso" value={curso} onChange={(e) => setCurso(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="naipeVocal">Naipe Vocal:</label>
             <select id="naipeVocal" value={naipeVocal} onChange={(e) => handleDropdownChange(e, setNaipeVocal, AppStrings.PROMPT_ADD_NEW_NAIPE)} style={styles.input}>
                <option value="">-- Select --</option>
                {naipeOptions.map(n => <option key={n} value={n}>{n}</option>)}
                <option value={AppStrings.ADD_NEW_OPTION_VALUE}>{AppStrings.ADD_NEW_OPTION_TEXT}</option>
             </select>
             <small>{AppStrings.REMOVE_OPTION_INFO}</small>
          </div>
           <div style={styles.inputGroup}>
            <label htmlFor="mainInstrument">Main Instrument:</label>
             <select id="mainInstrument" value={mainInstrument} onChange={(e) => handleDropdownChange(e, setMainInstrument, AppStrings.PROMPT_ADD_NEW_INSTRUMENT)} style={styles.input}>
                <option value="">-- Select --</option>
                {instrumentOptions.map(i => <option key={i} value={i}>{i}</option>)}
                <option value={AppStrings.ADD_NEW_OPTION_VALUE}>{AppStrings.ADD_NEW_OPTION_TEXT}</option>
             </select>
              <small>{AppStrings.REMOVE_OPTION_INFO}</small>
          </div>
          {/* Other Instruments Checkboxes */}
           {instrumentOptions.length > 0 && (
                <div style={styles.inputGroup}>
                    <label>Other Instruments:</label>
                    <div style={styles.checkboxGroup}>
                        {otherInstrumentCheckboxOptions.map(inst => (
                            <div key={inst} style={styles.checkboxItem}>
                                <input
                                    type="checkbox"
                                    id={`otherInst-${inst}`}
                                    value={inst}
                                    checked={selectedOtherInstruments.has(inst)}
                                    onChange={(e) => handleOtherInstrumentChange(inst, e.target.checked)}
                                />
                                <label htmlFor={`otherInst-${inst}`}>{inst}</label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

          {/* --- Dates --- */}
          <div style={styles.inputGroup}> <label htmlFor="subidaPalco">Subida a Palco Date:</label> <input type="date" id="subidaPalco" value={subidaPalcoDate} onChange={(e) => setSubidaPalcoDate(e.target.value)} style={styles.input}/> </div>
          <div style={styles.inputGroup}> <label htmlFor="passagemTuno">Passagem a Tuno Date:</label> <input type="date" id="passagemTuno" value={passagemTunoDate} onChange={(e) => setPassagemTunoDate(e.target.value)} style={styles.input}/> </div>
          <div style={styles.inputGroup}> <label htmlFor="dataSaida">Data Saída da Tuna:</label> <input type="date" id="dataSaida" value={dataSaidaDaTuna} onChange={(e) => setDataSaidaDaTuna(e.target.value)} style={styles.input} /> </div>
          <div style={styles.inputGroup}> <label htmlFor="birthDate">Birth Date:</label> <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={styles.input} /> </div>
          <div style={styles.inputGroup}> <label htmlFor="deathDate">Death Date:</label> <input type="date" id="deathDate" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} style={styles.input} /> </div>

          {/* --- Other --- */}
          <div style={styles.inputGroup}> <label htmlFor="imageUrl">Image URL (Imgur / https):</label> <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={styles.input} placeholder="https://i.imgur.com/... or https://..."/> </div>
          <div style={styles.inputGroup}> <label htmlFor="notes">Notes:</label> <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...styles.input, height: '60px' }} /> </div>

          <button type="submit" style={styles.submitButton}>Save Person</button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' },
    modal: { backgroundColor: 'white', padding: '25px 35px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative', width: '90%', maxWidth: '600px', margin: 'auto' },
    form: { maxHeight: '75vh', overflowY: 'auto', paddingRight: '15px', },
    closeButton: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa', },
    inputGroup: { marginBottom: '15px', textAlign: 'left', },
    label: { // Added label style for consistency
        display: 'block',
        marginBottom: '3px',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    input: { display: 'block', width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', // marginTop: '5px', Removed, use label margin
        fontSize: '14px', // Consistent font size
    },
    submitButton: { backgroundColor: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '16px', marginTop: '10px', },
    checkboxGroup: {
        border: '1px solid #ccc', borderRadius: '4px', padding: '10px', marginTop: '5px', maxHeight: '150px', overflowY: 'auto'
    },
    checkboxItem: {
        display: 'flex', alignItems: 'center', marginBottom: '5px',
    },
    checkboxItemLabel: { // Specific label for checkbox item
        marginLeft: '8px',
        fontWeight: 'normal', // Normal weight for checkbox labels
        fontSize: '14px',
    }
};

export default PersonForm;
// --- END OF FILE src/components/PersonForm.tsx ---