// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import GenealogyTree from './components/GenealogyTree';
// Import the validation function (adjust path if ExportImport is in a different folder)
import ExportImport, { validateAndNormalizePersonData } from './components/ExportImport';
import AccountIndicator from './components/auth/AccountIndicator';
import LoginModal from './components/auth/LoginModal';
import { demoData } from './data/demoData'; // Ensure this data is also valid!
import { Person } from './types/models';
import { auth, database, isFirebaseAvailable, firebaseInitializationError } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { ref, get, set, DatabaseReference } from 'firebase/database';

type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available';
type DbDataStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';

function App() {
  const [treeData, setTreeData] = useState<Person[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatus>('checking');
  const [dbDataStatus, setDbDataStatus] = useState<DbDataStatus>('idle');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // --- Fetch Data from Realtime Database ---
  const fetchTreeData = useCallback(async () => {
    if (!database) {
        console.error("Database service unavailable during fetch attempt.");
        setWarningMessage("Error: Firebase Database service not initialized correctly.");
        // --- Validate demoData before setting as fallback ---
        const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
        setTreeData(validatedDemoData || []); // Use validated demo or empty if demo itself is broken
        setDbDataStatus('error');
        return;
    }

    const treeDataRef: DatabaseReference = ref(database, 'treeData');
    setDbDataStatus('loading');
    setWarningMessage(null);

    try {
      console.log("Attempting to fetch data from Firebase DB...");
      const snapshot = await get(treeDataRef);
      if (snapshot.exists()) {
        const dataFromDb = snapshot.val();

        // --- !!! VALIDATE DATA FROM FIREBASE !!! ---
        const { validData, errors } = validateAndNormalizePersonData(dataFromDb);

        if (validData) {
            // Use the validated (and potentially normalized) data
            console.log("Data successfully fetched and validated from Firebase DB.");
            setTreeData(validData);
            setDbDataStatus('loaded');
            if (errors.length > 0) {
                console.warn("Minor validation issues found in Firebase data:", errors);
                // Optionally show a subtle warning about data cleanup?
            }
        } else {
            // Validation failed for Firebase data
            console.error("Validation failed for data fetched from Firebase:", errors);
            setWarningMessage(`Data error in Firebase: ${errors.join(', ')}. Displaying demo data.`);
             // --- Validate demoData before setting as fallback ---
            const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
            setTreeData(validatedDemoData || []);
            setDbDataStatus('error');
        }
        // --- End Firebase Data Validation ---

      } else {
        console.log("No data found at /treeData in Firebase DB.");
        setWarningMessage("Firebase connection successful, but no tree data found. Displaying demo data.");
         // --- Validate demoData before setting as fallback ---
        const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
        setTreeData(validatedDemoData || []);
        setDbDataStatus('empty');
      }
    } catch (error: any) {
      console.error("Error fetching data from Firebase DB:", error);
      if (error.code === 'PERMISSION_DENIED') {
           setWarningMessage("Error fetching data: Permission denied. Check database rules. Displaying demo data.");
      } else {
           setWarningMessage(`Error fetching data: ${error.message}. Displaying demo data.`);
      }
       // --- Validate demoData before setting as fallback ---
      const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
      setTreeData(validatedDemoData || []);
      setDbDataStatus('error');
    }
  }, [/* No dependencies needed here */]);


  // --- Firebase Initialization and Initial Data Fetch ---
  useEffect(() => {
    if (!isFirebaseAvailable) {
      console.error("Firebase Init Error:", firebaseInitializationError?.message || "Config invalid");
      setFirebaseStatus('config_error');
      setWarningMessage("Firebase configuration invalid or connection failed. Showing demo data. Export/Import still available locally.");
       // --- Validate demoData before setting ---
      const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
      setTreeData(validatedDemoData || []);
      setAuthLoading(false);
      setDbDataStatus('error');
    } else {
      setFirebaseStatus('available');
      fetchTreeData(); // Fetch data immediately
    }
  }, [fetchTreeData]); // Add fetchTreeData dependency


  // --- Auth State Listener ---
  useEffect(() => {
    if (firebaseStatus === 'available' && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
        console.log("Auth State Changed:", user ? `Logged in as ${user.email}` : "Logged out");
        // If user logs out, we might want to keep showing the publicly fetched data,
        // or revert to demo. Current logic keeps showing the fetched data.
        // If you want to revert to demo on logout, add logic here.
      });
      return () => unsubscribe();
    } else if (firebaseStatus !== 'checking') {
        setAuthLoading(false);
    }
  }, [firebaseStatus]);

   // --- Save Data Function ---
   const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => {
    if (!database || !currentUser) {
      console.error("Cannot save data: Database unavailable or user not logged in.");
      alert("Error: Cannot save data. Please ensure you are logged in and Firebase is connected.");
      return false;
    }
    // --- Optionally re-validate before saving ---
    const { validData, errors } = validateAndNormalizePersonData(dataToSave);
    if (!validData) {
        console.error("Cannot save: Data failed validation.", errors);
        alert(`Cannot save: Invalid data format detected.\n- ${errors.join('\n- ')}`);
        return false;
    }
    // --- End Re-validation ---

    console.log("Attempting to save data to Firebase...");
    try {
      const treeDataRef = ref(database, 'treeData');
      await set(treeDataRef, validData); // Save the validated data
      console.log("Data successfully saved to Firebase.");
      setWarningMessage("Tree data saved successfully.");
      setTimeout(() => setWarningMessage(null), 3000);
      return true;
    } catch (error: any) {
      console.error("Error saving data to Firebase:", error);
       if (error.code === 'PERMISSION_DENIED') {
           alert("Error saving data: Permission denied. You might need to log in again or check permissions.");
       } else {
           alert(`Error saving data: ${error.message}`);
       }
      return false;
    }
  }, [currentUser]);


  // --- Other Handlers ---
  const handleImportData = async (data: Person[]) => {
    // The validation now happens within ExportImport, 'data' should be valid Person[]
    setTreeData(data); // Update local state

    if (firebaseStatus === 'available' && currentUser) {
      await saveTreeDataToFirebase(data);
    } else if (firebaseStatus === 'available') {
        setWarningMessage("Data imported locally. Log in to save to the shared tree.");
         setTimeout(() => {
            if (warningMessage === "Data imported locally. Log in to save to the shared tree.") {
                setWarningMessage(null);
            }
         }, 5000);
    }
     // If firebaseStatus is 'config_error', user already has a warning
  };

  // ... (handleExportData, handleLoginClick, handleLogoutClick, handleCloseLoginModal remain the same) ...
    const handleExportData = () => {
    return treeData;
  };

  const handleLoginClick = () => {
     if (firebaseStatus === 'config_error') {
        alert("Login unavailable: Firebase is not configured correctly.");
        return;
     }
    setIsLoginModalOpen(true);
  };

  const handleLogoutClick = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
      alert(`Logout failed: ${error}`);
    }
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };


  // --- Render Logic ---
  // ... (loading check remains the same) ...
    if (firebaseStatus === 'checking' || authLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="loading">Loading application...</div>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* ... (AccountIndicator rendering) ... */}
         {firebaseStatus !== 'config_error' && auth && (
            <AccountIndicator
                currentUser={currentUser}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />
        )}

        <h1>Família TAISCTE</h1>

        {/* ... (WarningMessage rendering) ... */}
        {warningMessage && (
          <div className={`firebase-warning ${dbDataStatus === 'error' || firebaseStatus === 'config_error' ? 'error' : ''}`}>
            <p>{warningMessage}</p>
          </div>
        )}


        <ExportImport
          onImport={handleImportData}
          onExport={handleExportData}
          isUserLoggedIn={!!currentUser}
          isFirebaseAvailable={firebaseStatus === 'available'}
        />
        <div className="tree-container">
          {/* ... (Tree/Loading rendering) ... */}
            {(dbDataStatus === 'loading' && firebaseStatus === 'available') ? (
             <div className="loading">Loading tree data from Firebase...</div>
          ) : (
             <GenealogyTree data={treeData} />
          )}
        </div>

      </header>

      {/* ... (LoginModal rendering) ... */}
       {firebaseStatus !== 'config_error' && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={handleCloseLoginModal}
          />
      )}
    </div>
  );
}

export default App;