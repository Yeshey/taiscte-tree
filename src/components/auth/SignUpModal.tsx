// src/components/auth/SignUpModal.tsx
import React, { useState } from 'react';
import { auth } from '../../firebase'; // Import auth instance
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void; // Function to switch to login modal
}

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
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

    // Basic client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    setLoading(true);

    if (!auth) {
      setError("Firebase authentication is not available. Cannot sign up.");
      setLoading(false);
      console.error("Sign up attempt failed: auth instance is null.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created successfully:", userCredential.user.email);

      // Send verification email
      if (userCredential.user) {
        try {
          await sendEmailVerification(userCredential.user);
          console.log("Verification email sent.");
          setSuccessMessage("Account created! Please check your email inbox (and spam folder) for a verification link.");
          // Clear form only on complete success
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          // Optionally close modal after a delay or keep it open to show message
          // setTimeout(onClose, 5000); // Example: Close after 5 seconds
        } catch (verificationError: any) {
           console.error("Error sending verification email:", verificationError);
           setError(`Account created, but failed to send verification email: ${verificationError.message}. You can try logging in and requesting verification again later.`);
        }
      }

    } catch (err: any) {
      console.error("Sign Up Error:", err.code, err.message);
      let errorMessage = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered. Try logging in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password (at least 6 characters).';
      } else {
         errorMessage = err.message || errorMessage; // Fallback to Firebase message
      }
      setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>×</button>
        <h2>Create Account</h2>
        <form onSubmit={handleSignUp}>
          <div style={styles.inputGroup}>
            <label htmlFor="signup-email">Email:</label>
            <input
              type="email"
              id="signup-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="signup-password">Password (min. 6 characters):</label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
           <div style={styles.inputGroup}>
            <label htmlFor="signup-confirm-password">Confirm Password:</label>
            <input
              type="password"
              id="signup-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          {successMessage && <p style={styles.successText}>{successMessage}</p>}
          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.switchText}>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} style={styles.switchButton}>
                Log In
            </button>
        </p>
      </div>
    </div>
  );
};

// Basic Styling (Use LoginModal styles and add success text style)
const styles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, },
    modal: { backgroundColor: 'white', padding: '25px 35px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative', minWidth: '300px', maxWidth: '90%', },
    closeButton: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#aaa', },
    inputGroup: { marginBottom: '15px', },
    input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px', },
    errorText: { color: 'red', fontSize: '13px', marginBottom: '10px', textAlign: 'center' },
    successText: { color: 'green', fontSize: '13px', marginBottom: '10px', textAlign: 'center' },
    submitButton: { backgroundColor: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '16px', },
    switchText: {
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666',
    },
    switchButton: {
        background: 'none',
        border: 'none',
        color: '#007bff',
        textDecoration: 'underline',
        cursor: 'pointer',
        padding: 0,
        fontSize: '14px',
    }
};

export default SignUpModal;