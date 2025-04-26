// src/components/Modal.tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode; // Content/message of the modal
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{title}</h2>
        <div style={styles.content}>
          {children}
        </div>
        <div style={styles.buttonContainer}>
          <button onClick={onClose} style={{ ...styles.button, ...styles.cancelButton }}>
            {cancelText}
          </button>
          <button onClick={onConfirm} style={{ ...styles.button, ...styles.confirmButton }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Basic Styling (Refine in CSS later)
const styles: { [key: string]: React.CSSProperties } = {
    overlay: { /* Same as LoginModal overlay */
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1050, // Above other modals if needed
    },
    modal: { /* Similar to LoginModal modal */
        backgroundColor: 'white', padding: '20px 30px', borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)', position: 'relative',
        minWidth: '300px', maxWidth: '500px', textAlign: 'center',
    },
    title: {
        marginTop: 0,
        marginBottom: '15px',
        fontSize: '1.5rem',
        color: '#333',
    },
    content: {
        marginBottom: '25px',
        fontSize: '1rem',
        color: '#555',
        lineHeight: '1.5',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end', // Align buttons to the right
        gap: '10px',
    },
    button: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#6c757d', // Grey
        color: 'white',
    },
    confirmButton: {
        backgroundColor: '#dc3545', // Red (or choose based on action)
        color: 'white',
    }
};


export default Modal;