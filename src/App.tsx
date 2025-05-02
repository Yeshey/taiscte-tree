// src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import GenealogyTree from './components/GenealogyTree';
import ExportImport, { validateAndNormalizePersonData } from './components/ExportImport';
import AccountIndicator from './components/auth/AccountIndicator';
import LoginModal from './components/auth/LoginModal';
import SignUpModal from './components/auth/SignUpModal';
import Modal from './components/Modal';
import PersonForm from './components/PersonForm';
import { demoData } from './data/demoData'; // Ensure this data is valid!
import { Person } from './types/models';
import { auth, database, isFirebaseAvailable, firebaseInitializationError } from './firebase';
import { onAuthStateChanged, User, signOut, sendEmailVerification } from 'firebase/auth';
import { ref, get, set, DatabaseReference } from 'firebase/database';
import * as AppStrings from './constants/strings'; // Import Strings
import PersonDetailsModal from 'components/PersonDetailsModal';

type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available';
type DbDataStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
type EditMode = 'add' | 'edit';

// Helper Function to compare dates (ignoring day for month comparison)
const isDateOlderThanYears = (dateStr: string | undefined, years: number): boolean => {
  if (!dateStr) return false;
  try {
      const date = new Date(dateStr + 'T00:00:00'); // Assume YYYY-MM-DD
      if (isNaN(date.getTime())) return false;
      const thresholdDate = new Date();
      thresholdDate.setFullYear(thresholdDate.getFullYear() - years);
      // Optional: Compare only year and month if needed, but direct compare is fine
      return date < thresholdDate;
  } catch {
      return false;
  }
};

// --- Validate demo data on initial load ---
const initialValidatedDemoData = validateAndNormalizePersonData(demoData).validData || [];

function App() {
  // --- Initialize treeData with validated demo data ---
  const [treeData, setTreeData] = useState<Person[]>(initialValidatedDemoData);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true); // Still track auth check
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState<boolean>(false);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatus>('checking');
  const [dbDataStatus, setDbDataStatus] = useState<DbDataStatus>('idle');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [verificationWarning, setVerificationWarning] = useState<string | null>(null);
  const [resendCooldownActive, setResendCooldownActive] = useState(false);
  const [resendStatusMessage, setResendStatusMessage] = useState<string | null>(null);
  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [parentForNewPersonId, setParentForNewPersonId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('add');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isGenericConfirmOpen, setIsGenericConfirmOpen] = useState(false);
  const [genericConfirmMessage, setGenericConfirmMessage] = useState<string>('');
  const [onGenericConfirm, setOnGenericConfirm] = useState<(() => void) | null>(null);
  const [pendingSubmitData, setPendingSubmitData] = useState<Omit<Person, 'id' | 'children'> & { id?: string } | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPersonForDetails, setSelectedPersonForDetails] = useState<Person | null>(null);

  // --- Memoized Dropdown Options ---
  const naipeOptions: string[] = useMemo(() => { // Add : string[]
    const naipes = new Set(treeData.map(p => p.naipeVocal).filter(Boolean) as string[]);
    return Array.from(naipes).sort();
  }, [treeData]);
  
  const instrumentOptions: string[] = useMemo(() => { // Add : string[]
    const instruments = new Set<string>();
    treeData.forEach(p => {
        if (p.mainInstrument) instruments.add(p.mainInstrument);
        p.otherInstruments?.forEach(inst => instruments.add(inst));
    });
    return Array.from(instruments).sort();
  }, [treeData]);

  const hierarchyOptions: string[] = useMemo(() => { // Add : string[]
    const currentHierarchy = new Set(treeData.map(p => p.hierarquia).filter(Boolean) as string[]);
    const options = new Set<string>(AppStrings.HIERARCHIA_BASE_LEVELS.map(l => l.defaultName));
    currentHierarchy.forEach(h => options.add(h));
    return Array.from(options).sort((a, b) => {
        // Try to sort based on base levels order, custom ones at end
        const indexA = AppStrings.HIERARCHIA_BASE_LEVELS.findIndex(l => l.defaultName === a);
        const indexB = AppStrings.HIERARCHIA_BASE_LEVELS.findIndex(l => l.defaultName === b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1; // Base levels first
        if (indexB !== -1) return 1;
        return a.localeCompare(b); // Sort custom alphabetically
    });
  }, [treeData]);

    const padrinhoOptions: { id: string, name: string }[] = useMemo(() => { // Add explicit type
      const potentialPadrinhos = treeData.filter(p => p.id !== personToEdit?.id);
      return potentialPadrinhos.map(p => ({ id: p.id, name: p.name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [treeData, personToEdit]);


  // --- Data Fetching (Keep as is) ---
  const fetchTreeData = useCallback(async () => {
      if (!database) {
        console.error("Database service unavailable during fetch attempt.");
        setWarningMessage(AppStrings.FIREBASE_DB_UNAVAILABLE);
        const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
        setTreeData(validatedDemoData || []); // Ensure fallback is valid
        setDbDataStatus('error'); return;
      }
      const treeDataRef: DatabaseReference = ref(database, 'treeData');
      setDbDataStatus('loading'); setWarningMessage(null); // Show loading in tree area
      try {
        console.log("Attempting to fetch data from Firebase DB...");
        const snapshot = await get(treeDataRef);
        if (snapshot.exists()) {
            const dataFromDb = snapshot.val();
            const { validData, errors } = validateAndNormalizePersonData(dataFromDb);
            if (validData) {
                console.log("Data successfully fetched and validated from Firebase DB.");
                setTreeData(validData); setDbDataStatus('loaded');
                if (errors.length > 0) { console.warn("Minor validation issues found in Firebase data:", errors); }
            } else {
                console.error("Validation failed for data fetched from Firebase:", errors);
                setWarningMessage(AppStrings.FIREBASE_DATA_ERROR(errors.join(', ')));
                const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
                setTreeData(validatedDemoData || []); setDbDataStatus('error');
            }
        } else {
            console.log("No data found at /treeData in Firebase DB.");
            setWarningMessage(AppStrings.FIREBASE_DATA_EMPTY_NODE);
            const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
            setTreeData(validatedDemoData || []); setDbDataStatus('empty');
        }
      } catch (error: any) {
            console.error("Error fetching data from Firebase DB:", error);
            if (error.code === 'PERMISSION_DENIED') { setWarningMessage(AppStrings.FIREBASE_FETCH_PERMISSION_ERROR); }
            else { setWarningMessage(AppStrings.FIREBASE_FETCH_ERROR(error.message)); }
            const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
            setTreeData(validatedDemoData || []); setDbDataStatus('error');
      }
   }, []);

  // --- Firebase Init (Fetch data on available status) ---
  useEffect(() => {
    if (!isFirebaseAvailable) {
      console.error("Firebase Init Error:", firebaseInitializationError?.message || "Config invalid");
      setFirebaseStatus('config_error');
      setWarningMessage(AppStrings.FIREBASE_CONFIG_ERROR);
      // Already initialized with demo data, just set status
      setAuthLoading(false); // Stop auth loading
      setDbDataStatus('error'); // DB cannot be used
    } else {
      setFirebaseStatus('available');
      // Trigger data fetch *after* setting status to available
      fetchTreeData();
    }
  }, [fetchTreeData]); // Depend on fetchTreeData

  // --- Auth State Listener (Keep as is) ---
  useEffect(() => {
    if (firebaseStatus === 'available' && auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthLoading(false);
            console.log("Auth State Changed:", user ? `Logged in as ${user.email}` : "Logged out");
            if (user && !user.emailVerified) {
                setVerificationWarning(AppStrings.VERIFICATION_WARNING);
                setResendStatusMessage(null);
            } else {
                setVerificationWarning(null);
                setResendStatusMessage(null);
            }
        });
        return () => unsubscribe();
    } else if (firebaseStatus !== 'checking') {
        // If Firebase init failed or finished checking, ensure auth loading stops
        setAuthLoading(false);
    }
  }, [firebaseStatus]); // Runs when firebaseStatus changes


  // --- Tuno Check Effect ---
  useEffect(() => {
    if (firebaseStatus === 'available' && currentUser && dbDataStatus === 'loaded') { // Only run when data loaded and logged in
        const tunosNeedingReview = treeData.filter(p =>
            p.hierarquia === 'Tuno' // Or compare with HIERARCHIA_BASE_LEVELS[2].defaultName
            && isDateOlderThanYears(p.passagemTunoDate, 2)
        );

        if (tunosNeedingReview.length > 0) {
             // Use a general warning, specific modal might be too intrusive on every load
             // Alternatively, store dismissed warnings in localStorage
             const names = tunosNeedingReview.map(p => p.name).join(', ');
             setWarningMessage(`Review Needed: ${names} ${tunosNeedingReview.length > 1 ? 'have' : 'has'} been 'Tuno' for over 2 years.`);
             // In a real app, clicking this warning could highlight the nodes or open a specific review list
        }
    }
}, [treeData, currentUser, firebaseStatus, dbDataStatus]); // Rerun when data/user changes

    // --- Handler to Resend Verification Email ---
    const handleResendVerificationEmail = async () => {
      if (!currentUser || resendCooldownActive || !auth || !currentUser.emailVerified === false) {
          // Don't resend if not logged in, on cooldown, auth unavailable, or already verified
          return;
      }
  
      setResendCooldownActive(true);
      setResendStatusMessage("Sending verification email..."); // Indicate sending
  
      try {
        await sendEmailVerification(currentUser);
        setResendStatusMessage("New verification email sent! Check your inbox/spam.");
        // Keep main warning visible, just update status temporarily
         setTimeout(() => {
             // Clear only the status message after a few seconds
             setResendStatusMessage(null);
         }, 6000); // Clear status message after 6s
      } catch (error: any) {
        console.error("Error resending verification:", error);
        setResendStatusMessage(`Failed to send email: ${error.message || 'Unknown error'}`);
         setTimeout(() => {
             // Clear error message after a few seconds
             setResendStatusMessage(null);
         }, 6000);
      } finally {
        // Set cooldown timer regardless of success/failure
        setTimeout(() => setResendCooldownActive(false), 10000); // 10 second cooldown
      }
    };
  
    // --- Save Data Function (Keep as is) ---
    const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => { /* ... Same save logic ... */
       if (!database || !currentUser) { console.error("Cannot save data: Database unavailable or user not logged in."); alert("Error: Cannot save data. Please ensure you are logged in and Firebase is connected."); return false; }
      const { validData, errors } = validateAndNormalizePersonData(dataToSave);
      if (!validData) { console.error("Cannot save: Data failed validation.", errors); alert(`Cannot save: Invalid data format detected.\n- ${errors.join('\n- ')}`); return false; }
      console.log("Attempting to save data to Firebase...");
      try {
        const treeDataRef = ref(database, 'treeData');
        await set(treeDataRef, validData);
        console.log("Data successfully saved to Firebase.");
        setWarningMessage("Tree data saved successfully.");
        setTimeout(() => setWarningMessage(null), 3000);
        return true;
      } catch (error: any) {
        console.error("Error saving data to Firebase:", error);
         if (error.code === 'PERMISSION_DENIED') { alert("Error saving data: Permission denied. You might need to log in again or check permissions."); }
         else { alert(`Error saving data: ${error.message}`); }
        return false;
      }
    }, [currentUser]);
  
    // --- Import/Export Handlers (Keep as is) ---
    const handleImportData = async (data: Person[]) => { /* ... Same import logic ... */
         setTreeData(data); // Update local state
      if (firebaseStatus === 'available' && currentUser) {
        await saveTreeDataToFirebase(data);
      } else if (firebaseStatus === 'available') {
          setWarningMessage("Data imported locally. Log in to save to the shared tree.");
           setTimeout(() => { if (warningMessage === "Data imported locally. Log in to save to the shared tree.") { setWarningMessage(null); } }, 5000);
      }
    };
    const handleExportData = () => { return treeData; };
  
    // --- Login/Logout Handlers (Keep as is) ---
  
    const handleLoginClick = () => {
      if (firebaseStatus === 'config_error') {
         alert("Login unavailable: Firebase is not configured correctly.");
         return;
      }
     setIsLoginModalOpen(true);
    };
  
    const handleLogoutClick = async () => {
      // Add a log to check the auth object just before signing out
      console.log("Attempting logout. Auth object:", auth);
  
      if (!auth) {
          console.error("Logout failed: Firebase auth object is null.");
          alert("Logout failed: Authentication service unavailable.");
          return; // Explicitly return if auth is null
      }
      try {
        await signOut(auth);
        // User state will update via the onAuthStateChanged listener
        console.log("Sign out successful via Firebase.");
        // Optionally clear local state that shouldn't persist after logout
        // setTreeData(demoData); // Decide if you want to reset view on logout
        // setWarningMessage(null); // Clear any previous warnings
      } catch (error: any) {
        console.error("Logout Error:", error);
        alert(`Logout failed: ${error.message || 'Unknown error'}`);
      }
    };
  
    const handleCloseLoginModal = () => {
      setIsLoginModalOpen(false);
    };
  
    // --- New Sign Up Handlers ---
    const handleSignUpClick = () => {
      if (firebaseStatus === 'config_error') {
          alert("Sign up unavailable: Firebase is not configured correctly.");
          return;
      }
      setIsSignUpModalOpen(true);
      setIsLoginModalOpen(false); // Close login if open
    };
  
    const handleCloseSignUpModal = () => { setIsSignUpModalOpen(false); };
  
    // --- Switch between Login/Sign Up Modals ---
    const handleSwitchToLogin = () => {
        setIsSignUpModalOpen(false);
        setIsLoginModalOpen(true);
    };
    const handleSwitchToSignUp = () => {
        setIsLoginModalOpen(false);
        setIsSignUpModalOpen(true);
    };
    // --- End Sign Up Handlers ---
  
    // --- NEW: Add/Edit/Delete Person Handlers ---
  
    // Opens the form to ADD a new person under the given parent
    const handleAddPersonClick = (parentId: string) => {
      if (!currentUser) return; // Only logged-in users
      setParentForNewPersonId(parentId);
      setPersonToEdit(null); // Ensure not in edit mode
      setEditMode('add');
      setIsPersonFormOpen(true);
    };
  
     // Opens the form to EDIT an existing person
    const handleEditPersonClick = (person: Person) => {
      if (!currentUser) return; // Only logged-in users
      setPersonToEdit(person);
      setParentForNewPersonId(null); // Ensure not in add mode
      setEditMode('edit');
      setIsPersonFormOpen(true);
    };
  
    // Handles submission from the PersonForm (both add and edit)
    const handlePersonFormSubmit = (
      personFormData: Omit<Person, 'id' | 'parents' | 'children' | 'spouses'> & { id?: string }
    ) => {
      let updatedTreeData = [...treeData]; // Create a copy
  
      if (editMode === 'edit' && personFormData.id) {
          // --- EDIT existing person ---
          const personIndex = updatedTreeData.findIndex(p => p.id === personFormData.id);
          if (personIndex !== -1) {
              const originalPerson = updatedTreeData[personIndex];
              // Merge existing relational data with form data
              updatedTreeData[personIndex] = {
                  ...originalPerson, // Keep existing parents, children, spouses
                  ...personFormData, // Overwrite with form data
              };
               console.log("Editing person:", updatedTreeData[personIndex]);
          } else {
               console.error("Person to edit not found!");
               return; // Should not happen
          }
  
      } else if (editMode === 'add' && parentForNewPersonId) {
          // --- ADD new person ---
          const parentIndex = updatedTreeData.findIndex(p => p.id === parentForNewPersonId);
          if (parentIndex === -1) {
               console.error("Parent for new person not found!");
               return; // Should not happen
          }
  
          const newPerson: Person = {
              ...personFormData, // Data from form
              id: crypto.randomUUID(), // Generate unique ID (ensure browser support or use uuid lib)
              children: [], // New person starts with no children
          };
  
          // Add the new person to the data array
          updatedTreeData.push(newPerson);
          // Add the new person's ID to the parent's children array
          updatedTreeData[parentIndex] = {
              ...updatedTreeData[parentIndex],
              children: [...updatedTreeData[parentIndex].children, newPerson.id]
          };
           console.log("Adding new person:", newPerson);
      } else {
          console.error("Invalid state for form submission.");
          return;
      }
  
      // Update state and save to Firebase
      setTreeData(updatedTreeData);
      if (firebaseStatus === 'available' && currentUser) {
          saveTreeDataToFirebase(updatedTreeData);
      }
      setIsPersonFormOpen(false); // Close form
      setPersonToEdit(null);
      setParentForNewPersonId(null);
    };
  
    // Opens the delete confirmation modal
    const handleDeletePersonClick = (personId: string, personName: string) => {
       if (!currentUser) return; // Only logged-in users
       setPersonToDelete({ id: personId, name: personName });
       setIsDeleteConfirmOpen(true);
    };
  
    // Handles the actual deletion after confirmation
    const handleConfirmDelete = () => {
      if (!personToDelete) return;
      const { id: personIdToDelete } = personToDelete;
  
      // 1. Filter out the person to be deleted
      let updatedTreeData = treeData.filter(person => person.id !== personIdToDelete);
  
      // 2. Remove references to the deleted person from others
      updatedTreeData = updatedTreeData.map(person => ({
        ...person,
        children: person.children.filter(id => id !== personIdToDelete),
      }));
  
       console.log("Deleting person:", personIdToDelete);
  
      // Update state and save to Firebase
      setTreeData(updatedTreeData);
      if (firebaseStatus === 'available' && currentUser) {
        saveTreeDataToFirebase(updatedTreeData);
      }
      setIsDeleteConfirmOpen(false);
      setPersonToDelete(null);
    };  

    const handleNodeClick = (person: Person) => {
      setSelectedPersonForDetails(person);
      setIsDetailsModalOpen(true);
    };
  
    const handleCloseDetailsModal = () => {
      setIsDetailsModalOpen(false);
      setSelectedPersonForDetails(null); // Clear selected person
    };

  // --- Render Logic ---

  // Only show full page loading while checking Firebase config
  if (firebaseStatus === 'checking') {
    return (
      <div className="App">
        <header className="App-header">
          <div className="loading">Initializing...</div>
        </header>
      </div>
    );
  }

  // Render main app structure once Firebase check is done
  return (
    <div className="App">
      <header className="App-header">
        {/* Account Indicator */}
        {firebaseStatus !== 'config_error' && auth && (<AccountIndicator {...{ currentUser, onLoginClick: handleLoginClick, onLogoutClick: handleLogoutClick, onSignUpClick: handleSignUpClick }}/> )}
        {authLoading && firebaseStatus !== 'config_error' && <div style={{position: 'absolute', top: '15px', right: '20px', zIndex: 110}}>Loading User...</div>}

        <h1>Família TAISCTE</h1>

        {/* Warnings */}
        {verificationWarning && !warningMessage && ( <div className="firebase-warning warning"> <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '5px' }}> <span>{verificationWarning}</span> {currentUser && !currentUser.emailVerified && ( <button onClick={handleResendVerificationEmail} disabled={resendCooldownActive} style={styles.resendLinkButton} title={resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT}> {resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT} </button> )} </p> {resendStatusMessage && ( <p style={{fontSize: '0.8em', marginTop: '5px', color: resendStatusMessage.startsWith('Failed') ? 'red' : 'green' }}> {resendStatusMessage} </p> )} </div> )}
        {warningMessage && ( <div className={`firebase-warning ${dbDataStatus === 'error' || firebaseStatus === 'config_error' ? 'error' : ''}`}><p>{warningMessage}</p></div> )}

        <ExportImport {...{ onImport: handleImportData, onExport: handleExportData, isUserLoggedIn: !!currentUser, isFirebaseAvailable: firebaseStatus === 'available' }} />

        <div className="tree-container">
          {(dbDataStatus === 'loading' && firebaseStatus === 'available') ? ( <div className="loading">Loading tree data from Firebase...</div> ) : (
             <GenealogyTree
                data={treeData}
                allPeople={treeData}
                onAddPersonClick={handleAddPersonClick}
                onDeletePersonClick={handleDeletePersonClick}
                onEditPersonClick={handleEditPersonClick}
                isUserLoggedIn={!!currentUser && (currentUser?.emailVerified ?? false)}
                onNodeClick={handleNodeClick} // <-- Pass the node click handler
             />
          )}
        </div>
      </header>

      {/* Modals */}
      {firebaseStatus !== 'config_error' && (<LoginModal {...{isOpen: isLoginModalOpen, onClose: handleCloseLoginModal, onSwitchToSignUp: handleSwitchToSignUp}} />)}
      {firebaseStatus !== 'config_error' && (<SignUpModal {...{isOpen: isSignUpModalOpen, onClose: handleCloseSignUpModal, onSwitchToLogin: handleSwitchToLogin}} />)}
      <PersonForm
          isOpen={isPersonFormOpen}
          onClose={() => setIsPersonFormOpen(false)}
          onSubmit={handlePersonFormSubmit}
          initialData={personToEdit}
          formTitle={editMode === 'edit' ? 'Edit Person' : 'Add New Afilhado'}
          naipeOptions={naipeOptions} instrumentOptions={instrumentOptions} hierarchyOptions={hierarchyOptions} padrinhoOptions={padrinhoOptions}
          isEditMode={editMode === 'edit'}
      />
      <Modal {...{isOpen: isDeleteConfirmOpen, onClose: () => setIsDeleteConfirmOpen(false), onConfirm: handleConfirmDelete, title: AppStrings.CONFIRM_DELETE_TITLE, confirmText:"Delete", cancelText:"Cancel" }}>
          <p>{AppStrings.CONFIRM_DELETE_MSG(personToDelete?.name || 'this person')}</p>
      </Modal>
      <Modal isOpen={isGenericConfirmOpen} onClose={() => { setIsGenericConfirmOpen(false); setPendingSubmitData(null); setOnGenericConfirm(null); }} onConfirm={() => { if (onGenericConfirm) { onGenericConfirm(); } setIsGenericConfirmOpen(false); }} title="Confirm Action" confirmText="Continue" cancelText="Cancel" >
           <p>{genericConfirmMessage}</p>
      </Modal>

      {/* --- Render Details Modal --- */}
      <PersonDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        person={selectedPersonForDetails}
        allPeople={treeData} // Pass all people for lookup
      />

    </div>
  );
}

// Keep styles or move to CSS
const styles: { [key: string]: React.CSSProperties } = {
    resendLinkButton: { background: 'none', border: 'none', color: '#0056b3', textDecoration: 'underline', cursor: 'pointer', padding: '0 5px', fontSize: 'inherit', marginLeft: '5px', },
};

export default App;