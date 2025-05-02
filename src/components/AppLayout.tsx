// src/components/AppLayout.tsx
import React, { useState, useRef } from 'react'; // Added useState, useRef
import { User } from 'firebase/auth';
import { Person } from '../types/models';
import AccountIndicator from './auth/AccountIndicator';
import ExportImport from './ExportImport';
import GenealogyTree from './GenealogyTree';
import LoginModal from './auth/LoginModal';
import SignUpModal from './auth/SignUpModal';
import PersonForm from './PersonForm';
import Modal from './Modal'; // Generic modal
import PersonDetailsModal from './PersonDetailsModal';
import * as AppStrings from '../constants/strings';
import { InviteStatus } from '../hooks/useAuth'; // Import InviteStatus type
import { Copy } from 'react-feather'; // Icon for copy button

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
    handleSignUpClick: () => void; // Still needed to trigger invite check/alert
    handleCloseLoginModal: () => void;
    handleCloseSignUpModal: () => void;
    handleSwitchToLogin: () => void;
    handleSwitchToSignUp: () => void;
    handleResendVerificationEmail: () => void;

    // --- Invite Props ---
    inviteTokenId: string | null;
    inviteStatus: InviteStatus;
    inviteError: string | null;
    inviteCheckComplete: boolean;
    generateInvite: () => Promise<string | null>;
    markInviteAsUsed: (tokenId: string, usedByEmail: string) => Promise<boolean>;

     // --- Password Reset Props ---
     passwordResetEmail: string;
     setPasswordResetEmail: React.Dispatch<React.SetStateAction<string>>;
     passwordResetLoading: boolean;
     passwordResetMessage: string | null;
     passwordResetError: string | null;
     handlePasswordReset: (event: React.FormEvent) => Promise<void>;


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
    handleSwitchToSignUp, handleResendVerificationEmail,
    // Invite
    inviteTokenId, inviteStatus, inviteError, inviteCheckComplete, generateInvite, markInviteAsUsed,
    // Password Reset
    passwordResetEmail, setPasswordResetEmail, passwordResetLoading, passwordResetMessage, passwordResetError, handlePasswordReset,
    // Tree
    treeData, dbDataStatus, warningMessage,
    handleImportData, handleExportData, handleAddPersonClick, handleDeletePersonClick,
    handleEditPersonClick, handleNodeClick,
    // Dropdowns
    familyNameOptions, naipeOptions, instrumentOptions, hierarchyOptions,
    // UI State
    firebaseStatus, isPersonFormOpen, personToEdit, editMode, isDeleteConfirmOpen,
    personToDelete, isGenericConfirmOpen, genericConfirmMessage, isDetailsModalOpen,
    selectedPersonForDetails, setIsPersonFormOpen, handlePersonFormSubmit, setIsDeleteConfirmOpen,
    handleConfirmDelete, setIsGenericConfirmOpen, handleCloseDetailsModal, onGenericConfirm,
    setPendingSubmitData, setOnGenericConfirm
}) => {

    // --- State for Invite Link Modal ---
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
    const [inviteGenLoading, setInviteGenLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const inviteLinkRef = useRef<HTMLInputElement>(null);

    // Derived state for rendering
    const showTree = !(dbDataStatus === 'loading' && firebaseStatus === 'available');
    const userCanModify = !!currentUser && !!currentUser.emailVerified;

    // --- Handler for Generate Invite Button Click ---
    const handleGenerateInviteClick = async () => {
        setInviteGenLoading(true);
        setGeneratedInviteLink(null);
        setCopied(false);
        const link = await generateInvite();
        if (link) {
            setGeneratedInviteLink(link);
            setIsInviteModalOpen(true);
        } else {
             // Error handled by alert within generateInvite hook
        }
        setInviteGenLoading(false);
    };

    const handleCopyInviteLink = () => {
        if (inviteLinkRef.current) {
             inviteLinkRef.current.select();
             try {
                 navigator.clipboard.writeText(inviteLinkRef.current.value);
                 setCopied(true);
                 setTimeout(() => setCopied(false), 2000); // Reset copied status after 2s
             } catch (err) {
                 console.error('Failed to copy invite link: ', err);
                 alert('Failed to copy link.');
             }
        }
    };

    const handleCloseInviteModal = () => {
         setIsInviteModalOpen(false);
         setGeneratedInviteLink(null);
         setCopied(false);
    };

    // Show initial invite check status/error if applicable
    const initialInviteMessage = !inviteCheckComplete ? AppStrings.INVITE_CHECKING : inviteError;


    return (
        <div className="App">
            {/* -- Apply flexbox styling to the header -- */}
            <header className="App-header">
                {/* Container for top-right elements */}
                <div style={styles.headerTopRight}>
                    {firebaseStatus !== 'config_error' && (
                         <AccountIndicator
                            currentUser={currentUser}
                            onLoginClick={handleLoginClick}
                            onLogoutClick={handleLogoutClick}
                            onGenerateInviteClick={handleGenerateInviteClick}
                            authLoading={authLoading}
                         />
                     )}
                     {/* Removed authLoading indicator text as it's handled in AccountIndicator */}
                     {/* {authLoading && firebaseStatus !== 'config_error' && <div style={{position: 'absolute', top: '15px', right: '20px', zIndex: 110}}>Loading User...</div>} */}
                 </div>

                 {/* Main Title */}
                 <h1 style={styles.mainTitle}>Família TAISCTE</h1>

                 {/* Warnings Area */}
                 <div style={styles.warningsContainer}>
                    {/* Display initial invite status/error if present */}
                    {inviteTokenId && initialInviteMessage && (
                         <div className="firebase-warning warning">
                             <p>{initialInviteMessage}</p>
                         </div>
                    )}
                    {/* Combined warning message */}
                    {warningMessage && !initialInviteMessage /* Avoid double display */ && (
                        <div className={`firebase-warning ${dbDataStatus === 'error' || firebaseStatus === 'config_error' || verificationWarning ? 'warning' : ''}`}>
                            <p style={{ whiteSpace: 'pre-line' }}>
                                {warningMessage}
                                {currentUser && !currentUser.emailVerified && verificationWarning && (
                                    <button onClick={handleResendVerificationEmail} disabled={resendCooldownActive} style={styles.resendLinkButton} title={resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT}>
                                        {resendCooldownActive ? AppStrings.VERIFICATION_RESEND_WAIT : AppStrings.VERIFICATION_RESEND_PROMPT}
                                    </button>
                                )}
                            </p>
                            {resendStatusMessage && verificationWarning && (
                                <p style={{ fontSize: '0.8em', marginTop: '5px', color: resendStatusMessage.startsWith('Failed') ? 'red' : 'green' }}>
                                    {resendStatusMessage}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <ExportImport {...{ onImport: handleImportData, onExport: handleExportData, isUserLoggedIn: !!currentUser, isFirebaseAvailable: firebaseStatus === 'available' }} />

                <div className="tree-container">
                {!showTree ? ( <div className="loading">Loading tree data...</div> ) : // Updated loading message
                treeData.length === 0 && dbDataStatus !== 'loading' ? ( <div className="loading">Tree is empty. Add the first member or import data.</div> ) : // Updated empty message
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
            {firebaseStatus !== 'config_error' && (
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={handleCloseLoginModal}
                    onSwitchToSignUp={handleSwitchToSignUp} // Still needed
                    // Pass Password Reset props
                    onPasswordReset={handlePasswordReset}
                    passwordResetEmail={passwordResetEmail}
                    setPasswordResetEmail={setPasswordResetEmail}
                    passwordResetLoading={passwordResetLoading}
                    passwordResetMessage={passwordResetMessage}
                    passwordResetError={passwordResetError}
                />
            )}
            {firebaseStatus !== 'config_error' && (
                <SignUpModal
                    isOpen={isSignUpModalOpen}
                    onClose={handleCloseSignUpModal}
                    onSwitchToLogin={handleSwitchToLogin}
                    // Pass Invite props
                    inviteTokenId={inviteTokenId}
                    inviteStatus={inviteStatus}
                    markInviteAsUsed={markInviteAsUsed}
                />
            )}

            {/* --- Invite Link Generation Modal --- */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={handleCloseInviteModal}
                onConfirm={handleCopyInviteLink} // Use confirm button to copy
                title={AppStrings.INVITE_GENERATE_SUCCESS_TITLE}
                confirmText={copied ? AppStrings.INVITE_COPIED_MSG : AppStrings.INVITE_COPY_BUTTON}
                cancelText={AppStrings.INVITE_CLOSE_BUTTON}
            >
                 <p>{AppStrings.INVITE_GENERATE_SUCCESS_MSG}</p>
                 <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px'}}>
                    <input
                        ref={inviteLinkRef}
                        type="text"
                        value={generatedInviteLink || ''}
                        readOnly
                        style={styles.inviteLinkInput}
                        onClick={(e) => (e.target as HTMLInputElement).select()} // Select on click
                    />
                     <button onClick={handleCopyInviteLink} style={styles.copyButton} title="Copy Link">
                         <Copy size={16} />
                     </button>
                 </div>
                 {copied && <p style={{color: 'green', fontSize: '12px', marginTop: '5px'}}>{AppStrings.INVITE_COPIED_MSG}</p>}
            </Modal>

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
    // Remove absolute positioning, use flex for header layout
    headerTopRight: {
        display: 'flex',
        justifyContent: 'flex-end', // Align items to the right
        width: '100%', // Take full width to push content right
        marginBottom: '10px', // Add space below indicator
    },
    mainTitle: {
        width: '100%', // Ensure title takes width for centering
        textAlign: 'center', // Center title text
        margin: '0 0 15px 0', // Adjust margins
        order: -1, // Optionally move title visually above indicator on wrap (if header is row)
    },
    warningsContainer: {
         width: '100%', // Make warnings take full width
         marginBottom: '15px', // Space below warnings
    },
    resendLinkButton: { background: 'none', border: 'none', color: '#0056b3', textDecoration: 'underline', cursor: 'pointer', padding: '0 5px', fontSize: 'inherit', marginLeft: '5px', },
    // Invite Modal Styles
    inviteLinkInput: {
        flexGrow: 1,
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
        backgroundColor: '#f8f9fa', // Slightly different background
    },
    copyButton: {
        padding: '8px 10px',
        cursor: 'pointer',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default AppLayout;