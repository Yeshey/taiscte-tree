// src/components/ExportImport.tsx
import React, { useRef } from 'react';
import { saveAs } from 'file-saver';
import { Person } from '../types/models'; // Import the Person type

interface ExportImportProps {
  onImport: (data: Person[]) => void;
  onExport: () => Person[];
  isUserLoggedIn: boolean;
  isFirebaseAvailable: boolean;
}

// --- Data Validation Helper ---
// Checks if an object looks like a valid Person structure
// And adds default empty arrays for missing relational fields
function validateAndNormalizePersonData(data: any): { validData: Person[] | null, errors: string[] } {
  if (!Array.isArray(data)) {
    return { validData: null, errors: ["Imported data is not an array."] };
  }

  const validatedPeople: Person[] = [];
  const errors: string[] = [];
  let hasFatalError = false;

  data.forEach((item: any, index: number) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item at index ${index} is not a valid object.`);
      hasFatalError = true;
      return; // Skip this item if it's not even an object
    }

    const person: Partial<Person> = { ...item }; // Create a partial copy

    // --- Check REQUIRED fields ---
    if (typeof person.id !== 'string' || !person.id) {
        errors.push(`Item at index ${index} (Name: ${person.name || 'N/A'}) is missing required 'id' (string).`);
        hasFatalError = true;
    }
    if (typeof person.name !== 'string' || !person.name) {
        errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) is missing required 'name' (string).`);
        hasFatalError = true;
    }
    if (!['male', 'female', 'other'].includes(person.gender as any)) {
        errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid or missing 'gender' (must be 'male', 'female', or 'other').`);
         // You could default gender here, or treat as fatal
         person.gender = 'other'; // Example: Defaulting gender
        // hasFatalError = true;
    }

    // --- Check and NORMALIZE relational arrays ---
    // If missing, add default empty array. If wrong type, report error.
    if (person.parents === undefined || person.parents === null) {
      person.parents = []; // Default to empty array if missing
    } else if (!Array.isArray(person.parents)) {
      errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'parents' field (must be an array).`);
      hasFatalError = true;
    }

    if (person.children === undefined || person.children === null) {
      person.children = []; // Default to empty array
    } else if (!Array.isArray(person.children)) {
      errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'children' field (must be an array).`);
      hasFatalError = true;
    }

    if (person.spouses === undefined || person.spouses === null) {
      person.spouses = []; // Default to empty array
    } else if (!Array.isArray(person.spouses)) {
      errors.push(`Item at index ${index} (ID: ${person.id || 'N/A'}) has invalid 'spouses' field (must be an array).`);
      hasFatalError = true;
    }

    // --- Add optional fields if needed, ensure correct types (optional) ---
    // Example: ensure notes is string or undefined
     if (person.notes !== undefined && typeof person.notes !== 'string') {
        person.notes = String(person.notes); // Coerce to string or handle differently
     }
     // Add similar checks for birthDate, deathDate, imageUrl if strict typing is needed


    // Only add if no fatal errors encountered for this item so far
    if (!hasFatalError) {
        // Cast to Person assumes the checks above are sufficient
        validatedPeople.push(person as Person);
    }
  });

  // If any fatal errors occurred anywhere, return null for validData
  if (errors.length > 0) {
      console.error("Import Validation Errors:", errors);
  }

  return { validData: hasFatalError ? null : validatedPeople, errors };
}
// --- End Validation Helper ---


const ExportImport: React.FC<ExportImportProps> = ({
    onImport,
    onExport,
    isUserLoggedIn,
    isFirebaseAvailable
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // ... (export logic remains the same) ...
     const data = onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'family-tree.json');
  };

  const handleImportClick = () => {
     // ... (import click logic remains the same) ...
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

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        // --- Validate and Normalize Data ---
        const { validData, errors } = validateAndNormalizePersonData(jsonData);

        if (validData) {
          // Data is valid (or normalized), proceed with import
          onImport(validData);
          if (errors.length > 0) {
              // Inform user about non-fatal errors (like defaulted gender) if any
              alert(`Import successful with minor issues:\n- ${errors.join('\n- ')}\nCheck console for details.`);
          } else {
              // Optionally show success message
              // alert("Tree data imported successfully!");
          }
        } else {
          // Data is invalid, report errors
          alert(`Import failed due to invalid data format:\n- ${errors.join('\n- ')}\nPlease check the file structure or console for details.`);
        }
        // --- End Validation ---

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

  // ... (rest of the component including button state/tooltip logic) ...
    const importDisabled = !isFirebaseAvailable; // Disable if Firebase isn't working
    const importTitle = importDisabled
    ? "Import disabled: Firebase connection unavailable."
    : isUserLoggedIn
    ? "Import tree data (will save to shared tree)"
    : "Import tree data (view locally, log in to save)";


  return (
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
        accept=".json"
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
  );
};


export default ExportImport;