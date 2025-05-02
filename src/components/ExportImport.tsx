// src/components/ExportImport.tsx
// --- START OF FILE src/components/ExportImport.tsx ---
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
  const allIds = new Set<string>(); // Track IDs to check uniqueness

  data.forEach((item: any, index: number) => {
    if (typeof item !== 'object' || item === null) { errors.push(`Item at index ${index} is not a valid object.`); hasFatalError = true; return; }

    // Clone item to avoid modifying original import data directly during validation
    const person: Partial<Person> = { ...item };

    // --- Check REQUIRED fields ---
    if (typeof person.id !== 'string' || !person.id) { errors.push(`Item at index ${index} (Name: ${person.name || 'N/A'}) is missing required 'id' (string).`); hasFatalError = true; }
    else if (allIds.has(person.id)) { errors.push(`Item at index ${index} (Name: ${person.name || 'N/A'}) has duplicate ID '${person.id}'.`); hasFatalError = true; }
    else { allIds.add(person.id); }

    if (typeof person.name !== 'string' || !person.name) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) is missing required 'name' (string).`); hasFatalError = true; }
    if (typeof person.familyName !== 'string' || !person.familyName) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) is missing required 'familyName' (string).`); hasFatalError = true; } // Added familyName check
    if (!['male', 'female', 'other'].includes(person.gender as any)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid or missing 'gender'. Defaulting to 'other'.`); person.gender = 'other'; }

    // --- Check and NORMALIZE relational/optional fields ---
    // Relationship Arrays (Only children now)
    if (person.children === undefined || person.children === null) { person.children = []; }
    else if (!Array.isArray(person.children)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'children' field.`); hasFatalError = true; }
    else { // Ensure children are strings
        person.children = person.children.map(id => String(id)).filter(id => typeof id === 'string');
    }

    // Padrinho ID
    if (person.padrinhoId !== undefined && typeof person.padrinhoId !== 'string') { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'padrinhoId' field (must be string or undefined).`); person.padrinhoId = undefined; }
    else if (person.padrinhoId === '') { person.padrinhoId = undefined; } // Treat empty string as undefined

    // Instruments
    if (person.mainInstrument !== undefined && typeof person.mainInstrument !== 'string') { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'mainInstrument' field.`); person.mainInstrument = undefined; }
    if (person.otherInstruments === undefined || person.otherInstruments === null) { person.otherInstruments = []; }
    else if (!Array.isArray(person.otherInstruments)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'otherInstruments' field (must be an array).`); hasFatalError = true; }
    else { person.otherInstruments = person.otherInstruments.map(instr => String(instr)).filter(instr => typeof instr === 'string'); }

    // Other optional strings - Ensure they are strings if present, or undefined
    const stringFields: (keyof Person)[] = ['nickname', 'notes', 'curso', 'naipeVocal', 'hierarquia', 'imageUrl'];
    stringFields.forEach(field => {
        if (person[field] !== undefined && typeof person[field] !== 'string') {
            errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) field '${field}' has invalid type (coercing to string).`);
            (person as any)[field] = String(person[field]);
        }
        // Convert empty strings for optional fields to undefined
        if (person[field] === '') {
             person[field] = undefined;
        }
    });

    // Optional Dates - Basic type check (YYYY-MM-DD)
    const dateFields: (keyof Person)[] = ['birthDate', 'deathDate', 'subidaPalcoDate', 'passagemTunoDate', 'dataSaidaDaTuna'];
     dateFields.forEach(field => {
        if (person[field] !== undefined && typeof person[field] !== 'string') {
             errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) field '${field}' has invalid type.`);
             person[field] = undefined; // Remove invalid date type
        } else if (person[field] === '') {
            person[field] = undefined; // Treat empty string as undefined
        }
        // Optional stricter format check (can uncomment if needed)
        // else if (person[field] && !/^\d{4}-\d{2}-\d{2}$/.test(person[field] as string)) {
        //    errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) field '${field}' has invalid date format (YYYY-MM-DD).`);
        //    person[field] = undefined;
        // }
     });

    // --- Remove undefined values for Firebase ---
    Object.keys(person).forEach(key => {
        if (person[key as keyof Person] === undefined) {
            delete person[key as keyof Person];
        }
    });

    // Check for removed fields and log warning if they exist
    if ((item as any).parents !== undefined) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) contains removed field 'parents'. It will be ignored.`); }
    if ((item as any).spouses !== undefined) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) contains removed field 'spouses'. It will be ignored.`); }

    // Only add if no fatal errors occurred *for this item*
    const itemErrors = errors.filter(e => e.includes(`index ${index}`));
    if (itemErrors.length === 0) {
        // Remove ignored fields explicitly before casting
        delete (person as any).parents;
        delete (person as any).spouses;
        validatedPeople.push(person as Person); // Cast after validation and cleaning
    } else {
         // If fatal error occurred for this item, ensure overall fatal flag is set
        if (itemErrors.some(e => e.includes('missing required') || e.includes('invalid') || e.includes('duplicate ID'))) {
             hasFatalError = true;
        }
    }
  });

  // Check referential integrity: children IDs must exist
   validatedPeople.forEach(person => {
       person.children.forEach(childId => {
           if (!allIds.has(childId)) {
               errors.push(`Person '${person.name}' (ID: ${person.id}) refers to non-existent child ID '${childId}'.`);
               // Decide if this is fatal or just a warning
               // hasFatalError = true; // Make it fatal if needed
           }
       });
       if (person.padrinhoId && !allIds.has(person.padrinhoId)) {
            errors.push(`Person '${person.name}' (ID: ${person.id}) refers to non-existent padrinho ID '${person.padrinhoId}'.`);
            // hasFatalError = true; // Make it fatal if needed
       }
   });


  if (errors.length > 0) { console.warn("Import Validation Issues:", errors); }

  // Return null only if fatal errors occurred
  return {
      validData: hasFatalError ? null : validatedPeople,
      // Filter out non-critical warnings for user alert
      errors: errors.filter(e => !e.includes('contains removed field') && !e.includes('defaulting'))
  };
}
// --- End Validation Helper ---

interface ExportImportProps {
  onImport: (data: Person[]) => void;
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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [dataToImport, setDataToImport] = useState<Person[] | null>(null);

  const handleExport = () => {
        const data = onExport();
        // Run validation *before* exporting to ensure clean data
        const { validData, errors } = validateAndNormalizePersonData(data);
        if (!validData) {
            alert(`Export failed: Current data has validation errors:\n- ${errors.join('\n- ')}`);
            return;
        }
        if (errors.length > 0) {
            console.warn("Exporting data with minor validation warnings:", errors);
            // Optionally confirm with user if there are warnings?
        }
        const blob = new Blob([JSON.stringify(validData, null, 2)], { type: 'application/json' });
        saveAs(blob, 'tuna-tree.json');
    };

    const handleImportClick = () => {
      if (!isFirebaseAvailable) {
          alert("Import disabled: Firebase connection unavailable.");
          return;
      }
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

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
                const { validData, errors } = validateAndNormalizePersonData(jsonData);

                if (validData) {
                    setDataToImport(validData);
                    setIsConfirmModalOpen(true); // Open confirm modal
                } else {
                    alert(AppStrings.IMPORT_FAILED_INVALID(errors));
                }
            } catch (error: any) { // Catch JSON parse errors too
                console.error("Error processing JSON file:", error);
                alert('Error parsing JSON file: ' + error.message);
            } finally {
                 // Reset file input value regardless of success/failure
                 if (fileInputRef.current) { fileInputRef.current.value = ''; }
            }
        };
        reader.onerror = (e) => { // Handle file reading errors
             console.error("Error reading file:", e);
             alert('Error reading file.');
             if (fileInputRef.current) { fileInputRef.current.value = ''; }
        };
        reader.readAsText(file);
        // Don't reset here, reset in onload/onerror
        // if (fileInputRef.current) { fileInputRef.current.value = ''; }
    };

    const handleConfirmImport = () => {
        if (dataToImport) { onImport(dataToImport); }
        setIsConfirmModalOpen(false); setDataToImport(null);
    };

    const importDisabled = !isFirebaseAvailable;
    const importTitle = importDisabled ? "Import disabled: Firebase connection unavailable." : isUserLoggedIn ? "Import JSON tree data (will OVERWRITE shared tree)" : "Import JSON tree data (view locally, log in to save)";

    return (
        <>
            <div className="export-import-container">
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
                <p dangerouslySetInnerHTML={{ __html: isUserLoggedIn ? AppStrings.CONFIRM_IMPORT_OVERWRITE_MSG : AppStrings.CONFIRM_IMPORT_LOCAL_NOTE }}></p>
                 {/* Removed redundant local note */}
            </Modal>
        </>
    );
};

export default ExportImport;
// --- END OF FILE src/components/ExportImport.tsx ---