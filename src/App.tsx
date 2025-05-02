// src/App.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react'; // Added useEffect back temporarily if needed
import './App.css';
import AppLayout from './components/AppLayout';
import { Person } from './types/models';
import { useAuth } from './hooks/useAuth';
import { useTreeData } from './hooks/useTreeData';
import { useDropdownOptions } from './hooks/useDropdownOptions';
// Import the flags needed to determine status
import { auth, database, isFirebaseAvailable, firebaseInitializationError } from './firebase';
import * as AppStrings from './constants/strings';

// Type alias for clarity, can be imported if defined centrally
type EditMode = 'add' | 'edit';
// Define FirebaseStatus type here or import if defined centrally
type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available';

function App() {
    // --- Determine Initial Firebase Status ---
    // This runs once when the component mounts, based on the synchronous init in firebase.ts
    const initialFirebaseStatus: FirebaseStatus = useMemo(() => {
        if (!isFirebaseAvailable && firebaseInitializationError) {
            return 'config_error';
        } else if (isFirebaseAvailable) {
            return 'available';
        } else {
            // This case shouldn't ideally happen if firebase.ts logic is correct
            console.warn("Could not determine initial Firebase status definitively.");
            return 'unavailable'; // Or 'config_error' as a safer default
        }
    }, []); // Empty dependency array ensures this runs only once

    // --- Hooks ---
    // Pass the determined initial status to the hooks
    const {
        currentUser, authLoading, isLoginModalOpen, isSignUpModalOpen, verificationWarning,
        resendCooldownActive, resendStatusMessage, handleLoginClick, handleLogoutClick,
        handleSignUpClick, handleCloseLoginModal, handleCloseSignUpModal, handleSwitchToLogin,
        handleSwitchToSignUp, handleResendVerificationEmail
    } = useAuth(initialFirebaseStatus); // Use derived initial status

    const {
        treeData, dbDataStatus, dataWarningMessage, handleImportData, handleExportData,
        handleAddPerson, handleEditPerson, handleDeletePerson
        // Removed fetchTreeData from destructuring as it's called internally by the hook now
    } = useTreeData(currentUser, initialFirebaseStatus); // Use derived initial status

    const {
        familyNameOptions, naipeOptions, instrumentOptions, hierarchyOptions
    } = useDropdownOptions(treeData);

    // --- State managed directly by App (mostly for modals) ---
    const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
    const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
    const [parentForNewPersonId, setParentForNewPersonId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<EditMode>('add');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedPersonForDetails, setSelectedPersonForDetails] = useState<Person | null>(null);
    const [isGenericConfirmOpen, setIsGenericConfirmOpen] = useState(false);
    const [genericConfirmMessage, setGenericConfirmMessage] = useState<string>('');
    const [onGenericConfirm, setOnGenericConfirm] = useState<(() => void) | null>(null);

    // --- Combine Warning Messages ---
    const displayWarning = verificationWarning || dataWarningMessage;

    // --- Handlers connecting UI actions to Hooks/State (No changes needed in these handlers) ---
    const handleAddPersonClick = useCallback((padrinhoId: string) => {
        if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to add members."); return; }
        setParentForNewPersonId(padrinhoId);
        setPersonToEdit(null);
        setEditMode('add');
        setIsPersonFormOpen(true);
    }, [currentUser]);

    const handleEditPersonClick = useCallback((person: Person) => {
        if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to edit members."); return; }
        setPersonToEdit(person);
        setParentForNewPersonId(null);
        setEditMode('edit');
        setIsPersonFormOpen(true);
    }, [currentUser]);

    const handleDeletePersonClick = useCallback((personId: string, personName: string) => {
        if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to delete members."); return; }
        setPersonToDelete({ id: personId, name: personName });
        setIsDeleteConfirmOpen(true);
    }, [currentUser]);

    const handlePersonFormSubmit = useCallback(async (
        personFormData: Omit<Person, 'id' | 'children' | 'padrinhoId'> & { id?: string }
    ) => {
        let success = false;
        if (editMode === 'edit' && personFormData.id) {
            success = await handleEditPerson(personFormData as Person);
        } else if (editMode === 'add' && parentForNewPersonId) {
            success = await handleAddPerson(personFormData, parentForNewPersonId);
        } else {
            console.error("Invalid state for form submission"); alert("Error submitting form."); return;
        }
        if (success) { setIsPersonFormOpen(false); setPersonToEdit(null); setParentForNewPersonId(null); }
    }, [editMode, parentForNewPersonId, handleAddPerson, handleEditPerson]);

    const handleConfirmDelete = useCallback(async () => {
        if (!personToDelete) return;
        const success = await handleDeletePerson(personToDelete.id);
        if (success) { setIsDeleteConfirmOpen(false); setPersonToDelete(null); }
    }, [personToDelete, handleDeletePerson]);

    const handleNodeClick = useCallback((person: Person) => {
        setSelectedPersonForDetails(person);
        setIsDetailsModalOpen(true);
    }, []);

    const handleCloseDetailsModal = useCallback(() => {
        setIsDetailsModalOpen(false); setSelectedPersonForDetails(null);
    }, []);


    // --- Render Logic ---
    // REMOVE the explicit 'checking' state check, rely on authLoading instead
    // if (initialFirebaseStatus === 'checking') { // <-- REMOVE THIS BLOCK
    //    return ( <div className="App"> <header className="App-header"> <div className="loading">Initializing...</div> </header> </div> );
    // }

    // AppLayout will handle showing "Loading User..." based on authLoading prop
    return (
        <AppLayout
            // Auth State & Handlers
            currentUser={currentUser}
            authLoading={authLoading} // Pass authLoading to AppLayout
            isLoginModalOpen={isLoginModalOpen}
            isSignUpModalOpen={isSignUpModalOpen}
            verificationWarning={verificationWarning}
            resendCooldownActive={resendCooldownActive}
            resendStatusMessage={resendStatusMessage}
            handleLoginClick={handleLoginClick}
            handleLogoutClick={handleLogoutClick}
            handleSignUpClick={handleSignUpClick}
            handleCloseLoginModal={handleCloseLoginModal}
            handleCloseSignUpModal={handleCloseSignUpModal}
            handleSwitchToLogin={handleSwitchToLogin}
            handleSwitchToSignUp={handleSwitchToSignUp}
            handleResendVerificationEmail={handleResendVerificationEmail}
            // Tree Data State & Handlers
            treeData={treeData}
            dbDataStatus={dbDataStatus}
            warningMessage={displayWarning} // Pass combined warning
            handleImportData={handleImportData}
            handleExportData={handleExportData}
            handleAddPersonClick={handleAddPersonClick}
            handleDeletePersonClick={handleDeletePersonClick}
            handleEditPersonClick={handleEditPersonClick}
            handleNodeClick={handleNodeClick}
            // Dropdown Options
            familyNameOptions={familyNameOptions}
            naipeOptions={naipeOptions}
            instrumentOptions={instrumentOptions}
            hierarchyOptions={hierarchyOptions}
            // Modal State & Handlers
            firebaseStatus={initialFirebaseStatus} // Pass derived initial status
            isPersonFormOpen={isPersonFormOpen}
            personToEdit={personToEdit}
            editMode={editMode}
            isDeleteConfirmOpen={isDeleteConfirmOpen}
            personToDelete={personToDelete}
            isGenericConfirmOpen={isGenericConfirmOpen}
            genericConfirmMessage={genericConfirmMessage}
            isDetailsModalOpen={isDetailsModalOpen}
            selectedPersonForDetails={selectedPersonForDetails}
            setIsPersonFormOpen={setIsPersonFormOpen}
            handlePersonFormSubmit={handlePersonFormSubmit}
            setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
            handleConfirmDelete={handleConfirmDelete}
            setIsGenericConfirmOpen={setIsGenericConfirmOpen}
            handleCloseDetailsModal={handleCloseDetailsModal}
            onGenericConfirm={onGenericConfirm}
            // Dummy setters if not needed for generic confirm modal
            setPendingSubmitData={() => {}}
            setOnGenericConfirm={setOnGenericConfirm}
        />
    );
}

export default App;