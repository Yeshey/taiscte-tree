// src/components/auth/AccountIndicator.tsx
import React, { CSSProperties } from 'react'; // Import CSSProperties
import { User } from 'firebase/auth';
import { User as UserFeatherIcon, LogIn, LogOut, AlertTriangle, Link as LinkIcon } from 'react-feather'; // Changed UserPlus to LinkIcon

interface AccountIndicatorProps {
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  // onSignUpClick is removed
  onGenerateInviteClick: () => void; // Add handler for generating invites
  authLoading: boolean; // Receive authLoading state
}

const AccountIndicator: React.FC<AccountIndicatorProps> = ({
  currentUser,
  onLoginClick,
  onLogoutClick,
  onGenerateInviteClick,
  authLoading, // Destructure authLoading
}) => {
  const isVerified = currentUser?.emailVerified ?? false;

  // Don't render anything until auth state is determined
  if (authLoading) {
      return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {currentUser ? (
        <div style={styles.loggedInContainer}>
          {/* Generate Invite Button - Visible only to verified users */}
          {isVerified && (
            <button onClick={onGenerateInviteClick} style={{...styles.button, ...styles.inviteButton}} title="Generate Invite Link">
              <LinkIcon size={14} />
              Invite
            </button>
          )}
          <span style={styles.userInfo} title={currentUser.email || 'User'}>
            <UserFeatherIcon size={18} />
            <span style={styles.emailText}>{currentUser.email}</span>
            {!isVerified && (
               <span title="Email not verified" style={styles.verifyIconWrapper}>
                    <AlertTriangle size={14} color="#ffc107" />
               </span>
            )}
          </span>
          <button onClick={onLogoutClick} style={styles.button} title="Logout">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      ) : (
        <div style={styles.loggedOutContainer}>
            {/* Signup button removed - Users must use invite link */}
            {/* <button onClick={onSignUpClick} style={{...styles.button, ...styles.signUpButton}} title="Create Account"> <UserPlus size={14} /> Create Account </button> */}
             <button onClick={onLoginClick} style={styles.button} title="Login">
                <LogIn size={14} />
                Login
            </button>
        </div>
      )}
    </div>
  );
};

// Add style for the wrapper and invite button
const styles: { [key: string]: React.CSSProperties } = { // Explicitly type styles
    container: { /* Kept relative positioning for flex layout */ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '5px 10px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', margin: '5px', /* Add margin */ whiteSpace: 'nowrap' /* Prevent wrapping inside indicator */ },
    loggedInContainer: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' /* Prevent wrapping inside */ },
    loggedOutContainer: { display: 'flex', alignItems: 'center', gap: '10px', },
    userInfo: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#333', maxWidth: '180px', /* Adjusted max width */ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 /* Allow shrinking */ },
    emailText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', },
    verifyIconWrapper: { marginLeft: '3px', flexShrink: 0, display: 'inline-flex', verticalAlign: 'middle', },
    button: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#e9ecef', border: '1px solid #ced4da', borderRadius: '15px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', color: '#495057', transition: 'background-color 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0 /* Prevent buttons shrinking */ },
    //signUpButton: { backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }, // Style removed
    inviteButton: { backgroundColor: '#17a2b8', color: 'white', borderColor: '#17a2b8' }, // Added style for invite button
};

export default AccountIndicator;