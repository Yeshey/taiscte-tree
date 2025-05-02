// src/App.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react'; // Added useEffect
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
        // This check runs before any async operations like auth listener setup
        if (!isFirebaseAvailable && firebaseInitializationError) return 'config_error';
        if (isFirebaseAvailable) return 'available';
        // If neither of the above, it implies config was likely okay but maybe app failed init?
        // Or simply that isFirebaseAvailable is false without an error.
        return 'unavailable'; // Treat as unavailable if not config_error or available
    }, []);

    // --- Hooks ---
    const {
        currentUser, authLoading, isLoginModalOpen, isSignUpModalOpen, verificationWarning,
        resendCooldownActive, resendStatusMessage, handleLoginClick, handleLogoutClick,
        handleSignUpClick, handleCloseLoginModal, handleCloseSignUpModal, handleSwitchToLogin,
        handleSwitchToSignUp, handleResendVerificationEmail,
        // Invite related
        inviteTokenId, inviteStatus, inviteError, inviteCheckComplete,
        generateInvite, markInviteAsUsed,
        // Password Reset related
        passwordResetEmail, setPasswordResetEmail, passwordResetLoading,
        passwordResetMessage, passwordResetError, handlePasswordReset
    } = useAuth(initialFirebaseStatus); // Pass the synchronously determined status

    const {
        treeData, dbDataStatus, dataWarningMessage, handleImportData, handleExportData,
        handleAddPerson, handleEditPerson, handleDeletePerson
        // Pass currentUser to useTreeData if needed for rules/checks within it
    } = useTreeData(currentUser, initialFirebaseStatus);

    const {
        familyNameOptions, naipeOptions, instrumentOptions, hierarchyOptions
    } = useDropdownOptions(treeData);

    // --- App-level State (mostly for modals/UI interactions) ---
    const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
    const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
    const [targetParentId, setTargetParentId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<EditMode>('add');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedPersonForDetails, setSelectedPersonForDetails] = useState<Person | null>(null);
    const [isGenericConfirmOpen, setIsGenericConfirmOpen] = useState(false);
    const [genericConfirmMessage, setGenericConfirmMessage] = useState<string>('');
    const [onGenericConfirm, setOnGenericConfirm] = useState<(() => void) | null>(null);

    // --- Automatically open signup if valid invite detected on load ---
     useEffect(() => {
         // Make sure invite check is complete before deciding
         if (inviteCheckComplete && inviteStatus === 'valid' && !authLoading && !currentUser && !isLoginModalOpen && !isSignUpModalOpen) {
             console.log("Valid invite detected & user not logged in, opening sign up modal.");
             handleCloseLoginModal(); // Ensure login is closed
             handleSignUpClick(); // Trigger sign up modal opening
         }
     }, [inviteStatus, authLoading, currentUser, isLoginModalOpen, isSignUpModalOpen, handleSignUpClick, handleCloseLoginModal, inviteCheckComplete]);


    // --- Combine Warning Messages ---
    // Combine DB/Verification warnings, Invite errors are handled separately for clarity
    const displayWarning = verificationWarning || dataWarningMessage;

    // --- UI Action Handlers that trigger logic or set modal state ---
    const handleAddPersonClick = useCallback((clickedNodeId: string) => {
        // Check verification status inside useTreeData's handleAddPerson now
        console.log(`UI: Add clicked under node ID: ${clickedNodeId}`);
        setTargetParentId(clickedNodeId);
        setPersonToEdit(null);
        setEditMode('add');
        setIsPersonFormOpen(true);
    }, []); // Removed currentUser dependency

    const handleEditPersonClick = useCallback((person: Person) => {
        // Check verification status inside useTreeData's handleEditPerson now
        setPersonToEdit(person);
        setTargetParentId(null);
        setEditMode('edit');
        setIsPersonFormOpen(true);
    }, []); // Removed currentUser dependency

    const handleDeletePersonClick = useCallback((personId: string, personName: string) => {
         // Check verification status inside useTreeData's handleDeletePerson now
        setPersonToDelete({ id: personId, name: personName });
        setIsDeleteConfirmOpen(true);
    }, []); // Removed currentUser dependency

    const handlePersonFormSubmit = useCallback(async (
        personFormData: Omit<Person, 'id' | 'parentId' | 'children'> & { id?: string }
    ) => {
        let success = false;
        // Verification is checked within handleAddPerson/handleEditPerson now
        if (editMode === 'edit' && personToEdit?.id) {
            success = await handleEditPerson({ ...personFormData, id: personToEdit.id });
        } else if (editMode === 'add' && targetParentId) {
            success = await handleAddPerson(personFormData, targetParentId);
        } else {
            console.error("Invalid state for form submission: editMode or targetParentId missing.");
            alert("Error submitting form."); return;
        }

        if (success) {
            setIsPersonFormOpen(false);
            setPersonToEdit(null);
            setTargetParentId(null);
        }
        // Form closes on success, stays open on failure (alert shown by hook)
    }, [editMode, targetParentId, personToEdit, handleAddPerson, handleEditPerson]);

    const handleConfirmDelete = useCallback(async () => {
        if (!personToDelete) return;
        // Verification is checked within handleDeletePerson now
        const success = await handleDeletePerson(personToDelete.id);
        if (success) {
            setIsDeleteConfirmOpen(false);
            setPersonToDelete(null);
        } // Stays open on failure (alert shown by hook)
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
    // Corrected Loading Check: Show loading if Firebase is available but auth or invite checks are ongoing.
    // The AppLayout component will handle showing errors if initialFirebaseStatus is 'config_error' or 'unavailable'.
    if (initialFirebaseStatus === 'available' && (authLoading || !inviteCheckComplete)) {
        return <div className="loading">Initializing Auth & Invite...</div>;
    }

    // If not loading and Firebase is available, or if Firebase has issues, render AppLayout.
    // AppLayout internally displays warnings based on firebaseStatus and other props.
    return (
        <AppLayout
            // --- Auth Props ---
            currentUser={currentUser}
            authLoading={authLoading} // Pass down loading state
            isLoginModalOpen={isLoginModalOpen}
            isSignUpModalOpen={isSignUpModalOpen}
            verificationWarning={verificationWarning}
            resendCooldownActive={resendCooldownActive}
            resendStatusMessage={resendStatusMessage}
            handleLoginClick={handleLoginClick}
            handleLogoutClick={handleLogoutClick}
            handleSignUpClick={handleSignUpClick} // Pass down for explicit button/link if needed elsewhere
            handleCloseLoginModal={handleCloseLoginModal}
            handleCloseSignUpModal={handleCloseSignUpModal}
            handleSwitchToLogin={handleSwitchToLogin}
            handleSwitchToSignUp={handleSwitchToSignUp}
            handleResendVerificationEmail={handleResendVerificationEmail}
             // --- Invite Props ---
             inviteTokenId={inviteTokenId}
             inviteStatus={inviteStatus}
             inviteError={inviteError}
             inviteCheckComplete={inviteCheckComplete} // Pass down check status
             generateInvite={generateInvite}
             markInviteAsUsed={markInviteAsUsed}
             // --- Password Reset Props ---
             passwordResetEmail={passwordResetEmail}
             setPasswordResetEmail={setPasswordResetEmail}
             passwordResetLoading={passwordResetLoading}
             passwordResetMessage={passwordResetMessage}
             passwordResetError={passwordResetError}
             handlePasswordReset={handlePasswordReset}
            // --- Tree Data Props ---
            treeData={treeData}
            dbDataStatus={dbDataStatus}
            warningMessage={displayWarning} // Pass combined DB/Verification warnings
            handleImportData={handleImportData}
            handleExportData={handleExportData}
            handleAddPersonClick={handleAddPersonClick}
            handleDeletePersonClick={handleDeletePersonClick}
            handleEditPersonClick={handleEditPersonClick}
            handleNodeClick={handleNodeClick}
            // --- Dropdown Options ---
            familyNameOptions={familyNameOptions}
            naipeOptions={naipeOptions}
            instrumentOptions={instrumentOptions}
            hierarchyOptions={hierarchyOptions}
            // --- UI / Modal State ---
            firebaseStatus={initialFirebaseStatus} // Pass the initial status
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
            setPendingSubmitData={() => {}} // Dummy setter, not used
            setOnGenericConfirm={setOnGenericConfirm}
        />
    );
}

export default App;