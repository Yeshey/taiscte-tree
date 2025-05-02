// src/components/ExportImport.tsx
import React, { useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import { Person } from '../types/models';
import Modal from './Modal';
import * as AppStrings from '../constants/strings';

// --- Validation Helper (Crucial Update) ---
export function validateAndNormalizePersonData(data: any): { validData: Person[] | null, errors: string[] } {
  if (!Array.isArray(data)) {
    return { validData: null, errors: ["Imported data is not an array."] };
  }

  const validatedPeople: Person[] = [];
  const errors: string[] = [];
  let hasFatalError = false;
  const allIds = new Set<string>();

  data.forEach((item: any, index: number) => {
    if (typeof item !== 'object' || item === null) { errors.push(`Item at index ${index} is not a valid object.`); hasFatalError = true; return; }

    const person: Partial<Person> = { ...item };

    // REQUIRED fields
    if (typeof person.id !== 'string' || !person.id) { errors.push(`Item at index ${index} (Name: ${person.name || 'N/A'}) missing required 'id'.`); hasFatalError = true; }
    else if (allIds.has(person.id)) { errors.push(`Item at index ${index} (Name: ${person.name || 'N/A'}) duplicate ID '${person.id}'.`); hasFatalError = true; }
    else { allIds.add(person.id); }
    if (typeof person.name !== 'string' || !person.name) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) missing required 'name'.`); hasFatalError = true; }
    if (typeof person.familyName !== 'string' || !person.familyName) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) missing required 'familyName'.`); hasFatalError = true; }
    if (!['male', 'female', 'other'].includes(person.gender as any)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) invalid 'gender', defaulting to 'other'.`); person.gender = 'other'; }

    // REMOVED: children field check
    // if (person.children !== undefined) { errors.push(`Item at index ${index} contains unexpected 'children' field. It will be ignored.`); }

    // parentId (renamed from padrinhoId)
    if (person.parentId !== undefined && typeof person.parentId !== 'string') { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) invalid 'parentId' (must be string or undefined).`); person.parentId = undefined; }
    else if (person.parentId === '') { person.parentId = undefined; }

    // Instruments (no change)
    if (person.mainInstrument !== undefined && typeof person.mainInstrument !== 'string') { errors.push(`Item at index ${index} invalid 'mainInstrument'.`); person.mainInstrument = undefined; }
    if (person.otherInstruments === undefined || person.otherInstruments === null) { person.otherInstruments = []; }
    else if (!Array.isArray(person.otherInstruments)) { errors.push(`Item at index ${index} invalid 'otherInstruments'.`); person.otherInstruments = []; /* Correct to empty array */ hasFatalError = true; } // Make array type mismatch fatal?
    else { person.otherInstruments = person.otherInstruments.map(instr => String(instr)).filter(instr => typeof instr === 'string'); }

    // Optional strings (no change)
    const stringFields: (keyof Person)[] = ['nickname', 'notes', 'curso', 'naipeVocal', 'hierarquia', 'imageUrl'];
    stringFields.forEach(field => { /* ... (coercion logic) ... */
        if (person[field] !== undefined && typeof person[field] !== 'string') { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) field '${field}' has invalid type.`); (person as any)[field] = String(person[field]); }
        if (person[field] === '') person[field] = undefined;
    });

    // Optional Dates (no change)
    const dateFields: (keyof Person)[] = ['birthDate', 'deathDate', 'subidaPalcoDate', 'passagemTunoDate', 'dataSaidaDaTuna'];
     dateFields.forEach(field => { /* ... (validation and empty string logic) ... */
        if (person[field] !== undefined && typeof person[field] !== 'string') { errors.push(`Item at index ${index} field '${field}' invalid type.`); person[field] = undefined; }
        else if (person[field] === '') person[field] = undefined;
     });

    // Remove undefined values before pushing
    Object.keys(person).forEach(key => {
        if (person[key as keyof Person] === undefined) {
            delete person[key as keyof Person];
        }
    });

    // Remove legacy fields
    if ((item as any).parents !== undefined) { errors.push(`Item at index ${index} contains removed field 'parents'. Ignored.`); delete (person as any).parents; }
    if ((item as any).spouses !== undefined) { errors.push(`Item at index ${index} contains removed field 'spouses'. Ignored.`); delete (person as any).spouses; }
    if ((item as any).padrinhoId !== undefined && person.parentId === undefined) {
        // If old padrinhoId exists and new parentId doesn't, maybe migrate? Or just warn.
        errors.push(`Item at index ${index} contains old field 'padrinhoId'. Use 'parentId' instead. Ignored.`);
        delete (person as any).padrinhoId;
    }


    const itemErrors = errors.filter(e => e.includes(`index ${index}`));
    if (!itemErrors.some(e => e.includes('missing required') || e.includes('invalid') || e.includes('duplicate ID'))) {
        validatedPeople.push(person as Person);
    } else {
        hasFatalError = true;
    }
  });

  // Referential integrity check for parentId
   validatedPeople.forEach(person => {
       if (person.parentId && !allIds.has(person.parentId)) {
           errors.push(`Person '${person.name}' (ID: ${person.id}) refers to non-existent parent ID '${person.parentId}'.`);
           // Consider if this should be fatal: hasFatalError = true;
       }
   });

  if (errors.length > 0) { console.warn("Import Validation Issues:", errors); }

  return {
      validData: hasFatalError ? null : validatedPeople,
      errors: errors.filter(e => !e.includes('Ignored') && !e.includes('defaulting')) // Filter less critical messages
  };
}

// Component remains the same, relying on the updated validator
interface ExportImportProps {
  onImport: (data: Person[]) => void;
  onExport: () => Person[];
  isUserLoggedIn: boolean;
  isFirebaseAvailable: boolean;
}

const ExportImport: React.FC<ExportImportProps> = ({ /* ... props ... */
    onImport, onExport, isUserLoggedIn, isFirebaseAvailable
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [dataToImport, setDataToImport] = useState<Person[] | null>(null);

  const handleExport = () => { /* ... (uses updated validator via onExport -> useTreeData) ... */
        const data = onExport();
        const { validData, errors } = validateAndNormalizePersonData(data); // Validate before export
        if (!validData) { alert(`Export failed: Current data validation errors:\n- ${errors.join('\n- ')}`); return; }
        if (errors.length > 0) console.warn("Exporting data with warnings:", errors);
        const blob = new Blob([JSON.stringify(validData, null, 2)], { type: 'application/json' });
        saveAs(blob, 'tuna-tree.json');
  };

  const handleImportClick = () => { /* ... */
      if (!isFirebaseAvailable) { alert("Import disabled: Firebase unavailable."); return; }
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... (uses updated validator) ... */
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target?.result as string);
                const { validData, errors } = validateAndNormalizePersonData(jsonData); // Use updated validator
                if (validData) { setDataToImport(validData); setIsConfirmModalOpen(true); }
                else { alert(AppStrings.IMPORT_FAILED_INVALID(errors)); }
            } catch (error: any) { alert('Error parsing JSON file: ' + error.message); }
            finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
        };
        reader.onerror = () => { alert('Error reading file.'); if (fileInputRef.current) fileInputRef.current.value = ''; };
        reader.readAsText(file);
  };

  const handleConfirmImport = () => { /* ... */
      if (dataToImport) onImport(dataToImport);
      setIsConfirmModalOpen(false); setDataToImport(null);
  };

    const importDisabled = !isFirebaseAvailable;
    const importTitle = importDisabled ? "Import disabled: Firebase unavailable." : isUserLoggedIn ? "Import JSON (OVERWRITES server data)" : "Import JSON (local view only)";

    return (
        <>
            <div className="export-import-container">
                <button className="export-import-button" onClick={handleExport} title="Export current tree to JSON"> Export Tree </button>
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
                <p>{isUserLoggedIn ? AppStrings.CONFIRM_IMPORT_OVERWRITE_MSG : AppStrings.CONFIRM_IMPORT_LOCAL_NOTE}</p>
            </Modal>
        </>
    );
};

export default ExportImport;