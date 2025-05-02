// src/components/ExportImport.tsx
import React, { useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import { Person } from '../types/models'; // Updated Person type
import Modal from './Modal';
// Import string constants
import * as AppStrings from '../constants/strings';

// --- Validation Helper ---
export function validateAndNormalizePersonData(data: any): { validData: Person[] | null, errors: string[] } {
  if (!Array.isArray(data)) {
    return { validData: null, errors: ["Imported data is not an array."] };
  }

  const validatedPeople: Person[] = [];
  const errors: string[] = [];
  let hasFatalError = false;

  data.forEach((item: any, index: number) => {
    if (typeof item !== 'object' || item === null) { errors.push(`Item at index ${index} is not a valid object.`); hasFatalError = true; return; }

    const person: Partial<Person> = { ...item };

    // --- Check REQUIRED fields ---
    if (typeof person.id !== 'string' || !person.id) { errors.push(`Item at index ${index} (Name: ${person.name || 'N/A'}) is missing required 'id' (string).`); hasFatalError = true; }
    if (typeof person.name !== 'string' || !person.name) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) is missing required 'name' (string).`); hasFatalError = true; }
    if (!['male', 'female', 'other'].includes(person.gender as any)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid or missing 'gender'. Defaulting to 'other'.`); person.gender = 'other'; }

    // --- Check and NORMALIZE relational/optional fields ---
    // Relationship Arrays (Only children now)
    if (person.children === undefined || person.children === null) { person.children = []; }
    else if (!Array.isArray(person.children)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'children' field.`); hasFatalError = true; }

    // New relationship field
    if (person.padrinhoId !== undefined && typeof person.padrinhoId !== 'string') { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'padrinhoId' field (must be string or undefined).`); person.padrinhoId = undefined; /* Or try String(person.padrinhoId) */ }

    // Instruments
    if (person.mainInstrument !== undefined && typeof person.mainInstrument !== 'string') { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'mainInstrument' field.`); person.mainInstrument = undefined; }
    if (person.otherInstruments === undefined || person.otherInstruments === null) { person.otherInstruments = []; } // Default if missing
    else if (!Array.isArray(person.otherInstruments)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'otherInstruments' field (must be an array).`); hasFatalError = true; }
    else { // Ensure all items in the array are strings
        person.otherInstruments = person.otherInstruments.map(instr => String(instr)).filter(instr => typeof instr === 'string');
    }

    // Other optional strings - Ensure they are strings if present
    const stringFields: (keyof Person)[] = ['nickname', 'notes', 'curso', 'naipeVocal', 'hierarquia'];
    stringFields.forEach(field => {
        // Check if the field exists and is not already a string
        if (person[field] !== undefined && typeof person[field] !== 'string') {
            errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) field '${field}' has invalid type (coercing to string).`);
            // --- FIX: Cast the target via any before assigning the coerced string ---
            (person as any)[field] = String(person[field]);
        }
    });

    // Optional Dates - Basic type check (more validation can be added)
    const dateFields: (keyof Person)[] = ['birthDate', 'deathDate', 'subidaPalcoDate', 'passagemTunoDate', 'dataSaidaDaTuna'];
     dateFields.forEach(field => {
        if (person[field] !== undefined && typeof person[field] !== 'string') {
             errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) field '${field}' has invalid type.`);
             person[field] = undefined; // Remove invalid date type
        }
        // Optional: Add regex check for YYYY-MM-DD format
        // else if (person[field] && !/^\d{4}-\d{2}-\d{2}$/.test(person[field] as string)) {
        //    errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) field '${field}' has invalid date format (YYYY-MM-DD).`);
        //    person[field] = undefined;
        // }
     });


    // Ensure imageUrl is string if present
     if (person.imageUrl !== undefined && typeof person.imageUrl !== 'string') { person.imageUrl = undefined; }


    // Check for removed fields and log warning if they exist
    if ((item as any).parents !== undefined) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) contains removed field 'parents'. It will be ignored.`); }
    if ((item as any).spouses !== undefined) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) contains removed field 'spouses'. It will be ignored.`); }

    // Only add if no fatal errors occurred *for this item*
    if (!errors.some(e => e.includes(`index ${index}`))) {
        // Remove ignored fields explicitly before casting
        delete (person as any).parents;
        delete (person as any).spouses;
        validatedPeople.push(person as Person);
    } else {
         hasFatalError = true;
    }
  });

  if (errors.length > 0) { console.warn("Import Validation Issues:", errors); } // Use warn for non-fatal

  // Return null only if fatal errors occurred (missing id, name, wrong array types)
  return { validData: hasFatalError ? null : validatedPeople, errors: errors.filter(e => !e.includes('contains removed field') && !e.includes('defaulting')) }; // Filter out non-critical warnings for user alert
}
// --- End Validation Helper ---

interface ExportImportProps {
  onImport: (data: Person[]) => void; // Changed signature back
  onExport: () => Person[];
  isUserLoggedIn: boolean;
  isFirebaseAvailable: boolean;
}

const ExportImport: React.FC<ExportImportProps> = ({
    onImport,
    onExport,
    isUserLoggedIn,
    isFirebaseAvailable
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // --- State for Confirmation Modal ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [dataToImport, setDataToImport] = useState<Person[] | null>(null);
  // --- End State ---

  const handleExport = () => {
        const data = onExport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(blob, 'tuna-tree.json'); // Changed filename
    };

    // --- Import Click (remains the same) ---
    const handleImportClick = () => {
      if (!isFirebaseAvailable) {
          alert("Import disabled: Firebase connection unavailable.");
          return;
      }
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    // --- File Change Handler (uses validation) ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
            alert(AppStrings.IMPORT_ZIP_UNSUPPORTED);
            if (fileInputRef.current) { fileInputRef.current.value = ''; }
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target?.result as string);
                const { validData, errors } = validateAndNormalizePersonData(jsonData); // Use the updated validator

                if (validData) {
                    setDataToImport(validData);
                    setIsConfirmModalOpen(true); // Open confirm modal
                } else {
                    alert(AppStrings.IMPORT_FAILED_INVALID(errors));
                }
            } catch (error) {
                console.error("Error processing JSON file:", error);
                alert('Error parsing JSON file: ' + error);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) { fileInputRef.current.value = ''; }
    };

    // --- Confirm Import (remains the same) ---
    const handleConfirmImport = () => {
        if (dataToImport) { onImport(dataToImport); }
        setIsConfirmModalOpen(false); setDataToImport(null);
    };

    // --- JSX (Use AppStrings) ---
    const importDisabled = !isFirebaseAvailable;
    const importTitle = importDisabled ? "Import disabled: Firebase connection unavailable." : isUserLoggedIn ? "Import JSON tree data (will OVERWRITE shared tree)" : "Import JSON tree data (view locally, log in to save)";

    return (
        <>
            <div className="export-import-container">
                {/* ... buttons using importTitle ... */}
                <button className="export-import-button" onClick={handleExport} title="Export current tree view to a JSON file"> Export Tree </button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="file-input" disabled={importDisabled} />
                <label className={`file-input-label ${importDisabled ? 'disabled' : ''}`} onClick={handleImportClick} title={importTitle} style={importDisabled ? { cursor: 'not-allowed', backgroundColor: '#ccc' } : {}}> Import Tree {!isUserLoggedIn && isFirebaseAvailable && '(Local View)'} </label>
            </div>
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => { setIsConfirmModalOpen(false); setDataToImport(null); }}
                onConfirm={handleConfirmImport}
                title={AppStrings.CONFIRM_IMPORT_OVERWRITE_TITLE}
                confirmText="Overwrite" cancelText="Cancel"
            >
                <p dangerouslySetInnerHTML={{ __html: AppStrings.CONFIRM_IMPORT_OVERWRITE_MSG.replace('<strong style={{color: \'red\'}}>', '<strong>').replace('</strong>', '</strong>') }}></p>
                {!isUserLoggedIn && <p style={{marginTop: '10px', fontStyle: 'italic', color: '#666'}}>{AppStrings.CONFIRM_IMPORT_LOCAL_NOTE}</p>}
            </Modal>
        </>
    );
};

export default ExportImport;