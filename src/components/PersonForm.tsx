// src/components/PersonForm.tsx
import React, { useState, useEffect } from 'react';
import { Person } from '../types/models';
import * as AppStrings from '../constants/strings';
import PersonFormFields from './form/PersonFormFields'; // Import the new fields component

// Interface remains the same
interface PersonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (personData: Omit<Person, 'id' | 'children' | 'padrinhoId'> & { id?: string }) => void;
  initialData?: Person | null;
  formTitle: string;
  familyNameOptions: string[];
  naipeOptions: string[];
  instrumentOptions: string[];
  hierarchyOptions: string[];
  isEditMode: boolean;
}

const PersonForm: React.FC<PersonFormProps> = ({
    isOpen, onClose, onSubmit, initialData, formTitle,
    familyNameOptions,
    naipeOptions, instrumentOptions, hierarchyOptions,
    isEditMode
}) => {
    // --- State remains here ---
    const [name, setName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [nickname, setNickname] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
    const [birthDate, setBirthDate] = useState('');
    const [deathDate, setDeathDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [curso, setCurso] = useState('');
    const [naipeVocal, setNaipeVocal] = useState('');
    const [mainInstrument, setMainInstrument] = useState('');
    const [selectedOtherInstruments, setSelectedOtherInstruments] = useState<Set<string>>(new Set());
    const [subidaPalcoDate, setSubidaPalcoDate] = useState(''); // State for date
    const [passagemTunoDate, setPassagemTunoDate] = useState(''); // State for date
    const [dataSaidaDaTuna, setDataSaidaDaTuna] = useState(''); // State for date
    const [hierarquia, setHierarquia] = useState('');
    const [previousSelectValue, setPreviousSelectValue] = useState<string>('');

    // --- Effect remains here ---
     useEffect(() => {
        if (isOpen) {
            const data = initialData;
            setName(data?.name || '');
            setFamilyName(data?.familyName || '');
            setNickname(data?.nickname || '');
            setGender(data?.gender || 'other');
            setBirthDate(data?.birthDate || '');
            setDeathDate(data?.deathDate || '');
            setNotes(data?.notes || '');
            setCurso(data?.curso || '');
            setNaipeVocal(data?.naipeVocal || '');
            setMainInstrument(data?.mainInstrument || '');
            setSelectedOtherInstruments(new Set(data?.otherInstruments || []));
            setSubidaPalcoDate(data?.subidaPalcoDate || '');
            setPassagemTunoDate(data?.passagemTunoDate || '');
            setDataSaidaDaTuna(data?.dataSaidaDaTuna || '');
            setHierarquia(data?.hierarquia || '');
        }
     }, [initialData, isOpen]);

    // --- Handlers remain here ---
    // handleDropdownChange, handleOtherInstrumentChange, handleSubmit ...
    const handleDropdownChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
        setter: React.Dispatch<React.SetStateAction<string>>,
        currentStateValue: string,
        promptMessage: string
    ) => {
        const value = e.target.value;
        if (value === AppStrings.ADD_NEW_OPTION_VALUE) {
            setPreviousSelectValue(currentStateValue);
            const newValue = window.prompt(promptMessage);
            if (newValue && newValue.trim()) {
                const trimmedValue = newValue.trim();
                setter(trimmedValue);
            } else {
                e.target.value = previousSelectValue;
            }
        } else {
            setter(value);
        }
    };

    const handleOtherInstrumentChange = (instrument: string, checked: boolean) => {
        setSelectedOtherInstruments(prev => {
            const newSet = new Set(prev);
            if (checked) newSet.add(instrument);
            else newSet.delete(instrument);
            return newSet;
        });
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!name || !gender || !familyName) {
            alert(AppStrings.ERROR_NAME_GENDER_FAMILYNAME_REQUIRED);
            return;
        }
        const formatInputDate = (dateStr: string): string | undefined => dateStr || undefined;
        onSubmit({
            ...(isEditMode && initialData?.id && { id: initialData.id }),
            name, familyName, gender,
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
                {/* Render the Fields Component, passing all state and handlers */}
                <PersonFormFields
                    // Values
                    name={name} familyName={familyName} nickname={nickname} gender={gender} birthDate={birthDate}
                    deathDate={deathDate} imageUrl={imageUrl} notes={notes} curso={curso} naipeVocal={naipeVocal}
                    mainInstrument={mainInstrument} selectedOtherInstruments={selectedOtherInstruments}
                    subidaPalcoDate={subidaPalcoDate} passagemTunoDate={passagemTunoDate}
                    dataSaidaDaTuna={dataSaidaDaTuna} hierarquia={hierarquia}
                    // Options
                    familyNameOptions={familyNameOptions} naipeOptions={naipeOptions}
                    instrumentOptions={instrumentOptions} hierarchyOptions={hierarchyOptions}
                    otherInstrumentCheckboxOptions={otherInstrumentCheckboxOptions}
                    // Basic Setters
                    setName={setName} setNickname={setNickname} setGender={setGender} setBirthDate={setBirthDate}
                    setDeathDate={setDeathDate} setImageUrl={setImageUrl} setNotes={setNotes} setCurso={setCurso}
                    // --- PASS MISSING DATE SETTERS ---
                    setSubidaPalcoDate={setSubidaPalcoDate}
                    setPassagemTunoDate={setPassagemTunoDate}
                    setDataSaidaDaTuna={setDataSaidaDaTuna}
                    // --- END PASS ---
                    // Handlers
                    handleDropdownChange={handleDropdownChange}
                    handleOtherInstrumentChange={handleOtherInstrumentChange}
                    handleSubmit={handleSubmit}
                    // Dropdown Setters for handler
                    setFamilyNameState={setFamilyName}
                    setNaipeVocalState={setNaipeVocal}
                    setMainInstrumentState={setMainInstrument}
                    setHierarquiaState={setHierarquia}
                />
            </div>
        </div>
    );
};

// Styles remain the same
// --- Styles (Keep only overlay/modal container styles) ---
const styles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' },
    modal: { backgroundColor: 'white', padding: '25px 35px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative', width: '90%', maxWidth: '600px', margin: 'auto' },
    closeButton: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa', },
    // Form styles are now in PersonFormFields.tsx
};


export default PersonForm;