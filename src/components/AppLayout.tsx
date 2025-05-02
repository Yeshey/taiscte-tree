// src/components/AppLayout.tsx
import React from 'react';
import { User } from 'firebase/auth';
import { Person } from '../types/models';
import AccountIndicator from './auth/AccountIndicator';
import ExportImport from './ExportImport';
import GenealogyTree from './GenealogyTree';
import LoginModal from './auth/LoginModal';
import SignUpModal from './auth/SignUpModal';
import PersonForm from './PersonForm';
import Modal from './Modal';
import PersonDetailsModal from './PersonDetailsModal';
import * as AppStrings from '../constants/strings';

// Define Props needed by the layout component
interface AppLayoutProps {
    // Data & State
    treeData: Person[];
    currentUser: User | null;
    authLoading: boolean;
    firebaseStatus: 'checking' | 'config_error' | 'unavailable' | 'available';
    dbDataStatus: 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
    warningMessage: string | null;
    verificationWarning: string | null;
    resendCooldownActive: boolean;
    resendStatusMessage: string | null;
    isLoginModalOpen: boolean;
    isSignUpModalOpen: boolean;
    isPersonFormOpen: boolean;
    personToEdit: Person | null;
    editMode: 'add' | 'edit';
    isDeleteConfirmOpen: boolean;
    personToDelete: { id: string, name: string } | null;
    isGenericConfirmOpen: boolean;
    genericConfirmMessage: string;
    isDetailsModalOpen: boolean;
    selectedPersonForDetails: Person | null;

    // Dropdown options for PersonForm
    familyNameOptions: string[];
    naipeOptions: string[];
    instrumentOptions: string[];
    hierarchyOptions: string[];

    // Callbacks & Handlers
    handleLoginClick: () => void;
    handleLogoutClick: () => void;
    handleSignUpClick: () => void;
    handleResendVerificationEmail: () => void;
    handleImportData: (data: Person[]) => Promise<void> | void; // Match original type
    handleExportData: () => Person[];
    handleAddPersonClick: (padrinhoId: string) => void;
    handleDeletePersonClick: (personId: string, personName: string) => void;
    handleEditPersonClick: (person: Person) => void;
    handleNodeClick: (person: Person) => void;
    handleCloseLoginModal: () => void;
    handleSwitchToSignUp: () => void;
    handleCloseSignUpModal: () => void;
    handleSwitchToLogin: () => void;
    setIsPersonFormOpen: React.Dispatch<React.SetStateAction<boolean>>; // Allow closing form
    handlePersonFormSubmit: (personFormData: Omit<Person, "id" | "children" | "padrinhoId"> & { id?: string | undefined; }) => void;
    setIsDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleConfirmDelete: () => void;
    setIsGenericConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleCloseDetailsModal: () => void;
    onGenericConfirm: (() => void) | null; // Need to pass this for generic modal
    setPendingSubmitData: React.Dispatch<React.SetStateAction<Omit<Person, "id" | "children" | "padrinhoId"> & { id?: string | undefined; } | null>>;
    setOnGenericConfirm: React.Dispatch<React.SetStateAction<(() => void) | null>>;
}

const AppLayout: React.FC<AppLayoutProps> = ({
    treeData, currentUser, authLoading, firebaseStatus, dbDataStatus,
    warningMessage, verificationWarning, resendCooldownActive, resendStatusMessage,
    isLoginModalOpen, isSignUpModalOpen, isPersonFormOpen, personToEdit, editMode,
    isDeleteConfirmOpen, personToDelete, isGenericConfirmOpen, genericConfirmMessage,
    isDetailsModalOpen, selectedPersonForDetails,
    familyNameOptions, naipeOptions, instrumentOptions, hierarchyOptions,
    handleLoginClick, handleLogoutClick, handleSignUpClick, handleResendVerificationEmail,
    handleImportData, handleExportData, handleAddPersonClick, handleDeletePersonClick,
    handleEditPersonClick, handleNodeClick, handleCloseLoginModal, handleSwitchToSignUp,
    handleCloseSignUpModal, handleSwitchToLogin, setIsPersonFormOpen, handlePersonFormSubmit,
    setIsDeleteConfirmOpen, handleConfirmDelete, setIsGenericConfirmOpen, handleCloseDetailsModal,
    onGenericConfirm, setPendingSubmitData, setOnGenericConfirm
}) => {

    // Derived state for rendering
    const showTree = !(dbDataStatus === 'loading' && firebaseStatus === 'available');
    const userCanModify = !!currentUser && !!currentUser.emailVerified;

    // Initializing check handled in App.tsx
    // if (firebaseStatus === 'checking') { ... }

    return (
        <div className="App">
            <header className="App-header">
                {/* Account Indicator */}
                {firebaseStatus !== 'config_error' && (<AccountIndicator {...{ currentUser, onLoginClick: handleLoginClick, onLogoutClick: handleLogoutClick, onSignUpClick: handleSignUpClick }}/> )}
                {authLoading && firebaseStatus !== 'config_error' && <div style={{position: 'absolute', top: '15px', right: '20px', zIndex: 110}}>Loading User...</div>}

                <h1>Família TAISCTE</h1>

                {/* Warnings */}
                {verificationWarning && ( <div className="firebase-warning warning"> <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '5px' }}> <span>{verificationWarning}</span> {currentUser && !currentUser.emailVerified && ( <button onClick={handleResendVerificationEmail} disabled={resendCooldownActive} style={styles.resendLinkButton} title={resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT}> {resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT} </button> )} </p> {resendStatusMessage && ( <p style={{fontSize: '0.8em', marginTop: '5px', color: resendStatusMessage.startsWith('Failed') ? 'red' : 'green' }}> {resendStatusMessage} </p> )} </div> )}
                {warningMessage && !verificationWarning && ( <div className={`firebase-warning ${dbDataStatus === 'error' || firebaseStatus === 'config_error' ? 'error' : ''}`}><p style={{ whiteSpace: 'pre-line'}}>{warningMessage}</p></div> )}

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

            {/* Modals */}
            {firebaseStatus !== 'config_error' && (<LoginModal {...{isOpen: isLoginModalOpen, onClose: handleCloseLoginModal, onSwitchToSignUp: handleSwitchToSignUp}} />)}
            {firebaseStatus !== 'config_error' && (<SignUpModal {...{isOpen: isSignUpModalOpen, onClose: handleCloseSignUpModal, onSwitchToLogin: handleSwitchToLogin}} />)}

            <PersonForm
                isOpen={isPersonFormOpen}
                onClose={() => setIsPersonFormOpen(false)} // Simple close handler
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

// Styles needed only for layout elements within AppLayout (like resend button)
const styles: { [key: string]: React.CSSProperties } = {
    resendLinkButton: { background: 'none', border: 'none', color: '#0056b3', textDecoration: 'underline', cursor: 'pointer', padding: '0 5px', fontSize: 'inherit', marginLeft: '5px', },
};

export default AppLayout;