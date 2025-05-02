// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged, signOut, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get, set, DatabaseReference, Database } from 'firebase/database'; // Import database types
import { auth, database, isFirebaseAvailable } from '../firebase'; // Assuming firebase.ts exports these
import * as AppStrings from '../constants/strings';
import { InviteToken } from '../types/models'; // Import InviteToken type

export type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available';
export type InviteStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'used' | 'not_found' | 'error';

// Helper function to get query parameters
const getQueryParam = (param: string): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
};

// Type guard for Database
function isDatabase(db: Database | null): db is Database {
    return db !== null;
}


export function useAuth(firebaseStatus: FirebaseStatus) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState<boolean>(false);
    const [verificationWarning, setVerificationWarning] = useState<string | null>(null);
    const [resendCooldownActive, setResendCooldownActive] = useState(false);
    const [resendStatusMessage, setResendStatusMessage] = useState<string | null>(null);

    // --- Invite State ---
    const [inviteTokenId, setInviteTokenId] = useState<string | null>(null);
    const [inviteStatus, setInviteStatus] = useState<InviteStatus>('idle');
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteCheckComplete, setInviteCheckComplete] = useState<boolean>(false);

    // --- Password Reset State ---
    const [passwordResetEmail, setPasswordResetEmail] = useState<string>('');
    const [passwordResetLoading, setPasswordResetLoading] = useState<boolean>(false);
    const [passwordResetMessage, setPasswordResetMessage] = useState<string | null>(null);
    const [passwordResetError, setPasswordResetError] = useState<string | null>(null);

    // --- Invite Token Check ---
    useEffect(() => {
        const tokenFromUrl = getQueryParam('invite');
        setInviteTokenId(tokenFromUrl);

        if (tokenFromUrl && firebaseStatus === 'available') {
            // Initial check remains good practice
            if (!isDatabase(database)) {
                 setInviteStatus('error');
                 setInviteError(AppStrings.INVITE_ERROR_FIREBASE_UNAVAILABLE);
                 setInviteCheckComplete(true);
                 console.error("Database service is unavailable when checking invite token.");
                 return;
            }

            const checkToken = async () => {
                // --- Re-check INSIDE the async function ---
                // This explicitly tells TypeScript database is non-null *in this scope*
                if (!isDatabase(database)) {
                    console.error("Database became null unexpectedly inside checkToken");
                    setInviteStatus('error');
                    setInviteError(AppStrings.INVITE_ERROR_FIREBASE_UNAVAILABLE);
                    setInviteCheckComplete(true);
                    return;
                }
                // --- End Re-check ---

                setInviteStatus('checking');
                setInviteError(null);
                setInviteCheckComplete(false); // Mark as not complete until try/finally runs
                console.log(`Checking invite token: ${tokenFromUrl}`);

                // 'database' is now known to be non-null here by TypeScript
                const inviteRef: DatabaseReference = ref(database, `invites/${tokenFromUrl}`);
                try {
                    const snapshot = await get(inviteRef);
                    if (snapshot.exists()) {
                        const tokenData = snapshot.val() as InviteToken;
                        if (tokenData.status === 'unused') {
                            setInviteStatus('valid');
                            console.log("Invite token is valid and unused.");
                        } else {
                            setInviteStatus('used');
                            setInviteError(AppStrings.INVITE_ERROR_USED);
                            console.warn("Invite token has already been used.");
                        }
                    } else {
                        setInviteStatus('not_found');
                        setInviteError(AppStrings.INVITE_ERROR_NOT_FOUND);
                        console.warn("Invite token not found.");
                    }
                } catch (error: any) {
                    setInviteStatus('error');
                    setInviteError(AppStrings.INVITE_ERROR_CHECK_FAILED(error.message));
                    console.error("Error checking invite token:", error);
                } finally {
                     setInviteCheckComplete(true); // Mark as complete even on error
                }
            };
            checkToken(); // Call the async function
        } else if (tokenFromUrl && firebaseStatus !== 'checking') {
             setInviteStatus('error'); // If firebase isn't ready but token exists
             setInviteError(AppStrings.INVITE_ERROR_FIREBASE_UNAVAILABLE);
             setInviteCheckComplete(true);
        } else {
            setInviteStatus('idle'); // No token in URL
            setInviteCheckComplete(true); // No check needed
        }
    }, [firebaseStatus]); // Rerun when firebaseStatus changes

    // Effect for Auth State Changes (No significant changes needed here)
    useEffect(() => {
        if (firebaseStatus === 'available' && auth) {
            setAuthLoading(true); // Start loading when listener attaches
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
            // If Firebase isn't available or check finished, stop loading
            setCurrentUser(null); // Ensure no stale user
            setAuthLoading(false);
        }
    }, [firebaseStatus]); // Rerun when firebaseStatus changes

    // --- Modal Control Handlers ---
    const handleLoginClick = useCallback(() => {
        if (firebaseStatus !== 'config_error' && isFirebaseAvailable) {
            setIsSignUpModalOpen(false); // Close signup if open
            setPasswordResetMessage(null); // Clear password reset messages
            setPasswordResetError(null);
            setIsLoginModalOpen(true);
        } else {
            alert(AppStrings.LOGIN_UNAVAILABLE);
        }
    }, [firebaseStatus]);

    // Signup now requires a valid invite
    const handleSignUpClick = useCallback(() => {
        if (firebaseStatus !== 'config_error' && isFirebaseAvailable) {
             // Also check inviteCheckComplete
             if (inviteCheckComplete) {
                 if (inviteStatus === 'valid') {
                     setIsLoginModalOpen(false); // Close login if open
                     setIsSignUpModalOpen(true);
                 } else {
                     alert(inviteError || AppStrings.SIGNUP_REQUIRES_INVITE);
                 }
             } else {
                 alert(AppStrings.INVITE_CHECKING); // Inform user if still checking
             }
        } else {
            alert(AppStrings.SIGNUP_UNAVAILABLE);
        }
    }, [firebaseStatus, inviteStatus, inviteError, inviteCheckComplete]); // Add inviteCheckComplete dependency


    const handleCloseLoginModal = useCallback(() => {
        setIsLoginModalOpen(false);
        setPasswordResetEmail(''); // Clear email on close
        setPasswordResetMessage(null);
        setPasswordResetError(null);
    }, []);
    const handleCloseSignUpModal = useCallback(() => setIsSignUpModalOpen(false), []);

    const handleSwitchToLogin = useCallback(() => {
        setIsSignUpModalOpen(false);
        handleLoginClick(); // Use existing handler to open login
    }, [handleLoginClick]);

    // Switching to signup doesn't make sense without an invite link anymore
    // We keep the function signature but it checks for invite validity
    const handleSwitchToSignUp = useCallback(() => {
        setIsLoginModalOpen(false);
        handleSignUpClick(); // Use existing handler which checks invite
    }, [handleSignUpClick]);

    // --- Auth Action Handlers ---
    const handleLogoutClick = useCallback(async () => {
        if (!auth) {
            console.error("Logout failed: Firebase auth object is null.");
            alert(AppStrings.AUTH_SERVICE_UNAVAILABLE);
            return;
        }
        try {
            await signOut(auth);
            console.log("Sign out successful via Firebase.");
            // currentUser state updates via onAuthStateChanged listener
        } catch (error: any) {
            console.error("Logout Error:", error);
            alert(AppStrings.LOGOUT_FAILED(error.message || 'Unknown error'));
        }
    }, []); // Depends only on `auth` which is module-level

    const handleResendVerificationEmail = useCallback(async () => {
        if (!currentUser || resendCooldownActive || !auth || currentUser.emailVerified) {
            console.log("Resend condition not met:", { currentUser: !!currentUser, resendCooldownActive, auth: !!auth, verified: currentUser?.emailVerified });
            return;
        }

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
            setTimeout(() => setResendCooldownActive(false), 10000); // 10 second cooldown
        }
    }, [currentUser, resendCooldownActive]); // Depends on currentUser and cooldown state

    // --- New: Invite Generation ---
    const generateInvite = useCallback(async (): Promise<string | null> => {
        // Check database instance explicitly
        if (!currentUser || !currentUser.emailVerified || !isDatabase(database)) {
            console.error("Cannot generate invite: User not verified or DB unavailable.");
            alert(AppStrings.INVITE_GENERATE_ERROR_PERMISSIONS);
            return null;
        }

        const newTokenId = crypto.randomUUID();
        // 'database' is guaranteed non-null here
        const newInviteRef = ref(database, `invites/${newTokenId}`);
        const inviteData: InviteToken = {
            id: newTokenId,
            status: 'unused',
            creatorUid: currentUser.uid,
        };

        try {
            await set(newInviteRef, inviteData);
            console.log(`Invite token ${newTokenId} created by ${currentUser.email}`);
            const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${newTokenId}`;
            return inviteUrl;
        } catch (error: any) {
            console.error("Error creating invite token in DB:", error);
            alert(AppStrings.INVITE_GENERATE_ERROR_DB(error.message));
            return null;
        }
    }, [currentUser]); // Depends on currentUser

    // --- New: Mark Invite as Used (Called from SignUpModal) ---
    const markInviteAsUsed = useCallback(async (tokenId: string, usedByEmail: string): Promise<boolean> => {
        // Check database instance explicitly
        if (!isDatabase(database) || !tokenId) {
            console.error("Cannot mark invite as used: DB unavailable or no token ID.");
            return false;
        }

        // 'database' is guaranteed non-null here
        const inviteRef = ref(database, `invites/${tokenId}`);
        try {
            const snapshot = await get(inviteRef);
            if (!snapshot.exists()) {
                console.error("Cannot mark invite as used: Token not found.");
                return false;
            }
            const existingData = snapshot.val() as InviteToken;
            if (existingData.status === 'used') {
                 console.warn(`Invite ${tokenId} already marked as used.`);
                 return true; // Already used, consider it a success
            }

            const updates = {
                status: 'used',
                usedByEmail: usedByEmail,
                creatorUid: existingData.creatorUid
            };

            await set(inviteRef, updates);
            console.log(`Invite token ${tokenId} marked as used by ${usedByEmail}.`);
            setInviteStatus('used');
            return true;
        } catch (error: any) {
            console.error(`Error marking invite token ${tokenId} as used:`, error);
            return false; // Indicate failure
        }
    }, []); // No dependencies needed

     // --- New: Password Reset ---
    const handlePasswordReset = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        if (!auth) {
            setPasswordResetError(AppStrings.AUTH_SERVICE_UNAVAILABLE);
            return;
        }
        if (!passwordResetEmail) {
             setPasswordResetError(AppStrings.PASSWORD_RESET_ERROR_NO_EMAIL);
             return;
        }

        setPasswordResetLoading(true);
        setPasswordResetMessage(null);
        setPasswordResetError(null);

        try {
            await sendPasswordResetEmail(auth, passwordResetEmail);
            setPasswordResetMessage(AppStrings.PASSWORD_RESET_SUCCESS(passwordResetEmail));
            setPasswordResetEmail(''); // Clear field on success
        } catch (error: any) {
            console.error("Password reset error:", error);
            setPasswordResetError(AppStrings.PASSWORD_RESET_FAILED(error.message));
        } finally {
            setPasswordResetLoading(false);
        }
    }, [auth, passwordResetEmail]);

    return {
        currentUser,
        authLoading,
        isLoginModalOpen,
        isSignUpModalOpen,
        verificationWarning,
        resendCooldownActive,
        resendStatusMessage,
        // Invite related
        inviteTokenId,
        inviteStatus,
        inviteError,
        inviteCheckComplete,
        generateInvite, // Export the generation function
        markInviteAsUsed, // Export the marking function
        // Password Reset related
        passwordResetEmail,
        passwordResetLoading,
        passwordResetMessage,
        passwordResetError,
        setPasswordResetEmail,
        handlePasswordReset,
        // Handlers
        handleLoginClick,
        handleLogoutClick,
        handleSignUpClick, // Now checks invite
        handleCloseLoginModal,
        handleCloseSignUpModal,
        handleSwitchToLogin,
        handleSwitchToSignUp, // Now checks invite
        handleResendVerificationEmail,
    };
}