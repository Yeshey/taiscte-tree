// src/components/auth/LoginModal.tsx
import React, { useState } from 'react';
import { auth } from '../../firebase'; // auth is potentially Auth | null
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // --- Add this check ---
    if (!auth) {
      setError("Firebase authentication is not available. Cannot log in.");
      setLoading(false);
      console.error("Login attempt failed: auth instance is null.");
      return; // Stop execution if auth is null
    }
    // --- End check ---

    try {
      // If the check above passed, auth is guaranteed to be non-null here
      await signInWithEmailAndPassword(auth, email, password);
      onClose(); // Close modal on successful login
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error("Login Error:", err);
      // Provide more specific common error messages if possible
      let errorMessage = 'Failed to login. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
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
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {/* Optional: Add link to Sign Up later */}
      </div>
    </div>
  );
};

// Basic Styling (Consider moving to CSS)
const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        padding: '25px 35px',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        position: 'relative',
        minWidth: '300px',
        maxWidth: '90%',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#aaa',
    },
    inputGroup: {
        marginBottom: '15px',
    },
    input: {
        width: '100%',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxSizing: 'border-box', // Include padding in width
        marginTop: '5px',
    },
    errorText: {
        color: 'red',
        fontSize: '13px',
        marginBottom: '10px',
        textAlign: 'center' // Center error text
    },
    submitButton: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%',
        fontSize: '16px',
        transition: 'background-color 0.2s ease', // Add transition
    }
    // submitButton:disabled defined in CSS would be better
};

export default LoginModal;