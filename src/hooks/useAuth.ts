// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { auth, isFirebaseAvailable } from '../firebase'; // Assuming firebase.ts exports these
import * as AppStrings from '../constants/strings';

export type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available';

export function useAuth(firebaseStatus: FirebaseStatus) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState<boolean>(false);
    const [verificationWarning, setVerificationWarning] = useState<string | null>(null);
    const [resendCooldownActive, setResendCooldownActive] = useState(false);
    const [resendStatusMessage, setResendStatusMessage] = useState<string | null>(null);

    // Effect for Auth State Changes
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
            setIsLoginModalOpen(true);
        } else {
            alert(AppStrings.LOGIN_UNAVAILABLE);
        }
    }, [firebaseStatus]);

    const handleSignUpClick = useCallback(() => {
        if (firebaseStatus !== 'config_error' && isFirebaseAvailable) {
            setIsLoginModalOpen(false); // Close login if open
            setIsSignUpModalOpen(true);
        } else {
            alert(AppStrings.SIGNUP_UNAVAILABLE);
        }
    }, [firebaseStatus]);

    const handleCloseLoginModal = useCallback(() => setIsLoginModalOpen(false), []);
    const handleCloseSignUpModal = useCallback(() => setIsSignUpModalOpen(false), []);

    const handleSwitchToLogin = useCallback(() => {
        setIsSignUpModalOpen(false);
        setIsLoginModalOpen(true);
    }, []);

    const handleSwitchToSignUp = useCallback(() => {
        setIsLoginModalOpen(false);
        setIsSignUpModalOpen(true);
    }, []);

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

    return {
        currentUser,
        authLoading,
        isLoginModalOpen,
        isSignUpModalOpen,
        verificationWarning,
        resendCooldownActive,
        resendStatusMessage,
        handleLoginClick,
        handleLogoutClick,
        handleSignUpClick,
        handleCloseLoginModal,
        handleCloseSignUpModal,
        handleSwitchToLogin,
        handleSwitchToSignUp,
        handleResendVerificationEmail,
    };
}