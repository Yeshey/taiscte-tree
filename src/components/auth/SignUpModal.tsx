// src/components/auth/SignUpModal.tsx
import React, { useState } from 'react';
import { auth } from '../../firebase'; // Import auth instance
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import * as AppStrings from '../../constants/strings'; // Import strings

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void; // Function to switch to login modal
  // --- Add Invite Props ---
  inviteTokenId: string | null;
  inviteStatus: 'idle' | 'checking' | 'valid' | 'invalid' | 'used' | 'not_found' | 'error';
  markInviteAsUsed: (tokenId: string, usedByEmail: string) => Promise<boolean>; // Function to update DB
}

const SignUpModal: React.FC<SignUpModalProps> = ({
    isOpen,
    onClose,
    onSwitchToLogin,
    // --- Destructure Invite Props ---
    inviteTokenId,
    inviteStatus,
    markInviteAsUsed,
 }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // --- Check Invite Status Before Proceeding ---
    if (inviteStatus !== 'valid' || !inviteTokenId) {
        setError(AppStrings.SIGNUP_INVALID_INVITE);
        return;
    }
    // --- End Invite Check ---

    // Use constants from AppStrings directly
    if (password !== confirmPassword) { setError("Passwords do not match."); return; } // Or create AppStrings.PASSWORD_MISMATCH
    if (password.length < 6) { setError("Password should be at least 6 characters long."); return; } // Or create AppStrings.PASSWORD_WEAK

    setLoading(true);

    if (!auth) {
      setError(AppStrings.AUTH_SERVICE_UNAVAILABLE);
      setLoading(false);
      console.error("Sign up attempt failed: auth instance is null.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created successfully:", user.email);

      // --- Mark Invite As Used AFTER user creation ---
      const marked = await markInviteAsUsed(inviteTokenId, email);
      if (!marked) {
          console.warn(`Failed to mark invite token ${inviteTokenId} as used, but user ${email} was created.`);
          // Proceed with verification email anyway? Yes.
      }
      // --- End Mark Invite ---

      // Send verification email
      if (user) {
        try {
          await sendEmailVerification(user);
          console.log("Verification email sent.");
          // Use constants from AppStrings directly
          setSuccessMessage("Account created! Please check your email inbox (and spam folder) for a verification link to complete the process."); // Or create AppStrings.SIGNUP_SUCCESS_VERIFICATION_SENT
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          // Keep modal open to show message, user needs to verify then log in.
          // setTimeout(onClose, 7000); // Optional: Close after delay
        } catch (verificationError: any) {
           console.error("Error sending verification email:", verificationError);
           // User created, invite marked (maybe), but verification failed.
           // Use constants from AppStrings directly
           setError(`Account created, but failed to send verification email: ${verificationError.message}. You can try logging in later to resend it.`); // Or create AppStrings.SIGNUP_ERROR_VERIFICATION_FAILED
           setSuccessMessage(null); // Clear success message
        }
      }

    } catch (err: any) {
      console.error("Sign Up Error:", err.code, err.message);
      let errorMessage = 'Failed to create account.';
      // Use constants from AppStrings directly
      if (err.code === 'auth/email-already-in-use') { errorMessage = "This email address is already registered. Try logging in instead."; } // Or create AppStrings.SIGNUP_ERROR_EMAIL_EXISTS
      else if (err.code === 'auth/invalid-email') { errorMessage = "Please enter a valid email address."; } // Or create AppStrings.INVALID_EMAIL_FORMAT
      else if (err.code === 'auth/weak-password') { errorMessage = "Password should be at least 6 characters long."; } // Or create AppStrings.PASSWORD_WEAK
      else { errorMessage = err.message || errorMessage; }
      setError(errorMessage);
      setSuccessMessage(null); // Clear success message on error
    } finally {
        // Keep modal open on success/error to show messages
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Show message if invite is invalid and modal was somehow opened
  if (inviteStatus !== 'valid') {
     return (
         <div style={styles.overlay}>
             <div style={styles.modal}>
                  <button onClick={onClose} style={styles.closeButton}>×</button>
                  <h2>Create Account</h2>
                  <p style={styles.errorText}>{error || AppStrings.SIGNUP_INVALID_INVITE}</p>
                   <p style={styles.switchText}> Have an account?{' '} <button onClick={onSwitchToLogin} style={styles.switchButton}> Log In </button> </p>
             </div>
         </div>
     );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>×</button>
        <h2>Create Account</h2>
        {/* Show invite token ID being used? Optional */}
        {/* <p style={{fontSize: '12px', color: '#666', textAlign: 'center'}}>Using Invite: {inviteTokenId}</p> */}
        <form onSubmit={handleSignUp}>
          <div style={styles.inputGroup}>
            <label htmlFor="signup-email">Email:</label>
            <input type="email" id="signup-email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="signup-password">Password (min. 6 characters):</label>
            <input type="password" id="signup-password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
          </div>
           <div style={styles.inputGroup}>
            <label htmlFor="signup-confirm-password">Confirm Password:</label>
            <input type="password" id="signup-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={styles.input} />
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          {successMessage && <p style={styles.successText}>{successMessage}</p>}
          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.switchText}> Already have an account?{' '} <button onClick={onSwitchToLogin} style={styles.switchButton}> Log In </button> </p>
      </div>
    </div>
  );
};

/*
// --- DELETE THIS BLOCK ---
// --- Add Constants Used ---
AppStrings.PASSWORD_MISMATCH = "Passwords do not match.";
AppStrings.PASSWORD_WEAK = "Password should be at least 6 characters long.";
AppStrings.SIGNUP_SUCCESS_VERIFICATION_SENT = "Account created! Please check your email inbox (and spam folder) for a verification link to complete the process.";
AppStrings.SIGNUP_ERROR_VERIFICATION_FAILED = (msg: string) => `Account created, but failed to send verification email: ${msg}. You can try logging in later to resend it.`;
AppStrings.SIGNUP_ERROR_EMAIL_EXISTS = "This email address is already registered. Try logging in instead.";
AppStrings.INVALID_EMAIL_FORMAT = "Please enter a valid email address.";
// --- End Constants ---
// --- END DELETE ---
*/

// Basic Styling (Use LoginModal styles and add success text style)
const styles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, },
    modal: { backgroundColor: 'white', padding: '25px 35px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative', minWidth: '300px', maxWidth: '90%', width: '400px' /* Fixed width */ },
    closeButton: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa', },
    inputGroup: { marginBottom: '15px', textAlign: 'left' }, // Added textAlign
    label: { display: 'block', marginBottom: '5px', fontWeight: '500'}, // Added label style
    input: { display: 'block', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px', }, // Adjusted padding
    errorText: { color: 'red', fontSize: '13px', marginBottom: '10px', textAlign: 'center', marginTop: '5px' },
    successText: { color: 'green', fontSize: '13px', marginBottom: '10px', textAlign: 'center', marginTop: '5px' }, // Added success style
    submitButton: { backgroundColor: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '16px', marginTop: '10px' },
    switchText: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666', },
    switchButton: { background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '14px', }
};

export default SignUpModal;