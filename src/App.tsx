// src/App.tsx
import React, { useState, useCallback, useMemo } from 'react'; // Removed useEffect as it's in hooks now
import './App.css';
import AppLayout from './components/AppLayout';
import { Person } from './types/models';
import { useAuth } from './hooks/useAuth';
import { useTreeData } from './hooks/useTreeData';
import { useDropdownOptions } from './hooks/useDropdownOptions';
import { isFirebaseAvailable, firebaseInitializationError } from './firebase'; // Keep these

type EditMode = 'add' | 'edit';
type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available'; // Define locally or import

function App() {
    // --- Determine Initial Firebase Status ---
    const initialFirebaseStatus: FirebaseStatus = useMemo(() => {
        if (!isFirebaseAvailable && firebaseInitializationError) return 'config_error';
        if (isFirebaseAvailable) return 'available';
        return 'unavailable';
    }, []); // No dependencies needed

    // --- Hooks ---
    const {
        currentUser, authLoading, isLoginModalOpen, isSignUpModalOpen, verificationWarning,
        resendCooldownActive, resendStatusMessage, handleLoginClick, handleLogoutClick,
        handleSignUpClick, handleCloseLoginModal, handleCloseSignUpModal, handleSwitchToLogin,
        handleSwitchToSignUp, handleResendVerificationEmail
    } = useAuth(initialFirebaseStatus);

    const {
        treeData, dbDataStatus, dataWarningMessage, handleImportData, handleExportData,
        handleAddPerson, handleEditPerson, handleDeletePerson
    } = useTreeData(currentUser, initialFirebaseStatus);

    const {
        familyNameOptions, naipeOptions, instrumentOptions, hierarchyOptions
    } = useDropdownOptions(treeData);

    // --- App-level State (mostly for modals/UI interactions) ---
    const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
    const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
    // Renamed state variable for clarity
    const [targetParentId, setTargetParentId] = useState<string | null>(null); // ID of node where "+" was clicked
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

    // --- UI Action Handlers that trigger logic or set modal state ---
    const handleAddPersonClick = useCallback((clickedNodeId: string) => { // Parameter is the ID of the node clicked
        if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to add members."); return; }
        console.log(`UI: Add clicked under node ID: ${clickedNodeId}`); // Debug log
        setTargetParentId(clickedNodeId); // Store the ID of the clicked node (potential parent)
        setPersonToEdit(null);
        setEditMode('add');
        setIsPersonFormOpen(true);
    }, [currentUser]);

    const handleEditPersonClick = useCallback((person: Person) => {
        if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to edit members."); return; }
        setPersonToEdit(person);
        setTargetParentId(null); // Not adding, so no target parent needed
        setEditMode('edit');
        setIsPersonFormOpen(true);
    }, [currentUser]);

    const handleDeletePersonClick = useCallback((personId: string, personName: string) => {
        if (!currentUser || !currentUser.emailVerified) { alert("Login and verify email to delete members."); return; }
        setPersonToDelete({ id: personId, name: personName });
        setIsDeleteConfirmOpen(true);
    }, [currentUser]);

    const handlePersonFormSubmit = useCallback(async (
        // Form data excludes id, parentId, children
        personFormData: Omit<Person, 'id' | 'parentId' | 'children'> & { id?: string }
    ) => {
        let success = false;
        if (editMode === 'edit' && personToEdit?.id) { // Use personToEdit for ID in edit mode
            // Ensure id is passed correctly for editing
            success = await handleEditPerson({ ...personFormData, id: personToEdit.id });
        } else if (editMode === 'add' && targetParentId) { // Use targetParentId for adding
            success = await handleAddPerson(personFormData, targetParentId);
        } else {
            console.error("Invalid state for form submission: editMode or targetParentId missing.");
            alert("Error submitting form."); return;
        }

        if (success) {
            setIsPersonFormOpen(false);
            setPersonToEdit(null);
            setTargetParentId(null); // Clear target parent after successful add/edit
        }
        // Decide if form should stay open on failure based on feedback from hooks
    }, [editMode, targetParentId, personToEdit, handleAddPerson, handleEditPerson]); // Added personToEdit dependency

    const handleConfirmDelete = useCallback(async () => {
        if (!personToDelete) return;
        const success = await handleDeletePerson(personToDelete.id);
        if (success) {
            setIsDeleteConfirmOpen(false);
            setPersonToDelete(null);
        }
    }, [personToDelete, handleDeletePerson]);

    const handleNodeClick = useCallback((person: Person) => {
        setSelectedPersonForDetails(person);
        setIsDetailsModalOpen(true);
    }, []);

    const handleCloseDetailsModal = useCallback(() => {
        setIsDetailsModalOpen(false);
        setSelectedPersonForDetails(null);
    }, []);

    // --- Render Logic ---
    // No 'checking' state needed here anymore

    return (
        <AppLayout
            // Pass all necessary props...
            currentUser={currentUser}
            authLoading={authLoading}
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
            treeData={treeData}
            dbDataStatus={dbDataStatus}
            warningMessage={displayWarning}
            handleImportData={handleImportData}
            handleExportData={handleExportData}
            handleAddPersonClick={handleAddPersonClick} // Passes the ID of the clicked node
            handleDeletePersonClick={handleDeletePersonClick}
            handleEditPersonClick={handleEditPersonClick}
            handleNodeClick={handleNodeClick}
            familyNameOptions={familyNameOptions}
            naipeOptions={naipeOptions}
            instrumentOptions={instrumentOptions}
            hierarchyOptions={hierarchyOptions}
            firebaseStatus={initialFirebaseStatus}
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
            // Pass dummy setters if generic confirm modal doesn't need them
            setPendingSubmitData={() => {}}
            setOnGenericConfirm={setOnGenericConfirm}
        />
    );
}

export default App;