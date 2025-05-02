// src/components/auth/LoginModal.tsx
import React, { useState } from 'react';
import { auth } from '../../firebase'; // auth is potentially Auth | null
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import * as AppStrings from '../../constants/strings'; // Import strings

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  // --- Add Password Reset Props ---
  onPasswordReset: (event: React.FormEvent) => Promise<void>;
  passwordResetEmail: string;
  setPasswordResetEmail: React.Dispatch<React.SetStateAction<string>>;
  passwordResetLoading: boolean;
  passwordResetMessage: string | null;
  passwordResetError: string | null;
}

const LoginModal: React.FC<LoginModalProps> = ({
    isOpen,
    onClose,
    onSwitchToSignUp,
    // --- Destructure Password Reset Props ---
    onPasswordReset,
    passwordResetEmail,
    setPasswordResetEmail,
    passwordResetLoading,
    passwordResetMessage,
    passwordResetError
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false); // State to toggle reset form

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setShowResendVerification(false);
    setShowPasswordReset(false); // Hide password reset on login attempt

    if (!auth) {
      setError(AppStrings.AUTH_SERVICE_UNAVAILABLE);
      setLoading(false);
      console.error("Login attempt failed: auth instance is null.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (userCredential.user && !userCredential.user.emailVerified) {
         setError(AppStrings.VERIFICATION_WARNING); // Use string constant
         setShowResendVerification(true);
         // Keep loading true so main login button is disabled
         // setLoading(false); // Don't set loading false here
         return;
      }

      // Successful login
      onClose(); // Close modal
      // Reset local state (email, password) - handled by useEffect in App? Or reset here.
      setEmail('');
      setPassword('');
      // No need to reset loading here, modal closes

    } catch (err: any) {
        console.error("Login Error:", err);
        let errorMessage = 'Failed to login. Please check your credentials.';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') { errorMessage = 'Invalid email or password.'; }
        else if (err.code === 'auth/invalid-email') { errorMessage = 'Please enter a valid email address.'; }
        else if (err.code === 'auth/network-request-failed') { errorMessage = 'Network error. Please check your connection.'; }
        else { errorMessage = err.message || errorMessage; } // Fallback
        setError(errorMessage);
        setLoading(false); // Set loading false on error
    } finally {
        // setLoading(false) is handled in error case and success case (by closing modal)
        // Only exception is the verification required case, where we leave it loading=true
        if (showResendVerification) {
           // Keep loading=true intentionally
        } else if (loading) {
           // Should only happen if an unexpected path is taken
           setLoading(false);
        }
    }
  };

  const handleResendVerification = async () => {
      if (!auth?.currentUser) { // Combined null check
          setError("Cannot resend verification: Not properly logged in.");
          return;
      }
      // Use the callback from useAuth for consistency? No, this action is specific to this modal state
      try {
          setLoading(true); // Keep loading spinner on main button
          setError(null); // Clear login error
          await sendEmailVerification(auth.currentUser);
          setError(AppStrings.VERIFICATION_SENT); // Show success as an "error" message
          setShowResendVerification(false); // Hide resend button after sending
          // Keep loading = true, user still needs to verify then log in again.
      } catch (err: any) {
          console.error("Resend Verification Error:", err);
          setError(AppStrings.VERIFICATION_FAILED(err.message)); // Show resend error
          setShowResendVerification(false); // Hide button after error too
          setLoading(false); // Allow retry login after resend failure
      }
       // No finally block needed here for setLoading, handled above
  };

  const handleForgotPasswordClick = () => {
      setShowPasswordReset(true);
      setError(null); // Clear login errors
      setShowResendVerification(false); // Hide verification stuff
  };

  // --- Modified onClose ---
  const handleClose = () => {
    setShowPasswordReset(false); // Ensure reset form is hidden when modal is closed
    setError(null);
    setShowResendVerification(false);
    setLoading(false);
    onClose(); // Call the original onClose passed from props
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={handleClose} style={styles.closeButton}>×</button>

        {!showPasswordReset ? (
            <>
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                   <div style={styles.inputGroup}> <label htmlFor="email">Email:</label> <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} /> </div>
                  <div style={styles.inputGroup}> <label htmlFor="password">Password:</label> <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} /> </div>
                  {error && <p style={styles.errorText}>{error}</p>}
                   {showResendVerification && ( <button type="button" onClick={handleResendVerification} disabled={loading} style={styles.resendButton}> {loading ? AppStrings.VERIFICATION_SENDING : AppStrings.VERIFICATION_RESEND_PROMPT} </button> )}
                  <button type="submit" disabled={loading} style={styles.submitButton}> {loading ? 'Processing...' : 'Login'} </button>
                </form>
                <div style={styles.linksContainer}>
                    <button onClick={handleForgotPasswordClick} style={styles.switchButton}>
                        {AppStrings.FORGOT_PASSWORD_PROMPT}
                    </button>
                    {/* Signup switch only makes sense if an invite is potentially valid */}
                    {/* Maybe hide this if no invite detected? Or let useAuth handle the alert */}
                    <p style={{...styles.switchText, margin: 0}}> Don't have an account?{' '} <button onClick={onSwitchToSignUp} style={styles.switchButton}> Create Account </button> </p>
                </div>
            </>
        ) : (
            <>
                 <h2>Reset Password</h2>
                 <form onSubmit={onPasswordReset}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="reset-email">{AppStrings.PASSWORD_RESET_EMAIL_LABEL}</label>
                        <input
                            type="email"
                            id="reset-email"
                            value={passwordResetEmail}
                            onChange={(e) => setPasswordResetEmail(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="your.email@example.com"
                        />
                    </div>
                    {passwordResetMessage && <p style={styles.successText}>{passwordResetMessage}</p>}
                    {passwordResetError && <p style={styles.errorText}>{passwordResetError}</p>}
                    <button type="submit" disabled={passwordResetLoading} style={styles.submitButton}>
                        {passwordResetLoading ? AppStrings.PASSWORD_RESET_SENDING : AppStrings.PASSWORD_RESET_BUTTON_TEXT}
                    </button>
                 </form>
                 <div style={styles.linksContainer}>
                     <button onClick={() => setShowPasswordReset(false)} style={styles.switchButton}>
                         Back to Login
                     </button>
                 </div>
            </>
        )}

      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, },
    modal: { backgroundColor: 'white', padding: '25px 35px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative', minWidth: '300px', maxWidth: '90%', width: '400px' /* Fixed width */ },
    closeButton: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa', },
    inputGroup: { marginBottom: '15px', textAlign: 'left' },
    label: { display: 'block', marginBottom: '5px', fontWeight: '500'}, // Added label style
    input: { display: 'block', width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px', },
    errorText: { color: 'red', fontSize: '13px', marginBottom: '10px', textAlign: 'center', marginTop: '5px' },
    successText: { color: 'green', fontSize: '13px', marginBottom: '10px', textAlign: 'center', marginTop: '5px' }, // Added success style
    submitButton: { backgroundColor: '#007bff', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '16px', marginTop: '10px', transition: 'background-color 0.2s', },
    // submitButton disabled style is handled inline typically: style={loading ? {...styles.submitButton, backgroundColor: '#6c757d'} : styles.submitButton}
    linksContainer: { marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, // Container for links
    switchText: { margin: 0, textAlign: 'right', fontSize: '14px', color: '#666', }, // Adjusted switch text
    switchButton: { background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '14px', },
    resendButton: { backgroundColor: '#ffc107', color: '#333', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '14px', marginTop: '10px', marginBottom: '10px', }
};

export default LoginModal;