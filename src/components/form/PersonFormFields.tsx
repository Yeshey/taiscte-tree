// src/components/form/PersonFormFields.tsx
import React from 'react';
import * as AppStrings from '../../constants/strings';

// Props required by the form fields
interface PersonFormFieldsProps {
    name: string;
    familyName: string;
    nickname: string;
    gender: 'male' | 'female' | 'other';
    birthDate: string;
    deathDate: string;
    imageUrl: string;
    notes: string;
    curso: string;
    naipeVocal: string;
    mainInstrument: string;
    selectedOtherInstruments: Set<string>;
    subidaPalcoDate: string;
    passagemTunoDate: string;
    dataSaidaDaTuna: string;
    hierarquia: string;

    // Options
    familyNameOptions: string[];
    naipeOptions: string[];
    instrumentOptions: string[];
    hierarchyOptions: string[];
    otherInstrumentCheckboxOptions: string[]; // Pre-filtered list

    setSubidaPalcoDate: React.Dispatch<React.SetStateAction<string>>;
    setPassagemTunoDate: React.Dispatch<React.SetStateAction<string>>;
    setDataSaidaDaTuna: React.Dispatch<React.SetStateAction<string>>;

    // Handlers
    // Using React.Dispatch for type safety on setters
    setName: React.Dispatch<React.SetStateAction<string>>;
    // setFamilyName: React.Dispatch<React.SetStateAction<string>>; // Handled by handleDropdownChange
    setNickname: React.Dispatch<React.SetStateAction<string>>;
    setGender: React.Dispatch<React.SetStateAction<'male' | 'female' | 'other'>>;
    setBirthDate: React.Dispatch<React.SetStateAction<string>>;
    setDeathDate: React.Dispatch<React.SetStateAction<string>>;
    setImageUrl: React.Dispatch<React.SetStateAction<string>>;
    setNotes: React.Dispatch<React.SetStateAction<string>>;
    setCurso: React.Dispatch<React.SetStateAction<string>>;
    // setNaipeVocal: React.Dispatch<React.SetStateAction<string>>; // Handled by handleDropdownChange
    // setMainInstrument: React.Dispatch<React.SetStateAction<string>>; // Handled by handleDropdownChange
    // setHierarquia: React.Dispatch<React.SetStateAction<string>>; // Handled by handleDropdownChange
    handleDropdownChange: (
        e: React.ChangeEvent<HTMLSelectElement>,
        setter: React.Dispatch<React.SetStateAction<string>>,
        currentStateValue: string,
        promptMessage: string
    ) => void;
    handleOtherInstrumentChange: (instrument: string, checked: boolean) => void;
    handleSubmit: (event: React.FormEvent) => void;

    // Need direct state setters for dropdowns because handleDropdownChange needs them
    setFamilyNameState: React.Dispatch<React.SetStateAction<string>>;
    setNaipeVocalState: React.Dispatch<React.SetStateAction<string>>;
    setMainInstrumentState: React.Dispatch<React.SetStateAction<string>>;
    setHierarquiaState: React.Dispatch<React.SetStateAction<string>>;
}

const PersonFormFields: React.FC<PersonFormFieldsProps> = ({
    name, familyName, nickname, gender, birthDate, deathDate, imageUrl, notes, curso, naipeVocal,
    mainInstrument, selectedOtherInstruments, subidaPalcoDate, passagemTunoDate, dataSaidaDaTuna, hierarquia,
    familyNameOptions, naipeOptions, instrumentOptions, hierarchyOptions, otherInstrumentCheckboxOptions,
    setName, setNickname, setGender, setBirthDate, setDeathDate, setImageUrl, setNotes, setCurso,
    handleDropdownChange, handleOtherInstrumentChange, handleSubmit, setSubidaPalcoDate, setPassagemTunoDate, setDataSaidaDaTuna,
    // Pass direct setters for dropdown handler
    setFamilyNameState, setNaipeVocalState, setMainInstrumentState, setHierarquiaState
}) => {

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            {/* --- Fields --- */}
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="name">Name*:</label> <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} /> </div>
            {/* Family Name Dropdown - Use the passed handler and state */}
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="familyName">Family Name*:</label>
                <select id="familyName" value={familyName} onChange={(e) => handleDropdownChange(e, setFamilyNameState, familyName, AppStrings.PROMPT_ADD_NEW_FAMILY_NAME)} required style={styles.input}>
                    <option value="">-- Select --</option>
                    {familyNameOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    {familyName && !familyNameOptions.includes(familyName) && familyName !== AppStrings.ADD_NEW_OPTION_VALUE && (
                         <option key={familyName} value={familyName}>{familyName}</option>
                     )}
                    <option value={AppStrings.ADD_NEW_OPTION_VALUE}>{AppStrings.ADD_NEW_OPTION_TEXT}</option>
                </select>
            </div>
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="nickname">Nickname:</label> <input type="text" id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} style={styles.input} /> </div>
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="gender">Gender*:</label> <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as any)} required style={styles.input}> <option value="other">Other</option> <option value="male">Male</option> <option value="female">Female</option> </select> </div>
            {/* Hierarquia Dropdown */}
            <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="hierarquia">Hierarquia:</label>
                <select id="hierarquia" value={hierarquia} onChange={(e) => handleDropdownChange(e, setHierarquiaState, hierarquia, AppStrings.PROMPT_ADD_NEW_HIERARCHY)} style={styles.input}>
                    <option value="">-- Select --</option>
                    {hierarchyOptions.map(h => <option key={h} value={h}>{h}</option>)}
                    {hierarquia && !hierarchyOptions.includes(hierarquia) && hierarquia !== AppStrings.ADD_NEW_OPTION_VALUE && (
                        <option key={hierarquia} value={hierarquia}>{hierarquia}</option>
                    )}
                    <option value={AppStrings.ADD_NEW_OPTION_VALUE}>{AppStrings.ADD_NEW_OPTION_TEXT}</option>
                </select>
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="curso">Curso:</label>
                <input type="text" id="curso" value={curso} onChange={(e) => setCurso(e.target.value)} style={styles.input} />
            </div>
             {/* Naipe Vocal Dropdown */}
            <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="naipeVocal">Naipe Vocal:</label>
                <select id="naipeVocal" value={naipeVocal} onChange={(e) => handleDropdownChange(e, setNaipeVocalState, naipeVocal, AppStrings.PROMPT_ADD_NEW_NAIPE)} style={styles.input}>
                    <option value="">-- Select --</option>
                    {naipeOptions.map(n => <option key={n} value={n}>{n}</option>)}
                     {naipeVocal && !naipeOptions.includes(naipeVocal) && naipeVocal !== AppStrings.ADD_NEW_OPTION_VALUE && (
                        <option key={naipeVocal} value={naipeVocal}>{naipeVocal}</option>
                    )}
                    <option value={AppStrings.ADD_NEW_OPTION_VALUE}>{AppStrings.ADD_NEW_OPTION_TEXT}</option>
                </select>
                <small>{AppStrings.REMOVE_OPTION_INFO}</small>
            </div>
            {/* Main Instrument Dropdown */}
            <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="mainInstrument">Main Instrument:</label>
                <select id="mainInstrument" value={mainInstrument} onChange={(e) => handleDropdownChange(e, setMainInstrumentState, mainInstrument, AppStrings.PROMPT_ADD_NEW_INSTRUMENT)} style={styles.input}>
                    <option value="">-- Select --</option>
                    {instrumentOptions.map(i => <option key={i} value={i}>{i}</option>)}
                     {mainInstrument && !instrumentOptions.includes(mainInstrument) && mainInstrument !== AppStrings.ADD_NEW_OPTION_VALUE && (
                        <option key={mainInstrument} value={mainInstrument}>{mainInstrument}</option>
                    )}
                    <option value={AppStrings.ADD_NEW_OPTION_VALUE}>{AppStrings.ADD_NEW_OPTION_TEXT}</option>
                </select>
                <small>{AppStrings.REMOVE_OPTION_INFO}</small>
            </div>
            {/* Other Instruments Checkboxes */}
             {instrumentOptions.length > 0 && (
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Other Instruments:</label>
                    <div style={styles.checkboxGroup}>
                        {otherInstrumentCheckboxOptions.map(inst => (
                            <div key={inst} style={styles.checkboxItem}>
                                <input
                                    type="checkbox"
                                    id={`otherInst-${inst}`}
                                    value={inst}
                                    checked={selectedOtherInstruments.has(inst)}
                                    onChange={(e) => handleOtherInstrumentChange(inst, e.target.checked)}
                                    style={{ marginRight: '5px' }}
                                />
                                <label htmlFor={`otherInst-${inst}`} style={styles.checkboxItemLabel}>{inst}</label>
                            </div>
                        ))}
                    </div>
                </div>
             )}

            {/* --- Dates --- */}
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="subidaPalco">Subida a Palco Date:</label> <input type="date" id="subidaPalco" value={subidaPalcoDate} onChange={(e) => setSubidaPalcoDate(e.target.value)} style={styles.input}/> </div>
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="passagemTuno">Passagem a Tuno Date:</label> <input type="date" id="passagemTuno" value={passagemTunoDate} onChange={(e) => setPassagemTunoDate(e.target.value)} style={styles.input}/> </div>
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="dataSaida">Data Saída da Tuna:</label> <input type="date" id="dataSaida" value={dataSaidaDaTuna} onChange={(e) => setDataSaidaDaTuna(e.target.value)} style={styles.input} /> </div>
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="birthDate">Birth Date:</label> <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={styles.input} /> </div>
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="deathDate">Death Date:</label> <input type="date" id="deathDate" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} style={styles.input} /> </div>

            {/* --- Other --- */}
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="imageUrl">Image URL (Imgur / https):</label> <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={styles.input} placeholder="https://i.imgur.com/... or https://..."/> </div>
            <div style={styles.inputGroup}> <label style={styles.label} htmlFor="notes">Notes:</label> <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...styles.input, height: '60px' }} /> </div>

            <button type="submit" style={styles.submitButton}>Save Person</button>
        </form>
    );
}

// --- Styles (Copied from PersonForm) ---
const styles: { [key: string]: React.CSSProperties } = {
    // Keep only styles relevant to the form itself
    form: { maxHeight: '75vh', overflowY: 'auto', paddingRight: '15px', },
    inputGroup: { marginBottom: '15px', textAlign: 'left', },
    label: {
        display: 'block',
        marginBottom: '3px',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    input: { display: 'block', width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px', },
    submitButton: { backgroundColor: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '16px', marginTop: '10px', },
    checkboxGroup: {
        border: '1px solid #ccc', borderRadius: '4px', padding: '10px', marginTop: '5px', maxHeight: '150px', overflowY: 'auto'
    },
    checkboxItem: {
        display: 'flex', alignItems: 'center', marginBottom: '5px',
    },
    checkboxItemLabel: {
        marginLeft: '8px',
        fontWeight: 'normal',
        fontSize: '14px',
        cursor: 'pointer',
    }
};

export default PersonFormFields;