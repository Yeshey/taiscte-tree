// src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
// Import the new layout component
import AppLayout from './components/AppLayout';
// Keep necessary component imports if App needs direct interaction beyond layout
import { validateAndNormalizePersonData } from './components/ExportImport';
import { demoData } from './data/demoData';
import { Person } from './types/models';
import { auth, database, isFirebaseAvailable, firebaseInitializationError } from './firebase';
import { onAuthStateChanged, User, signOut, sendEmailVerification } from 'firebase/auth';
import { ref, get, set, DatabaseReference } from 'firebase/database';
import * as AppStrings from './constants/strings';

type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available';
type DbDataStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
type EditMode = 'add' | 'edit';

const isDateOlderThanYears = (dateStr: string | undefined, years: number): boolean => {
  if (!dateStr) return false;
  try {
      const date = new Date(dateStr + 'T00:00:00');
      if (isNaN(date.getTime())) return false;
      const thresholdDate = new Date();
      thresholdDate.setFullYear(thresholdDate.getFullYear() - years);
      return date < thresholdDate;
  } catch { return false; }
};

const { validData: initialValidatedDemoData, errors: demoErrors } = validateAndNormalizePersonData(demoData);
if (!initialValidatedDemoData) {
    console.error("FATAL: Demo data is invalid!", demoErrors);
}

function App() {
    // --- State Variables (Remain in App.tsx) ---
    const [treeData, setTreeData] = useState<Person[]>(initialValidatedDemoData || []);
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
    const [parentForNewPersonId, setParentForNewPersonId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<EditMode>('add');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isGenericConfirmOpen, setIsGenericConfirmOpen] = useState(false);
    const [genericConfirmMessage, setGenericConfirmMessage] = useState<string>('');
    const [onGenericConfirm, setOnGenericConfirm] = useState<(() => void) | null>(null);
    const [pendingSubmitData, setPendingSubmitData] = useState<Omit<Person, 'id' | 'children' | 'padrinhoId'> & { id?: string } | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedPersonForDetails, setSelectedPersonForDetails] = useState<Person | null>(null);

    // --- Dropdown Options Calculation (Remains in App.tsx) ---
    const familyNameOptions: string[] = useMemo(() => {
        const names = new Set(treeData.map(p => p.familyName));
        return Array.from(names).sort();
    }, [treeData]);
    const naipeOptions: string[] = useMemo(() => {
        const naipes = new Set( treeData.map(p => p.naipeVocal).filter((n): n is string => typeof n === 'string' && n !== '') );
        return Array.from(naipes).sort();
    }, [treeData]);
    const instrumentOptions: string[] = useMemo(() => {
        const instruments = new Set<string>();
        treeData.forEach(p => {
            if (p.mainInstrument && typeof p.mainInstrument === 'string') instruments.add(p.mainInstrument);
            p.otherInstruments?.forEach(inst => { if(typeof inst === 'string' && inst !== '') instruments.add(inst); });
        });
        return Array.from(instruments).sort();
    }, [treeData]);
    const hierarchyOptions: string[] = useMemo(() => {
        const currentHierarchy = treeData.map(p => p.hierarquia).filter((h): h is string => typeof h === 'string' && h !== '');
        const options = new Set<string>(AppStrings.HIERARCHIA_BASE_LEVELS.map(l => l.defaultName));
        currentHierarchy.forEach(h => options.add(h));
        return Array.from(options).sort((a, b) => {
            const indexA = AppStrings.HIERARCHIA_BASE_LEVELS.findIndex(l => l.defaultName === a);
            const indexB = AppStrings.HIERARCHIA_BASE_LEVELS.findIndex(l => l.defaultName === b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [treeData]);

    // --- Callbacks and Logic Handlers (Remain in App.tsx) ---
    const fetchTreeData = useCallback(async () => { /* ... */
         if (!database) { console.error("DB unavailable"); setWarningMessage(AppStrings.FIREBASE_DB_UNAVAILABLE); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); return; }
         const treeDataRef: DatabaseReference = ref(database, 'treeData');
         setDbDataStatus('loading'); setWarningMessage(null);
         try {
             const snapshot = await get(treeDataRef);
             if (snapshot.exists()) {
                 const dataFromDb = snapshot.val();
                 const { validData, errors } = validateAndNormalizePersonData(dataFromDb);
                 if (validData) { setTreeData(validData); setDbDataStatus('loaded'); if (errors.length > 0) console.warn("Validation issues:", errors); }
                 else { console.error("Validation failed:", errors); setWarningMessage(AppStrings.FIREBASE_DATA_ERROR(errors.join(', '))); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); }
             } else { console.log("No data found"); setWarningMessage("No data in Firebase, showing default tree."); setTreeData(initialValidatedDemoData || []); setDbDataStatus('empty'); }
         } catch (error: any) { console.error("Fetch error:", error); if (error.code === 'PERMISSION_DENIED') setWarningMessage(AppStrings.FIREBASE_FETCH_PERMISSION_ERROR); else setWarningMessage(AppStrings.FIREBASE_FETCH_ERROR(error.message)); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); }
    }, []);

    const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => { /* ... */
        if (!database || !currentUser) { alert(AppStrings.SAVE_UNAVAILABLE); return false; }
        if (!currentUser.emailVerified) { alert("Cannot save data: Email not verified."); return false; }
        const { validData, errors } = validateAndNormalizePersonData(dataToSave);
        if (!validData) { alert(AppStrings.SAVE_FAILED_INVALID_DATA(errors)); return false; }
        if (errors.length > 0) console.warn("Saving with warnings:", errors);
        try {
            const treeDataRef = ref(database, 'treeData'); await set(treeDataRef, validData);
            setWarningMessage(AppStrings.SAVE_SUCCESS); setTimeout(() => setWarningMessage(null), 3000); return true;
        } catch (error: any) { console.error("Save error:", error); if (error.code === 'PERMISSION_DENIED') alert(AppStrings.SAVE_FAILED_PERMISSION); else alert(AppStrings.SAVE_FAILED_GENERAL(error.message)); return false; }
     }, [currentUser]);

    const handleImportData = useCallback(async (data: Person[]) => { /* ... */
        setTreeData(data);
        if (firebaseStatus === 'available' && currentUser && currentUser.emailVerified) await saveTreeDataToFirebase(data);
        else if (firebaseStatus === 'available' && currentUser) setWarningMessage("Data imported locally. Verify your email to save.");
        else if (firebaseStatus === 'available') setWarningMessage(AppStrings.IMPORT_LOCAL_WARNING);
        // Set timeout for local warnings
        if (warningMessage?.startsWith("Data imported locally")) setTimeout(() => { if (warningMessage?.startsWith("Data imported locally")) setWarningMessage(null); }, 5000);
    }, [firebaseStatus, currentUser, saveTreeDataToFirebase, warningMessage]); // Added warningMessage dependency

    const handleExportData = useCallback(() => treeData, [treeData]);

    const handleLoginClick = useCallback(() => { if (firebaseStatus !== 'config_error') setIsLoginModalOpen(true); else alert(AppStrings.LOGIN_UNAVAILABLE); }, [firebaseStatus]);
    const handleLogoutClick = useCallback(async () => { /* ... */
        if (!auth) { alert(AppStrings.AUTH_SERVICE_UNAVAILABLE); return; }
        try { await signOut(auth); } catch (error: any) { alert(AppStrings.LOGOUT_FAILED(error.message)); }
    }, []);
    const handleSignUpClick = useCallback(() => { if (firebaseStatus !== 'config_error') { setIsSignUpModalOpen(true); setIsLoginModalOpen(false); } else alert(AppStrings.SIGNUP_UNAVAILABLE); }, [firebaseStatus]);
    const handleResendVerificationEmail = useCallback(async () => { /* ... */
        if (!currentUser || resendCooldownActive || !auth || currentUser.emailVerified) return;
        setResendCooldownActive(true); setResendStatusMessage(AppStrings.VERIFICATION_SENDING);
        try { await sendEmailVerification(currentUser); setResendStatusMessage(AppStrings.VERIFICATION_SENT); setTimeout(() => setResendStatusMessage(null), 6000); }
        catch (error: any) { setResendStatusMessage(AppStrings.VERIFICATION_FAILED(error.message)); setTimeout(() => setResendStatusMessage(null), 6000); }
        finally { setTimeout(() => setResendCooldownActive(false), 10000); }
    }, [currentUser, resendCooldownActive, auth]); // Added auth dependency

    const handleAddPersonClick = useCallback((padrinhoId: string) => { /* ... */
        if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to add members."); return; }
        setParentForNewPersonId(padrinhoId); setPersonToEdit(null); setEditMode('add'); setIsPersonFormOpen(true);
    }, [currentUser]);
    const handleEditPersonClick = useCallback((person: Person) => { /* ... */
         if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to edit members."); return; }
        setPersonToEdit(person); setParentForNewPersonId(null); setEditMode('edit'); setIsPersonFormOpen(true);
    }, [currentUser]);
    const handlePersonFormSubmit = useCallback((personFormData: Omit<Person, 'id' | 'children' | 'padrinhoId'> & { id?: string }) => { /* ... */
        let updatedTree = [...treeData];
        if (editMode === 'edit' && personFormData.id) {
             const index = updatedTree.findIndex(p => p.id === personFormData.id);
             if (index !== -1) updatedTree[index] = { ...updatedTree[index], ...personFormData }; else return;
         } else if (editMode === 'add' && parentForNewPersonId) {
             const parentIndex = updatedTree.findIndex(p => p.id === parentForNewPersonId); if (parentIndex === -1) return;
             const newPerson: Person = { ...personFormData, id: crypto.randomUUID(), padrinhoId: parentForNewPersonId, children: [] };
             updatedTree.push(newPerson);
             updatedTree[parentIndex] = { ...updatedTree[parentIndex], children: [...updatedTree[parentIndex].children, newPerson.id] };
         } else return;
        setTreeData(updatedTree);
        if (firebaseStatus === 'available' && currentUser && currentUser.emailVerified) saveTreeDataToFirebase(updatedTree);
        else setWarningMessage("Changes saved locally. Log in & verify email to save.");
        setIsPersonFormOpen(false); setPersonToEdit(null); setParentForNewPersonId(null);
    }, [treeData, editMode, parentForNewPersonId, firebaseStatus, currentUser, saveTreeDataToFirebase]); // Added dependencies
    const handleDeletePersonClick = useCallback((personId: string, personName: string) => { /* ... */
        if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to delete members."); return; }
        setPersonToDelete({ id: personId, name: personName }); setIsDeleteConfirmOpen(true);
    }, [currentUser]);
    const handleConfirmDelete = useCallback(() => { /* ... */
        if (!personToDelete) return; const { id: idToDelete } = personToDelete;
        const childPerson = treeData.find(p => p.id === idToDelete);       
        let parentPerson: Person | undefined = undefined; // Explicitly type as Person or undefined        
        if (childPerson?.padrinhoId) parentPerson = treeData.find(p => p.id === childPerson.padrinhoId);
        const childrenOfDeleted = treeData.filter(p => p.padrinhoId === idToDelete);
        let updatedTree = treeData.filter(p => p.id !== idToDelete);
        if (parentPerson) updatedTree = updatedTree.map(p => p.id === parentPerson!.id ? { ...p, children: p.children.filter(id => id !== idToDelete) } : p );
        if (childrenOfDeleted.length > 0) { const childIds = new Set(childrenOfDeleted.map(c => c.id)); updatedTree = updatedTree.map(p => childIds.has(p.id) ? { ...p, padrinhoId: undefined } : p ); }
        setTreeData(updatedTree);
        if (firebaseStatus === 'available' && currentUser && currentUser.emailVerified) saveTreeDataToFirebase(updatedTree);
        setIsDeleteConfirmOpen(false); setPersonToDelete(null);
    }, [personToDelete, treeData, firebaseStatus, currentUser, saveTreeDataToFirebase]); // Added dependencies
    const handleNodeClick = useCallback((person: Person) => { setSelectedPersonForDetails(person); setIsDetailsModalOpen(true); }, []);
    const handleCloseLoginModal = useCallback(() => setIsLoginModalOpen(false), []);
    const handleSwitchToSignUp = useCallback(() => { setIsLoginModalOpen(false); setIsSignUpModalOpen(true); }, []);
    const handleCloseSignUpModal = useCallback(() => setIsSignUpModalOpen(false), []);
    const handleSwitchToLogin = useCallback(() => { setIsSignUpModalOpen(false); setIsLoginModalOpen(true); }, []);
    const handleCloseDetailsModal = useCallback(() => setIsDetailsModalOpen(false), []);


    // --- Effects (Remain in App.tsx) ---
    useEffect(() => { /* Firebase Init */
        if (!isFirebaseAvailable) { setFirebaseStatus('config_error'); setWarningMessage(AppStrings.FIREBASE_CONFIG_ERROR); setAuthLoading(false); setDbDataStatus('error'); setTreeData(initialValidatedDemoData || []); }
        else { setFirebaseStatus('available'); fetchTreeData(); }
    }, [fetchTreeData]); // Now depends on fetchTreeData only

    useEffect(() => { /* Auth Listener */
        if (firebaseStatus === 'available' && auth) {
            const unsub = onAuthStateChanged(auth, (user) => { setCurrentUser(user); setAuthLoading(false); if (user && !user.emailVerified) setVerificationWarning(AppStrings.VERIFICATION_WARNING); else setVerificationWarning(null); });
            return () => unsub();
        } else if (firebaseStatus !== 'checking') setAuthLoading(false);
    }, [firebaseStatus, auth]); // Added auth dependency

    useEffect(() => { /* Tuno Check */
        if (firebaseStatus === 'available' && currentUser && dbDataStatus === 'loaded') {
            const tunoName = AppStrings.HIERARCHIA_BASE_LEVELS.find(l => l.key === 'tuno')?.defaultName;
            const tunos = treeData.filter(p => p.hierarquia === tunoName && isDateOlderThanYears(p.passagemTunoDate, 2));
            if (tunos.length > 0) { const names = tunos.map(p => p.name).join(', '); const msg = `Review Needed: ${names}...`; setWarningMessage(prev => prev ? `${prev}\n${msg}` : msg); }
        }
    }, [treeData, currentUser, firebaseStatus, dbDataStatus]);


    // --- Render Logic ---
    if (firebaseStatus === 'checking') {
        return ( <div className="App"> <header className="App-header"> <div className="loading">Initializing...</div> </header> </div> );
    }

    // Pass all necessary state and handlers down to AppLayout
    return (
        <AppLayout
            treeData={treeData}
            currentUser={currentUser}
            authLoading={authLoading}
            firebaseStatus={firebaseStatus}
            dbDataStatus={dbDataStatus}
            warningMessage={warningMessage}
            verificationWarning={verificationWarning}
            resendCooldownActive={resendCooldownActive}
            resendStatusMessage={resendStatusMessage}
            isLoginModalOpen={isLoginModalOpen}
            isSignUpModalOpen={isSignUpModalOpen}
            isPersonFormOpen={isPersonFormOpen}
            personToEdit={personToEdit}
            editMode={editMode}
            isDeleteConfirmOpen={isDeleteConfirmOpen}
            personToDelete={personToDelete}
            isGenericConfirmOpen={isGenericConfirmOpen}
            genericConfirmMessage={genericConfirmMessage}
            isDetailsModalOpen={isDetailsModalOpen}
            selectedPersonForDetails={selectedPersonForDetails}
            familyNameOptions={familyNameOptions}
            naipeOptions={naipeOptions}
            instrumentOptions={instrumentOptions}
            hierarchyOptions={hierarchyOptions}
            handleLoginClick={handleLoginClick}
            handleLogoutClick={handleLogoutClick}
            handleSignUpClick={handleSignUpClick}
            handleResendVerificationEmail={handleResendVerificationEmail}
            handleImportData={handleImportData}
            handleExportData={handleExportData}
            handleAddPersonClick={handleAddPersonClick}
            handleDeletePersonClick={handleDeletePersonClick}
            handleEditPersonClick={handleEditPersonClick}
            handleNodeClick={handleNodeClick}
            handleCloseLoginModal={handleCloseLoginModal}
            handleSwitchToSignUp={handleSwitchToSignUp}
            handleCloseSignUpModal={handleCloseSignUpModal}
            handleSwitchToLogin={handleSwitchToLogin}
            setIsPersonFormOpen={setIsPersonFormOpen}
            handlePersonFormSubmit={handlePersonFormSubmit}
            setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
            handleConfirmDelete={handleConfirmDelete}
            setIsGenericConfirmOpen={setIsGenericConfirmOpen}
            handleCloseDetailsModal={handleCloseDetailsModal}
            onGenericConfirm={onGenericConfirm}
            setPendingSubmitData={setPendingSubmitData} // Pass setters if generic modal needs them
            setOnGenericConfirm={setOnGenericConfirm}
        />
    );
}

export default App;