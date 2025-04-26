// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import GenealogyTree from './components/GenealogyTree';
import ExportImport, { validateAndNormalizePersonData } from './components/ExportImport';
import AccountIndicator from './components/auth/AccountIndicator';
import LoginModal from './components/auth/LoginModal';
import Modal from './components/Modal'; // Import confirmation modal
import PersonForm from './components/PersonForm'; // Import person form
import { demoData } from './data/demoData';
import { Person } from './types/models';
import { auth, database, isFirebaseAvailable, firebaseInitializationError } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { ref, get, set, DatabaseReference } from 'firebase/database';
// Import a way to generate unique IDs
// Option 1: Use crypto API (modern browsers)
// Option 2: Use a library like 'uuid': npm install uuid @types/uuid
// import { v4 as uuidv4 } from 'uuid';

type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available';
type DbDataStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
type EditMode = 'add' | 'edit';

function App() {
  const [treeData, setTreeData] = useState<Person[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatus>('checking');
  const [dbDataStatus, setDbDataStatus] = useState<DbDataStatus>('idle');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // --- State for Modals & Forms ---
  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [parentForNewPersonId, setParentForNewPersonId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('add');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<{ id: string, name: string } | null>(null);
  // --- End Modal State ---

  // --- Data Fetching (Keep as is) ---
  const fetchTreeData = useCallback(async () => { /* ... Same fetch logic ... */
      if (!database) {
        console.error("Database service unavailable during fetch attempt.");
        setWarningMessage("Error: Firebase Database service not initialized correctly.");
        const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
        setTreeData(validatedDemoData || []);
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
        const { validData, errors } = validateAndNormalizePersonData(dataFromDb);
        if (validData) {
            console.log("Data successfully fetched and validated from Firebase DB.");
            setTreeData(validData);
            setDbDataStatus('loaded');
            if (errors.length > 0) { console.warn("Minor validation issues found in Firebase data:", errors); }
        } else {
            console.error("Validation failed for data fetched from Firebase:", errors);
            setWarningMessage(`Data error in Firebase: ${errors.join(', ')}. Displaying demo data.`);
            const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
            setTreeData(validatedDemoData || []);
            setDbDataStatus('error');
        }
      } else {
        console.log("No data found at /treeData in Firebase DB.");
        setWarningMessage("Firebase connection successful, but no tree data found. Displaying demo data.");
        const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
        setTreeData(validatedDemoData || []);
        setDbDataStatus('empty');
      }
    } catch (error: any) {
      console.error("Error fetching data from Firebase DB:", error);
      if (error.code === 'PERMISSION_DENIED') { setWarningMessage("Error fetching data: Permission denied. Check database rules. Displaying demo data."); }
      else { setWarningMessage(`Error fetching data: ${error.message}. Displaying demo data.`); }
      const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
      setTreeData(validatedDemoData || []);
      setDbDataStatus('error');
    }
  }, []);

  // --- Firebase Init & Auth Listener (Keep as is) ---
  useEffect(() => { /* ... Same init logic ... */
      if (!isFirebaseAvailable) {
      console.error("Firebase Init Error:", firebaseInitializationError?.message || "Config invalid");
      setFirebaseStatus('config_error');
      setWarningMessage("Firebase configuration invalid or connection failed. Showing demo data. Export/Import still available locally.");
      const { validData: validatedDemoData } = validateAndNormalizePersonData(demoData);
      setTreeData(validatedDemoData || []);
      setAuthLoading(false);
      setDbDataStatus('error');
    } else {
      setFirebaseStatus('available');
      fetchTreeData();
    }
  }, [fetchTreeData]);
  useEffect(() => { /* ... Same auth listener ... */
      if (firebaseStatus === 'available' && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
        console.log("Auth State Changed:", user ? `Logged in as ${user.email}` : "Logged out");
      });
      return () => unsubscribe();
    } else if (firebaseStatus !== 'checking') {
        setAuthLoading(false);
    }
  }, [firebaseStatus]);

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
            parents: [parentForNewPersonId], // Set parent relationship
            children: [], // New person starts with no children
            spouses: [],  // New person starts with no spouses
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
      parents: person.parents.filter(id => id !== personIdToDelete),
      children: person.children.filter(id => id !== personIdToDelete),
      spouses: person.spouses.filter(id => id !== personIdToDelete),
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

  // --- Render Logic ---

  if (firebaseStatus === 'checking' || authLoading) { /* ... loading ... */ }

  return (
    <div className="App">
      <header className="App-header">
        {/* Account Indicator */}
        {firebaseStatus !== 'config_error' && auth && (
            <AccountIndicator
                currentUser={currentUser}
                onLoginClick={handleLoginClick}   // Pass handleLoginClick to the onLoginClick prop
                onLogoutClick={handleLogoutClick}  // Pass handleLogoutClick to the onLogoutClick prop
            />
        )}

        <h1>Genealogia TAISCTE</h1>

        {/* Warning Message */}
        {warningMessage && ( <div className={`firebase-warning ${dbDataStatus === 'error' || firebaseStatus === 'config_error' ? 'error' : ''}`}><p>{warningMessage}</p></div> )}

        {/* Export/Import */}
        <ExportImport {...{ onImport: handleImportData, onExport: handleExportData, isUserLoggedIn: !!currentUser, isFirebaseAvailable: firebaseStatus === 'available' }} />

        {/* Tree Container */}
        <div className="tree-container">
          {(dbDataStatus === 'loading' && firebaseStatus === 'available') ? (
             <div className="loading">Loading tree data from Firebase...</div>
          ) : (
             <GenealogyTree
                data={treeData}
                onAddPersonClick={handleAddPersonClick}
                onDeletePersonClick={handleDeletePersonClick}
                onEditPersonClick={handleEditPersonClick} // Pass edit handler
                isUserLoggedIn={!!currentUser}
             />
          )}
        </div>
      </header>

      {/* Modals */}
      {firebaseStatus !== 'config_error' && (
          <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />
      )}
      {/* Add Person / Edit Person Form Modal */}
      <PersonForm
          isOpen={isPersonFormOpen}
          onClose={() => setIsPersonFormOpen(false)}
          onSubmit={handlePersonFormSubmit}
          initialData={personToEdit}
          formTitle={editMode === 'edit' ? 'Edit Person' : 'Add New Person'}
      />
      {/* Delete Confirmation Modal */}
      <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          confirmText="Delete"
          cancelText="Cancel"
       >
           <p>Are you sure you want to delete <strong style={{color: '#dc3545'}}>{personToDelete?.name || 'this person'}</strong>?</p>
           <p>This action is irreversible and will remove them from the tree.</p>
       </Modal>

    </div>
  );
}

export default App;