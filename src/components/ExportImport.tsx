// src/components/ExportImport.tsx
import React, { useRef, useState } from 'react'; // Import useState
import { saveAs } from 'file-saver';
import { Person } from '../types/models';
import Modal from './Modal'; // Import the generic modal

// --- Validation Function (Keep as is, ensure it's exported) ---
export function validateAndNormalizePersonData(data: any): { validData: Person[] | null, errors: string[] } {
    // ... validation logic from previous step ...
    if (!Array.isArray(data)) {
    return { validData: null, errors: ["Imported data is not an array."] };
  }
  const validatedPeople: Person[] = [];
  const errors: string[] = [];
  let hasFatalError = false;
  data.forEach((item: any, index: number) => {
    if (typeof item !== 'object' || item === null) { errors.push(`Item at index ${index} is not a valid object.`); hasFatalError = true; return; }
    const person: Partial<Person> = { ...item };
    if (typeof person.id !== 'string' || !person.id) { errors.push(`Item at index ${index} (Name: ${person.name || 'N/A'}) is missing required 'id' (string).`); hasFatalError = true; }
    if (typeof person.name !== 'string' || !person.name) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) is missing required 'name' (string).`); hasFatalError = true; }
    if (!['male', 'female', 'other'].includes(person.gender as any)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid or missing 'gender'. Defaulting to 'other'.`); person.gender = 'other';}
    if (person.parents === undefined || person.parents === null) { person.parents = []; } else if (!Array.isArray(person.parents)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'parents' field.`); hasFatalError = true; }
    if (person.children === undefined || person.children === null) { person.children = []; } else if (!Array.isArray(person.children)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'children' field.`); hasFatalError = true; }
    if (person.spouses === undefined || person.spouses === null) { person.spouses = []; } else if (!Array.isArray(person.spouses)) { errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'spouses' field.`); hasFatalError = true; }
    if (person.notes !== undefined && typeof person.notes !== 'string') { person.notes = String(person.notes); }
    // Add checks/defaults for new fields if necessary during import validation
    if (person.curso !== undefined && typeof person.curso !== 'string') { person.curso = String(person.curso); }
    if (person.vocalNaipe !== undefined && typeof person.vocalNaipe !== 'string') { person.vocalNaipe = String(person.vocalNaipe); }
    if (person.instrumento !== undefined && typeof person.instrumento !== 'string') { person.instrumento = String(person.instrumento); }
    if (person.subidaPalcoDate !== undefined && typeof person.subidaPalcoDate !== 'string') { person.subidaPalcoDate = String(person.subidaPalcoDate); } // Basic type check
    if (person.passagemTunoDate !== undefined && typeof person.passagemTunoDate !== 'string') { person.passagemTunoDate = String(person.passagemTunoDate); } // Basic type check

    if (!errors.some(e => e.includes(`index ${index}`))) { validatedPeople.push(person as Person); } else { hasFatalError = true; }
  });
  if (errors.length > 0) { console.error("Import Validation Errors:", errors); }
  return { validData: hasFatalError ? null : validatedPeople, errors };
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
    saveAs(blob, 'family-tree.json'); // Export only JSON with Imgur URLs
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

    // --- Check if ZIP (and reject for now, as we use Imgur) ---
    if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        alert("ZIP file import is not supported when using external image URLs (like Imgur). Please import the JSON file directly.");
         if (fileInputRef.current) { fileInputRef.current.value = ''; } // Reset input
        return;
    }
    // --- End ZIP Check ---

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const { validData, errors } = validateAndNormalizePersonData(jsonData);

        if (validData) {
          // --- Data is valid, store it and open confirmation modal ---
          setDataToImport(validData);
          setIsConfirmModalOpen(true);
          // --- Don't call onImport directly here ---
        } else {
          alert(`Import failed due to invalid data format:\n- ${errors.join('\n- ')}\nPlease check the file structure or console for details.`);
        }

      } catch (error) {
        console.error("Error processing JSON file:", error);
        alert('Error parsing JSON file: ' + error);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Confirmation Handler ---
  const handleConfirmImport = () => {
    if (dataToImport) {
      onImport(dataToImport); // Call the original onImport passed from App
    }
    setIsConfirmModalOpen(false);
    setDataToImport(null);
  };
  // --- End Confirmation Handler ---

  const importDisabled = !isFirebaseAvailable;
  const importTitle = importDisabled
    ? "Import disabled: Firebase connection unavailable."
    : isUserLoggedIn
    ? "Import JSON tree data (will OVERWRITE shared tree)"
    : "Import JSON tree data (view locally, log in to save)";

  return (
    <> {/* Use Fragment to render modal alongside buttons */}
      <div className="export-import-container">
        <button
          className="export-import-button"
          onClick={handleExport}
          title="Export current tree view to a JSON file"
        >
          Export Tree
        </button>

        <input
          type="file"
          accept=".json" // Accept only JSON now
          ref={fileInputRef}
          onChange={handleFileChange}
          className="file-input"
          disabled={importDisabled}
        />
        <label
          className={`file-input-label ${importDisabled ? 'disabled' : ''}`}
          onClick={handleImportClick}
          title={importTitle}
          style={importDisabled ? { cursor: 'not-allowed', backgroundColor: '#ccc' } : {}}
        >
          Import Tree {!isUserLoggedIn && isFirebaseAvailable && '(Local View)'}
        </label>
      </div>

      {/* --- Render Confirmation Modal --- */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setDataToImport(null); }}
        onConfirm={handleConfirmImport}
        title="Confirm Import & Overwrite"
        confirmText="Overwrite"
        cancelText="Cancel"
      >
        <p>Importing this file will <strong style={{color: 'red'}}>overwrite the current tree data in the shared database</strong>.</p>
        <p>This action is irreversible.</p>
        <p>Are you sure you want to continue?</p>
        {/* Add note if user is not logged in */}
        {!isUserLoggedIn && <p style={{marginTop: '10px', fontStyle: 'italic', color: '#666'}}>(Note: You are not logged in. This import will only affect your local view unless you log in and save.)</p>}
      </Modal>
      {/* --- End Modal --- */}
    </>
  );
};

export default ExportImport;