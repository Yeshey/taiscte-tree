// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import GenealogyTree from './components/GenealogyTree';
import ExportImport from './components/ExportImport';
import AccountIndicator from './components/auth/AccountIndicator'; // Import AccountIndicator
import LoginModal from './components/auth/LoginModal'; // Import LoginModal
import { demoData } from './data/demoData';
import { Person } from './types/models';
import { auth } from './firebase'; // Import auth instance
import { onAuthStateChanged, User, signOut } from 'firebase/auth'; // Import auth functions

function App() {
  const [treeData, setTreeData] = useState<Person[]>([]);
  // Remove isLoading and isFirebaseAvailable, handle directly via currentUser
  // const [isFirebaseAvailable, setIsFirebaseAvailable] = useState<boolean>(false);
  // const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true); // Track initial auth state check
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Listener for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Set user to null if logged out, User object if logged in
      setAuthLoading(false); // Finished checking auth state
      console.log("Auth State Changed:", user ? `Logged in as ${user.email}` : "Logged out");

      // --- Load Data Logic (adjust as needed) ---
      if (user) {
        // TODO: If logged in, fetch data from Firebase database later
        // For now, still load demo data if logged in
        console.log("User logged in, loading demo data for now.");
        setTreeData(demoData);
      } else {
        // If logged out, load demo data (or clear it, depending on desired behavior)
        console.log("User logged out, loading demo data.");
        setTreeData(demoData);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleImportData = (data: Person[]) => {
    // TODO: Add logic to save imported data to Firebase if user is logged in
    setTreeData(data);
  };

  const handleExportData = () => {
    // No immediate change needed, but export could be disabled if not logged in?
    return treeData;
  };

  // --- Auth Action Handlers ---
  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
      // currentUser state will update via onAuthStateChanged listener
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout Error:", error);
      alert(`Logout failed: ${error}`); // Simple error feedback
    }
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  // Display loading indicator while checking auth state
  if (authLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="loading">Checking authentication status...</div>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* --- Account Indicator --- */}
        <AccountIndicator
            currentUser={currentUser}
            onLoginClick={handleLoginClick}
            onLogoutClick={handleLogoutClick}
        />

        <h1>Genealogia TAISCTE</h1> {/* Updated Title */}

        {/* Remove old Firebase warning - Handled by login state now */}
        {/* {!isFirebaseAvailable && (...)} */}

        <ExportImport
          onImport={handleImportData}
          onExport={handleExportData}
        />
        <div className="tree-container">
          <GenealogyTree data={treeData} />
        </div>

      </header>

      {/* --- Login Modal --- */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
      />
    </div>
  );
}

export default App;