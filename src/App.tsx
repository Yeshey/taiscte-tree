// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import GenealogyTree from './components/GenealogyTree';
import ExportImport from './components/ExportImport';
import AccountIndicator from './components/auth/AccountIndicator';
import LoginModal from './components/auth/LoginModal';
import { demoData } from './data/demoData';
import { Person } from './types/models';
import { auth, database, isFirebaseAvailable, firebaseInitializationError } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { ref, get, set, DatabaseReference } from 'firebase/database'; // Import set

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
  // Defined useCallback here so it can be called from the Firebase status effect
  const fetchTreeData = useCallback(async () => {
    // Ensure database service is available (checked by isFirebaseAvailable)
    if (!database) {
        console.error("Database service unavailable during fetch attempt.");
        setWarningMessage("Error: Firebase Database service not initialized correctly.");
        setTreeData(demoData);
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
        // Basic validation: check if it's an array
        if (Array.isArray(dataFromDb) && dataFromDb.length > 0) {
            console.log("Data successfully fetched from Firebase DB.");
            setTreeData(dataFromDb);
            setDbDataStatus('loaded');
        } else if (Array.isArray(dataFromDb) && dataFromDb.length === 0) {
             console.log("Data node exists in Firebase DB but the array is empty.");
             setWarningMessage("Firebase connection successful. No tree members found yet. Displaying demo.");
             setTreeData(demoData); // Show demo if DB has an empty array
             setDbDataStatus('empty');
        }
         else {
             // Data exists but is wrong format
            console.warn("Data node exists in Firebase DB but is not an array:", dataFromDb);
            setWarningMessage("Data format error in Firebase. Displaying demo data.");
            setTreeData(demoData);
            setDbDataStatus('error'); // Treat format error as an error
        }
      } else {
        console.log("No data found at /treeData in Firebase DB.");
        setWarningMessage("Firebase connection successful, but no tree data found. Displaying demo data.");
        setTreeData(demoData);
        setDbDataStatus('empty');
      }
    } catch (error: any) {
      console.error("Error fetching data from Firebase DB:", error);
      if (error.code === 'PERMISSION_DENIED') {
           // This shouldn't happen with ".read": true, but good to keep
           setWarningMessage("Error fetching data: Permission denied. Check database rules. Displaying demo data.");
      } else {
           setWarningMessage(`Error fetching data: ${error.message}. Displaying demo data.`);
      }
      setTreeData(demoData);
      setDbDataStatus('error');
    }
  }, [/* No dependencies needed here, relies on external state/imports */]);


  // --- Firebase Initialization and Initial Data Fetch ---
  useEffect(() => {
    if (!isFirebaseAvailable) {
      console.error("Firebase Init Error:", firebaseInitializationError?.message || "Config invalid");
      setFirebaseStatus('config_error');
      setWarningMessage("Firebase configuration invalid or connection failed. Showing demo data. Export/Import still available locally.");
      setTreeData(demoData);
      setAuthLoading(false);
      setDbDataStatus('error');
    } else {
      setFirebaseStatus('available');
      // --- FETCH DATA HERE as soon as Firebase is available ---
      fetchTreeData();
      // Auth listener setup will happen in the next effect
    }
  }, [fetchTreeData]); // Added fetchTreeData as dependency


  // --- Auth State Listener ---
  useEffect(() => {
    // Only run if Firebase is available and auth instance exists
    if (firebaseStatus === 'available' && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user); // Update user state
        setAuthLoading(false); // Auth check complete
        console.log("Auth State Changed:", user ? `Logged in as ${user.email}` : "Logged out");
        // --- No need to fetch data or load demo data here anymore ---
        // Data is fetched initially, and we don't overwrite it on logout.
      });
      // Cleanup subscription on unmount
      return () => unsubscribe();
    } else if (firebaseStatus !== 'checking') {
        setAuthLoading(false);
    }
  }, [firebaseStatus]); // Depends only on firebaseStatus


  // --- Save Data Function (Helper for Import/Future Edits) ---
  const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => {
    if (!database || !currentUser) {
      console.error("Cannot save data: Database unavailable or user not logged in.");
      alert("Error: Cannot save data. Please ensure you are logged in and Firebase is connected.");
      return false; // Indicate failure
    }
    // Consider adding a loading state for saving
    console.log("Attempting to save data to Firebase...");
    try {
      const treeDataRef = ref(database, 'treeData');
      await set(treeDataRef, dataToSave);
      console.log("Data successfully saved to Firebase.");
      setWarningMessage("Tree data saved successfully."); // Optional success feedback
      setTimeout(() => setWarningMessage(null), 3000); // Clear message after 3s
      return true; // Indicate success
    } catch (error: any) {
      console.error("Error saving data to Firebase:", error);
       if (error.code === 'PERMISSION_DENIED') {
           alert("Error saving data: Permission denied. You might need to log in again or check permissions.");
       } else {
           alert(`Error saving data: ${error.message}`);
       }
      return false; // Indicate failure
    }
  }, [currentUser /* Depends on currentUser to check login status */]);

  // --- Other Handlers ---
  const handleImportData = async (data: Person[]) => {
    // Update local state immediately for responsiveness
    setTreeData(data);

    // Attempt to save to Firebase ONLY if logged in and available
    if (firebaseStatus === 'available' && currentUser) {
      await saveTreeDataToFirebase(data);
      // Optionally, refetch data after save to ensure consistency? Or trust local state.
      // fetchTreeData(); // Uncomment if you want to reload from DB after save
    } else {
        // If not logged in, remind user data is local only
        setWarningMessage("Data imported locally. Log in to save to the shared tree.");
        // Optionally clear warning after a delay
         setTimeout(() => {
            if (warningMessage === "Data imported locally. Log in to save to the shared tree.") {
                setWarningMessage(null);
            }
         }, 5000);
    }
  };

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
        {firebaseStatus !== 'config_error' && auth && (
            <AccountIndicator
                currentUser={currentUser}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
            />
        )}

        <h1>Genealogia TAISCTE</h1>

        {warningMessage && (
          <div className={`firebase-warning ${dbDataStatus === 'error' || firebaseStatus === 'config_error' ? 'error' : ''}`}>
            <p>{warningMessage}</p>
          </div>
        )}

        <ExportImport
          onImport={handleImportData}
          onExport={handleExportData}
          // Pass login status to potentially disable import button/label visually
          isUserLoggedIn={!!currentUser}
          isFirebaseAvailable={firebaseStatus === 'available'}
        />
        <div className="tree-container">
          {/* Show loading only during initial DB fetch */}
          {(dbDataStatus === 'loading' && firebaseStatus === 'available') ? (
             <div className="loading">Loading tree data from Firebase...</div>
          ) : (
             <GenealogyTree data={treeData} />
          )}
        </div>

      </header>

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