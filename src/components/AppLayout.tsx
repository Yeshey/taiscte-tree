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

// Define Props needed by the layout component - Updated
interface AppLayoutProps {
    // Auth State & Handlers
    currentUser: User | null;
    authLoading: boolean;
    isLoginModalOpen: boolean;
    isSignUpModalOpen: boolean;
    verificationWarning: string | null;
    resendCooldownActive: boolean;
    resendStatusMessage: string | null;
    handleLoginClick: () => void;
    handleLogoutClick: () => void;
    handleSignUpClick: () => void;
    handleCloseLoginModal: () => void;
    handleCloseSignUpModal: () => void;
    handleSwitchToLogin: () => void;
    handleSwitchToSignUp: () => void;
    handleResendVerificationEmail: () => void;

    // Tree Data State & Handlers
    treeData: Person[];
    dbDataStatus: 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
    warningMessage: string | null; // Combined warning message
    handleImportData: (data: Person[]) => void; // Simplified signature if async not needed by layout
    handleExportData: () => Person[];
    handleAddPersonClick: (padrinhoId: string) => void;
    handleDeletePersonClick: (personId: string, personName: string) => void;
    handleEditPersonClick: (person: Person) => void;
    handleNodeClick: (person: Person) => void;

    // Dropdown Options
    familyNameOptions: string[];
    naipeOptions: string[];
    instrumentOptions: string[];
    hierarchyOptions: string[];

    // Modal State & Handlers (Managed by App, passed down)
    firebaseStatus: 'checking' | 'config_error' | 'unavailable' | 'available';
    isPersonFormOpen: boolean;
    personToEdit: Person | null;
    editMode: 'add' | 'edit';
    isDeleteConfirmOpen: boolean;
    personToDelete: { id: string, name: string } | null;
    isGenericConfirmOpen: boolean;
    genericConfirmMessage: string;
    isDetailsModalOpen: boolean;
    selectedPersonForDetails: Person | null;
    setIsPersonFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handlePersonFormSubmit: (personFormData: Omit<Person, "id" | "children" | "padrinhoId"> & { id?: string | undefined; }) => void;
    setIsDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleConfirmDelete: () => void;
    setIsGenericConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleCloseDetailsModal: () => void;
    onGenericConfirm: (() => void) | null;
    setPendingSubmitData: React.Dispatch<React.SetStateAction<Omit<Person, "id" | "children" | "padrinhoId"> & { id?: string | undefined; } | null>>; // Adjust type if needed
    setOnGenericConfirm: React.Dispatch<React.SetStateAction<(() => void) | null>>;
}


const AppLayout: React.FC<AppLayoutProps> = ({
    // Destructure all props...
    currentUser, authLoading, isLoginModalOpen, isSignUpModalOpen, verificationWarning,
    resendCooldownActive, resendStatusMessage, handleLoginClick, handleLogoutClick,
    handleSignUpClick, handleCloseLoginModal, handleCloseSignUpModal, handleSwitchToLogin,
    handleSwitchToSignUp, handleResendVerificationEmail, treeData, dbDataStatus, warningMessage,
    handleImportData, handleExportData, handleAddPersonClick, handleDeletePersonClick,
    handleEditPersonClick, handleNodeClick, familyNameOptions, naipeOptions,
    instrumentOptions, hierarchyOptions, firebaseStatus, isPersonFormOpen, personToEdit,
    editMode, isDeleteConfirmOpen, personToDelete, isGenericConfirmOpen, genericConfirmMessage,
    isDetailsModalOpen, selectedPersonForDetails, setIsPersonFormOpen, handlePersonFormSubmit,
    setIsDeleteConfirmOpen, handleConfirmDelete, setIsGenericConfirmOpen, handleCloseDetailsModal,
    onGenericConfirm, setPendingSubmitData, setOnGenericConfirm // Make sure to destructure all passed props
}) => {

    // Derived state for rendering
    const showTree = !(dbDataStatus === 'loading' && firebaseStatus === 'available');
    const userCanModify = !!currentUser && !!currentUser.emailVerified;

    return (
        <div className="App">
            <header className="App-header">
                {/* Account Indicator */}
                {firebaseStatus !== 'config_error' && (<AccountIndicator {...{ currentUser, onLoginClick: handleLoginClick, onLogoutClick: handleLogoutClick, onSignUpClick: handleSignUpClick }}/> )}
                {authLoading && firebaseStatus !== 'config_error' && <div style={{position: 'absolute', top: '15px', right: '20px', zIndex: 110}}>Loading User...</div>}

                <h1>Família TAISCTE</h1>

                {/* Warnings - Use combined warningMessage prop */}
                {warningMessage && ( <div className={`firebase-warning ${dbDataStatus === 'error' || firebaseStatus === 'config_error' || verificationWarning ? 'warning' : ''}`}> <p style={{ whiteSpace: 'pre-line'}}> {warningMessage} {/* Display combined warning */} {currentUser && !currentUser.emailVerified && verificationWarning && ( /* Show resend button only if verification warning is active */ <button onClick={handleResendVerificationEmail} disabled={resendCooldownActive} style={styles.resendLinkButton} title={resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT}> {resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT} </button> )} </p> {resendStatusMessage && verificationWarning && ( /* Show status only if verification warning active */ <p style={{fontSize: '0.8em', marginTop: '5px', color: resendStatusMessage.startsWith('Failed') ? 'red' : 'green' }}> {resendStatusMessage} </p> )} </div> )}


                <ExportImport {...{ onImport: handleImportData, onExport: handleExportData, isUserLoggedIn: !!currentUser, isFirebaseAvailable: firebaseStatus === 'available' }} />

                <div className="tree-container">
                {!showTree ? ( <div className="loading">Loading tree data from Firebase...</div> ) :
                treeData.length === 0 && dbDataStatus !== 'loading' ? ( <div className="loading">Tree is empty. Add the first member.</div> ) :
                ( <GenealogyTree
                        data={treeData}
                        allPeople={treeData} // Pass allPeople if needed by GenealogyTree/CustomNode directly
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

            {/* Only render Generic Confirm Modal if needed */}
            {isGenericConfirmOpen && (
                 <Modal isOpen={isGenericConfirmOpen} onClose={() => { setIsGenericConfirmOpen(false); /* setPendingSubmitData(null); */ setOnGenericConfirm(null); }} onConfirm={() => { if (onGenericConfirm) { onGenericConfirm(); } setIsGenericConfirmOpen(false); }} title="Confirm Action" confirmText="Continue" cancelText="Cancel" >
                    <p>{genericConfirmMessage}</p>
                </Modal>
             )}


            <PersonDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                person={selectedPersonForDetails}
                allPeople={treeData} // Pass allPeople if needed by DetailsModal
            />
        </div>
    );
}

// Styles needed only for layout elements within AppLayout
const styles: { [key: string]: React.CSSProperties } = {
    resendLinkButton: { background: 'none', border: 'none', color: '#0056b3', textDecoration: 'underline', cursor: 'pointer', padding: '0 5px', fontSize: 'inherit', marginLeft: '5px', },
};

export default AppLayout;