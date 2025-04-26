import React, { useRef } from 'react';
import { saveAs } from 'file-saver';
import { Person } from '../types/models';

interface ExportImportProps {
  onImport: (data: Person[]) => void;
  onExport: () => Person[];
}

const ExportImport: React.FC<ExportImportProps> = ({ onImport, onExport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'family-tree.json');
  };

  const handleImportClick = () => {
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
        if (Array.isArray(jsonData)) {
          onImport(jsonData);
        } else {
          alert('Invalid data format. Expected an array of person objects.');
        }
      } catch (error) {
        alert('Error parsing JSON file: ' + error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be loaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="export-import-container">
      <button 
        className="export-import-button" 
        onClick={handleExport}
      >
        Export Tree
      </button>
      
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="file-input"
      />
      <label 
        className="file-input-label" 
        onClick={handleImportClick}
      >
        Import Tree
      </label>
    </div>
  );
};

export default ExportImport;