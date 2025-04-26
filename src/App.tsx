import React, { useState, useEffect } from 'react';
import './App.css';
import GenealogyTree from './components/GenealogyTree';
import ExportImport from './components/ExportImport';
import { demoData } from './data/demoData';
import { Person } from './types/models';

function App() {
  const [treeData, setTreeData] = useState<Person[]>([]);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // This would be replaced with actual Firebase initialization check
    const checkFirebase = () => {
      // Simulate Firebase check
      setTimeout(() => {
        setIsFirebaseAvailable(false); // Set to false for demo
        setIsLoading(false);
        // Load demo data since Firebase isn't available
        setTreeData(demoData);
      }, 1500);
    };
    
    checkFirebase();
  }, []);

  const handleImportData = (data: Person[]) => {
    setTreeData(data);
  };

  const handleExportData = () => {
    return treeData;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Family Tree</h1>
        {isLoading ? (
          <div className="loading">Loading family tree data...</div>
        ) : (
          <>
            {!isFirebaseAvailable && (
              <div className="firebase-warning">
                <p>Firebase connection not detected. Showing demo data.</p>
                <p>You can still export/import data manually.</p>
              </div>
            )}
            <ExportImport 
              onImport={handleImportData} 
              onExport={handleExportData} 
            />
            <div className="tree-container">
              <GenealogyTree data={treeData} />
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;