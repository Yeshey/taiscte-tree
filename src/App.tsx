// src/App.tsx
// --- START OF RELEVANT App.tsx SECTION ---
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
      return date < thresholdDate;
  } catch {
      return false;
  }
};

// --- Validate demo data on initial load ---
const { validData: initialValidatedDemoData, errors: demoErrors } = validateAndNormalizePersonData(demoData);
if (!initialValidatedDemoData) {
    console.error("FATAL: Demo data is invalid!", demoErrors);
    // Handle this critical error, maybe show an error message instead of the app
}

function App() {
  // --- Initialize treeData with validated demo data ---
  const [treeData, setTreeData] = useState<Person[]>(initialValidatedDemoData || []); // Fallback to empty array if demo is somehow invalid
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
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
  const [parentForNewPersonId, setParentForNewPersonId] = useState<string | null>(null); // ID of the person under whom we are adding
  const [editMode, setEditMode] = useState<EditMode>('add');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isGenericConfirmOpen, setIsGenericConfirmOpen] = useState(false);
  const [genericConfirmMessage, setGenericConfirmMessage] = useState<string>('');
  const [onGenericConfirm, setOnGenericConfirm] = useState<(() => void) | null>(null);
  const [pendingSubmitData, setPendingSubmitData] = useState<Omit<Person, 'id' | 'children' | 'padrinhoId'> & { id?: string } | null>(null); // Adjusted type
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPersonForDetails, setSelectedPersonForDetails] = useState<Person | null>(null);

  // --- Memoized Dropdown Options ---
  const familyNameOptions: string[] = useMemo(() => {
    // familyName is required, so filter(Boolean) is sufficient or just map directly
    const names = new Set(treeData.map(p => p.familyName));
    return Array.from(names).sort();
  }, [treeData]);

  const naipeOptions: string[] = useMemo(() => {
    // Use a type predicate to filter out undefined and assure TypeScript
    const naipes = new Set(
        treeData
            .map(p => p.naipeVocal)
            .filter((n): n is string => typeof n === 'string' && n !== '') // Ensures only non-empty strings remain
    );
    return Array.from(naipes).sort();
  }, [treeData]);

  const instrumentOptions: string[] = useMemo(() => {
    const instruments = new Set<string>();
    treeData.forEach(p => {
        // Use type guard for mainInstrument
        if (p.mainInstrument && typeof p.mainInstrument === 'string') {
             instruments.add(p.mainInstrument);
        }
        // Ensure otherInstruments is an array of strings
        p.otherInstruments?.forEach(inst => {
            if(typeof inst === 'string' && inst !== '') {
                instruments.add(inst)
            }
        });
    });
    return Array.from(instruments).sort();
  }, [treeData]);

  const hierarchyOptions: string[] = useMemo(() => {
    // Use a type predicate to filter out undefined and assure TypeScript
    const currentHierarchy = treeData
        .map(p => p.hierarquia)
        .filter((h): h is string => typeof h === 'string' && h !== ''); // Ensures only non-empty strings

    const options = new Set<string>(AppStrings.HIERARCHIA_BASE_LEVELS.map(l => l.defaultName));

    // Now currentHierarchy is guaranteed to be string[]
    currentHierarchy.forEach(h => options.add(h)); // This is now safe

    return Array.from(options).sort((a, b) => {
        const indexA = AppStrings.HIERARCHIA_BASE_LEVELS.findIndex(l => l.defaultName === a);
        const indexB = AppStrings.HIERARCHIA_BASE_LEVELS.findIndex(l => l.defaultName === b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
  }, [treeData]);

    // --- Padrinho Options Removed ---

  // --- Data Fetching ---
  const fetchTreeData = useCallback(async () => {
      if (!database) {
        console.error("Database service unavailable during fetch attempt.");
        setWarningMessage(AppStrings.FIREBASE_DB_UNAVAILABLE);
        const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
        setTreeData(validatedDemoData || []);
        setDbDataStatus('error'); return;
      }
      const treeDataRef: DatabaseReference = ref(database, 'treeData');
      setDbDataStatus('loading'); setWarningMessage(null);
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
            console.log("No data found at /treeData in Firebase DB. Using demo data.");
            setWarningMessage("No data in Firebase, showing default tree.");
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

  // --- Firebase Init ---
  useEffect(() => {
    if (!isFirebaseAvailable) {
      console.error("Firebase Init Error:", firebaseInitializationError?.message || "Config invalid");
      setFirebaseStatus('config_error');
      setWarningMessage(AppStrings.FIREBASE_CONFIG_ERROR);
      setAuthLoading(false);
      setDbDataStatus('error');
      setTreeData(initialValidatedDemoData || []);
    } else {
      setFirebaseStatus('available');
      fetchTreeData();
    }
  }, [fetchTreeData]);

  // --- Auth State Listener ---
  useEffect(() => {
    if (firebaseStatus === 'available' && auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthLoading(false);
            console.log("Auth State Changed:", user ? `Logged in as ${user.email} (Verified: ${user.emailVerified})` : "Logged out");
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
        setAuthLoading(false);
    }
  }, [firebaseStatus]);

  // --- Tuno Check Effect ---
  useEffect(() => {
    if (firebaseStatus === 'available' && currentUser && dbDataStatus === 'loaded') {
        const tunoDefaultName = AppStrings.HIERARCHIA_BASE_LEVELS.find(l => l.key === 'tuno')?.defaultName;
        const tunosNeedingReview = treeData.filter(p =>
            p.hierarquia === tunoDefaultName
            && isDateOlderThanYears(p.passagemTunoDate, 2)
        );

        if (tunosNeedingReview.length > 0) {
             const names = tunosNeedingReview.map(p => p.name).join(', ');
             const reviewMsg = `Review Needed: ${names} ${tunosNeedingReview.length > 1 ? 'have' : 'has'} been 'Tuno' for over 2 years.`;
             setWarningMessage((prev) => prev ? `${prev}\n${reviewMsg}` : reviewMsg);
        }
    }
}, [treeData, currentUser, firebaseStatus, dbDataStatus]);

    // --- Resend Verification ---
    const handleResendVerificationEmail = async () => {
      if (!currentUser || resendCooldownActive || !auth || currentUser.emailVerified) return;

      setResendCooldownActive(true);
      setResendStatusMessage(AppStrings.VERIFICATION_SENDING);

      try {
        await sendEmailVerification(currentUser);
        setResendStatusMessage(AppStrings.VERIFICATION_SENT);
         setTimeout(() => setResendStatusMessage(null), 6000);
      } catch (error: any) {
        console.error("Error resending verification:", error);
        setResendStatusMessage(AppStrings.VERIFICATION_FAILED(error.message || 'Unknown error'));
         setTimeout(() => setResendStatusMessage(null), 6000);
      } finally {
        setTimeout(() => setResendCooldownActive(false), 10000);
      }
    };

    // --- Save Data Function ---
    const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => {
       if (!database || !currentUser) { console.error("Cannot save data: Database unavailable or user not logged in."); alert(AppStrings.SAVE_UNAVAILABLE); return false; }
       if (!currentUser.emailVerified) { alert("Cannot save data: Email not verified. Please verify your email first."); return false; }

       console.log("Validating data before saving...");
       const { validData, errors } = validateAndNormalizePersonData(dataToSave);

       if (!validData) {
           console.error("Cannot save: Data failed validation.", errors);
           alert(AppStrings.SAVE_FAILED_INVALID_DATA(errors));
           return false;
       }
        if (errors.length > 0) {
             console.warn("Saving data with minor validation warnings:", errors);
         }

      console.log("Attempting to save validated data to Firebase...");
      try {
        const treeDataRef = ref(database, 'treeData');
        await set(treeDataRef, validData);
        console.log("Data successfully saved to Firebase.");
        setWarningMessage(AppStrings.SAVE_SUCCESS);
        setTimeout(() => setWarningMessage(null), 3000);
        return true;
      } catch (error: any) {
        console.error("Error saving data to Firebase:", error);
         if (error.code === 'PERMISSION_DENIED') { alert(AppStrings.SAVE_FAILED_PERMISSION); }
         else { alert(AppStrings.SAVE_FAILED_GENERAL(error.message)); }
        return false;
      }
    }, [currentUser]);

    // --- Import/Export Handlers ---
    const handleImportData = async (data: Person[]) => {
         console.log("Importing validated data locally.");
         setTreeData(data);
         if (firebaseStatus === 'available' && currentUser && currentUser.emailVerified) {
            console.log("User logged in and verified, attempting to save imported data to Firebase...");
            await saveTreeDataToFirebase(data);
         } else if (firebaseStatus === 'available' && currentUser && !currentUser.emailVerified) {
              setWarningMessage("Data imported locally. Verify your email to save changes to the shared tree.");
              setTimeout(() => { if (warningMessage?.startsWith("Data imported locally.")) { setWarningMessage(null); } }, 5000);
         } else if (firebaseStatus === 'available') {
             setWarningMessage(AppStrings.IMPORT_LOCAL_WARNING);
             setTimeout(() => { if (warningMessage === AppStrings.IMPORT_LOCAL_WARNING) { setWarningMessage(null); } }, 5000);
         }
    };
    const handleExportData = () => { return treeData; };

    // --- Login/Logout Handlers ---
    const handleLoginClick = () => {
      if (firebaseStatus === 'config_error') { alert(AppStrings.LOGIN_UNAVAILABLE); return; }
     setIsLoginModalOpen(true);
    };

    const handleLogoutClick = async () => {
      console.log("Attempting logout. Auth object:", auth);
      if (!auth) { console.error("Logout failed: Firebase auth object is null."); alert(AppStrings.AUTH_SERVICE_UNAVAILABLE); return; }
      try {
        await signOut(auth);
        console.log("Sign out successful via Firebase.");
      } catch (error: any) {
        console.error("Logout Error:", error);
        alert(AppStrings.LOGOUT_FAILED(error.message || 'Unknown error'));
      }
    };
    const handleCloseLoginModal = () => { setIsLoginModalOpen(false); };

    // --- Sign Up Handlers ---
    const handleSignUpClick = () => {
      if (firebaseStatus === 'config_error') { alert(AppStrings.SIGNUP_UNAVAILABLE); return; }
      setIsSignUpModalOpen(true);
      setIsLoginModalOpen(false);
    };
    const handleCloseSignUpModal = () => { setIsSignUpModalOpen(false); };

    // --- Switch between Modals ---
    const handleSwitchToLogin = () => { setIsSignUpModalOpen(false); setIsLoginModalOpen(true); };
    const handleSwitchToSignUp = () => { setIsLoginModalOpen(false); setIsSignUpModalOpen(true); };

    // --- Add/Edit/Delete Person Handlers ---
    const handleAddPersonClick = (padrinhoId: string) => {
      if (!currentUser) return;
      if (!currentUser.emailVerified) { alert("Cannot add: Email not verified."); return; }
      console.log(`Setting parent for new person: ${padrinhoId}`);
      setParentForNewPersonId(padrinhoId);
      setPersonToEdit(null);
      setEditMode('add');
      setIsPersonFormOpen(true);
    };

    const handleEditPersonClick = (person: Person) => {
      if (!currentUser) return;
      if (!currentUser.emailVerified) { alert("Cannot edit: Email not verified."); return; }
      setPersonToEdit(person);
      setParentForNewPersonId(null);
      setEditMode('edit');
      setIsPersonFormOpen(true);
    };

    const handlePersonFormSubmit = (
      personFormData: Omit<Person, 'id' | 'children' | 'padrinhoId'> & { id?: string }
    ) => {
      let updatedTreeData = [...treeData];

      if (editMode === 'edit' && personFormData.id) {
          const personIndex = updatedTreeData.findIndex(p => p.id === personFormData.id);
          if (personIndex !== -1) {
              const originalPerson = updatedTreeData[personIndex];
              updatedTreeData[personIndex] = {
                  ...originalPerson,
                  ...personFormData,
              };
               console.log("Editing person:", updatedTreeData[personIndex]);
          } else {
               console.error("Person to edit not found!"); return;
          }

      } else if (editMode === 'add' && parentForNewPersonId) {
          const parentIndex = updatedTreeData.findIndex(p => p.id === parentForNewPersonId);
          if (parentIndex === -1) {
               console.error(`Parent (Padrinho) with ID ${parentForNewPersonId} for new person not found!`);
               alert(`Error: Could not find the Padrinho/Madrinha in the current tree data.`);
               return;
          }

          const newPerson: Person = {
              ...personFormData,
              id: crypto.randomUUID(),
              padrinhoId: parentForNewPersonId, // Set the padrinhoId correctly
              children: [],
          };

          updatedTreeData.push(newPerson);
          updatedTreeData[parentIndex] = {
              ...updatedTreeData[parentIndex],
              children: [...updatedTreeData[parentIndex].children, newPerson.id]
          };
           console.log("Adding new person:", newPerson, "under Padrinho:", parentForNewPersonId);
      } else {
          console.error("Invalid state for form submission (editMode or parentForNewPersonId missing).");
          alert("Error: Could not determine whether to add or edit person.");
          return;
      }

      setTreeData(updatedTreeData);

      if (firebaseStatus === 'available' && currentUser && currentUser.emailVerified) {
          saveTreeDataToFirebase(updatedTreeData);
      } else {
           setWarningMessage("Changes saved locally. Log in and verify email to save to the shared tree.");
           setTimeout(() => { if (warningMessage?.startsWith("Changes saved locally.")) { setWarningMessage(null); } }, 5000);
      }

      setIsPersonFormOpen(false);
      setPersonToEdit(null);
      setParentForNewPersonId(null);
    };

    const handleDeletePersonClick = (personId: string, personName: string) => {
       if (!currentUser) return;
       if (!currentUser.emailVerified) { alert("Cannot delete: Email not verified."); return; }
       setPersonToDelete({ id: personId, name: personName });
       setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
      if (!personToDelete) return;
      const { id: personIdToDelete } = personToDelete;

      let parentPerson: Person | null = null;
      const childPerson = treeData.find(p => p.id === personIdToDelete) ?? null; // Keep 'const' if not reassigned

       // 1. Find the parent (Padrinho) of the person being deleted
       // Ensure childPerson exists AND has a padrinhoId before trying to find the parent
      if (childPerson && childPerson.padrinhoId) {
           parentPerson = treeData.find(p => p.id === childPerson.padrinhoId) ?? null;
      }

      const childrenOfDeleted = treeData.filter(p => p.padrinhoId === personIdToDelete);
      let updatedTreeData = treeData.filter(person => person.id !== personIdToDelete);

      if (parentPerson) {
          updatedTreeData = updatedTreeData.map(p =>
              p.id === parentPerson!.id
                  ? { ...p, children: p.children.filter(id => id !== personIdToDelete) }
                  : p
          );
      }

      if (childrenOfDeleted.length > 0) {
          const childrenIdsToDeletePadrinho = new Set(childrenOfDeleted.map(c => c.id));
          updatedTreeData = updatedTreeData.map(p =>
              childrenIdsToDeletePadrinho.has(p.id)
                  ? { ...p, padrinhoId: undefined }
                  : p
          );
          console.log(`Removed padrinhoId from ${childrenOfDeleted.length} afilhados of the deleted person.`);
      }

       console.log("Deleting person:", personIdToDelete);

      setTreeData(updatedTreeData);
      if (firebaseStatus === 'available' && currentUser && currentUser.emailVerified) {
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
      setSelectedPersonForDetails(null);
    };

  // --- Render Logic ---

  if (firebaseStatus === 'checking') {
    return ( <div className="App"> <header className="App-header"> <div className="loading">Initializing...</div> </header> </div> );
  }

  const showTree = !(dbDataStatus === 'loading' && firebaseStatus === 'available');
  const userCanModify = !!currentUser && !!currentUser.emailVerified;

  return (
    <div className="App">
      <header className="App-header">
        {firebaseStatus !== 'config_error' && auth && (<AccountIndicator {...{ currentUser, onLoginClick: handleLoginClick, onLogoutClick: handleLogoutClick, onSignUpClick: handleSignUpClick }}/> )}
        {authLoading && firebaseStatus !== 'config_error' && <div style={{position: 'absolute', top: '15px', right: '20px', zIndex: 110}}>Loading User...</div>}

        <h1>Família TAISCTE</h1>

        {verificationWarning && ( <div className="firebase-warning warning"> <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '5px' }}> <span>{verificationWarning}</span> {currentUser && !currentUser.emailVerified && ( <button onClick={handleResendVerificationEmail} disabled={resendCooldownActive} style={styles.resendLinkButton} title={resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT}> {resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT} </button> )} </p> {resendStatusMessage && ( <p style={{fontSize: '0.8em', marginTop: '5px', color: resendStatusMessage.startsWith('Failed') ? 'red' : 'green' }}> {resendStatusMessage} </p> )} </div> )}
        {warningMessage && !verificationWarning && ( <div className={`firebase-warning ${dbDataStatus === 'error' || firebaseStatus === 'config_error' ? 'error' : ''}`}><p style={{ whiteSpace: 'pre-line'}}>{warningMessage}</p></div> )} {/* Added pre-line for newlines */}

        <ExportImport {...{ onImport: handleImportData, onExport: handleExportData, isUserLoggedIn: !!currentUser, isFirebaseAvailable: firebaseStatus === 'available' }} />

        <div className="tree-container">
          {!showTree ? ( <div className="loading">Loading tree data from Firebase...</div> ) :
           treeData.length === 0 && dbDataStatus !== 'loading' ? ( <div className="loading">Tree is empty. Add the first member.</div> ) :
           ( <GenealogyTree
                data={treeData}
                allPeople={treeData}
                onAddPersonClick={handleAddPersonClick}
                onDeletePersonClick={handleDeletePersonClick}
                onEditPersonClick={handleEditPersonClick}
                isUserLoggedIn={userCanModify}
                onNodeClick={handleNodeClick}
             />
           )}
        </div>
      </header>

      {firebaseStatus !== 'config_error' && (<LoginModal {...{isOpen: isLoginModalOpen, onClose: handleCloseLoginModal, onSwitchToSignUp: handleSwitchToSignUp}} />)}
      {firebaseStatus !== 'config_error' && (<SignUpModal {...{isOpen: isSignUpModalOpen, onClose: handleCloseSignUpModal, onSwitchToLogin: handleSwitchToLogin}} />)}

      <PersonForm
          isOpen={isPersonFormOpen}
          onClose={() => setIsPersonFormOpen(false)}
          onSubmit={handlePersonFormSubmit}
          initialData={personToEdit}
          formTitle={editMode === 'edit' ? 'Edit Person' : 'Add New Afilhado'}
          familyNameOptions={familyNameOptions}
          naipeOptions={naipeOptions}
          instrumentOptions={instrumentOptions}
          hierarchyOptions={hierarchyOptions}
          isEditMode={editMode === 'edit'}
      />

      <Modal {...{isOpen: isDeleteConfirmOpen, onClose: () => setIsDeleteConfirmOpen(false), onConfirm: handleConfirmDelete, title: AppStrings.CONFIRM_DELETE_TITLE, confirmText:"Delete", cancelText:"Cancel" }}>
          <p>{AppStrings.CONFIRM_DELETE_MSG(personToDelete?.name || 'this person')}</p>
      </Modal>

      <Modal isOpen={isGenericConfirmOpen} onClose={() => { setIsGenericConfirmOpen(false); setPendingSubmitData(null); setOnGenericConfirm(null); }} onConfirm={() => { if (onGenericConfirm) { onGenericConfirm(); } setIsGenericConfirmOpen(false); }} title="Confirm Action" confirmText="Continue" cancelText="Cancel" >
           <p>{genericConfirmMessage}</p>
      </Modal>

      <PersonDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        person={selectedPersonForDetails}
        allPeople={treeData}
      />

    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
    resendLinkButton: { background: 'none', border: 'none', color: '#0056b3', textDecoration: 'underline', cursor: 'pointer', padding: '0 5px', fontSize: 'inherit', marginLeft: '5px', },
};

export default App;
// --- END OF RELEVANT App.tsx SECTION ---