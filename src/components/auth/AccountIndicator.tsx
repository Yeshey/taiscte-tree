// src/components/auth/AccountIndicator.tsx
import React, { CSSProperties } from 'react'; // Import CSSProperties
import { User } from 'firebase/auth';
import { User as UserFeatherIcon, LogIn, LogOut, AlertTriangle, UserPlus } from 'react-feather';

interface AccountIndicatorProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSignUpClick: () => void;
}

const AccountIndicator: React.FC<AccountIndicatorProps> = ({
  currentUser,
  onLoginClick,
  onLogoutClick,
  onSignUpClick,
}) => {
  const isVerified = currentUser?.emailVerified ?? false;

  return (
    <div style={styles.container}>
      {currentUser ? (
        <div style={styles.loggedInContainer}>
          <span style={styles.userInfo} title={currentUser.email || 'User'}>
            <UserFeatherIcon size={18} />
            <span style={styles.emailText}>{currentUser.email}</span>
            {/* --- Wrap Icon in span for title --- */}
            {!isVerified && (
               <span title="Email not verified" style={styles.verifyIconWrapper}>
                    <AlertTriangle size={14} color="#ffc107" />
               </span>
            )}
             {/* --- End Wrap --- */}
          </span>
          <button onClick={onLogoutClick} style={styles.button} title="Logout">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      ) : (
        <div style={styles.loggedOutContainer}>
            <button onClick={onSignUpClick} style={{...styles.button, ...styles.signUpButton}} title="Create Account">
                <UserPlus size={14} />
                Create Account
            </button>
             <button onClick={onLoginClick} style={styles.button} title="Login">
                <LogIn size={14} />
                Login
            </button>
        </div>
      )}
    </div>
  );
};

// Add style for the wrapper
const styles: { [key: string]: React.CSSProperties } = { // Explicitly type styles
    container: { position: 'absolute', top: '15px', right: '20px', zIndex: 110, display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '5px 10px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', },
    loggedInContainer: { display: 'flex', alignItems: 'center', gap: '10px', },
    loggedOutContainer: { display: 'flex', alignItems: 'center', gap: '10px', },
    userInfo: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#333', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', },
    emailText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', },
    // Style for the wrapper span, not the icon directly
    verifyIconWrapper: {
        marginLeft: '3px',
        flexShrink: 0,
        display: 'inline-flex', // Helps alignment
        verticalAlign: 'middle', // Align with text
    },
    button: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#e9ecef', border: '1px solid #ced4da', borderRadius: '15px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', color: '#495057', transition: 'background-color 0.2s ease', whiteSpace: 'nowrap' },
    signUpButton: { backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' },
};

export default AccountIndicator;