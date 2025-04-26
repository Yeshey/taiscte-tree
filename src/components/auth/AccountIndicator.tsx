// src/components/auth/AccountIndicator.tsx
import React from 'react';
import { User } from 'firebase/auth'; // Import the User type

// --- Simple SVG Icons (Replace with better icons later if desired) ---
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LoginIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
      <polyline points="10 17 15 12 10 7"></polyline>
      <line x1="15" y1="12" x2="3" y2="12"></line>
  </svg>
);
// --- End Icons ---

interface AccountIndicatorProps {
  currentUser: User | null; // The currently logged-in user or null
  onLoginClick: () => void; // Function to call when login is clicked
  onLogoutClick: () => void; // Function to call when logout is clicked
}

const AccountIndicator: React.FC<AccountIndicatorProps> = ({
  currentUser,
  onLoginClick,
  onLogoutClick,
}) => {
  return (
    <div style={styles.container}>
      {currentUser ? (
        // --- Logged In State ---
        <div style={styles.loggedInContainer}>
          <span style={styles.userInfo} title={currentUser.email || 'User'}>
            <UserIcon />
            <span style={styles.emailText}>{currentUser.email}</span>
          </span>
          <button onClick={onLogoutClick} style={styles.button} title="Logout">
            Logout
          </button>
        </div>
      ) : (
        // --- Logged Out State ---
        <button onClick={onLoginClick} style={styles.button} title="Login">
          <LoginIcon />
          <span style={styles.loginText}>Login</span>
        </button>
      )}
    </div>
  );
};

// Basic Styling (Consider moving to App.css later)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute',
    top: '15px',
    right: '20px',
    zIndex: 110, // Ensure it's above zoom controls
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '5px 10px',
    borderRadius: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
  loggedInContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '14px',
    color: '#333',
    maxWidth: '150px', // Limit width to prevent overflow
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emailText: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#e9ecef',
    border: '1px solid #ced4da',
    borderRadius: '15px',
    padding: '5px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#495057',
    transition: 'background-color 0.2s ease',
  },
  loginText: {
      marginLeft: '3px',
  }
  // button:hover defined in CSS would be better
};


export default AccountIndicator;