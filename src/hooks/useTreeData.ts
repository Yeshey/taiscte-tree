// src/hooks/useTreeData.ts
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { ref, get, set, DatabaseReference } from 'firebase/database';
import { Person } from '../types/models';
import { validateAndNormalizePersonData } from '../components/ExportImport'; // Need validator
import { demoData } from '../data/demoData';
import { database } from '../firebase'; // Assuming firebase.ts exports database
import * as AppStrings from '../constants/strings';

export type DbDataStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
export type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available'; // Redefine or import

// --- Validate demo data on initial load (important fallback) ---
const { validData: initialValidatedDemoData, errors: demoErrors } = validateAndNormalizePersonData(demoData);
if (!initialValidatedDemoData) {
    console.error("FATAL: Demo data is invalid in useTreeData!", demoErrors);
}

// Helper: Date comparison (can be moved to utils)
const isDateOlderThanYears = (dateStr: string | undefined, years: number): boolean => {
    if (!dateStr) return false;
    try {
        const date = new Date(dateStr + 'T00:00:00');
        if (isNaN(date.getTime())) return false;
        const thresholdDate = new Date();
        thresholdDate.setFullYear(thresholdDate.getFullYear() - years);
        return date < thresholdDate;
    } catch { return false; }
};


export function useTreeData(currentUser: User | null, firebaseStatus: FirebaseStatus) {
    const [treeData, setTreeData] = useState<Person[]>(initialValidatedDemoData || []);
    const [dbDataStatus, setDbDataStatus] = useState<DbDataStatus>('idle');
    // Separate warning for data issues vs. auth/config issues
    const [dataWarningMessage, setDataWarningMessage] = useState<string | null>(null);

    // Fetch Data Logic
    const fetchTreeData = useCallback(async () => {
        if (!database) {
            console.error("Database service unavailable during fetch attempt.");
            setDataWarningMessage(AppStrings.FIREBASE_DB_UNAVAILABLE);
            setTreeData(initialValidatedDemoData || []); // Use validated demo data
            setDbDataStatus('error');
            return;
        }
        const treeDataRef: DatabaseReference = ref(database, 'treeData');
        setDbDataStatus('loading');
        setDataWarningMessage(null);
        try {
            const snapshot = await get(treeDataRef);
            if (snapshot.exists()) {
                const dataFromDb = snapshot.val();
                const { validData, errors } = validateAndNormalizePersonData(dataFromDb);
                if (validData) {
                    setTreeData(validData);
                    setDbDataStatus('loaded');
                    if (errors.length > 0) { console.warn("Minor validation issues in fetched data:", errors); }
                } else {
                    console.error("Validation failed for fetched data:", errors);
                    setDataWarningMessage(AppStrings.FIREBASE_DATA_ERROR(errors.join(', ')));
                    setTreeData(initialValidatedDemoData || []);
                    setDbDataStatus('error');
                }
            } else {
                console.log("No data found in Firebase. Using demo data.");
                setDataWarningMessage("No data in Firebase, showing default tree.");
                setTreeData(initialValidatedDemoData || []);
                setDbDataStatus('empty');
            }
        } catch (error: any) {
            console.error("Error fetching data from Firebase DB:", error);
            if (error.code === 'PERMISSION_DENIED') setDataWarningMessage(AppStrings.FIREBASE_FETCH_PERMISSION_ERROR);
            else setDataWarningMessage(AppStrings.FIREBASE_FETCH_ERROR(error.message));
            setTreeData(initialValidatedDemoData || []);
            setDbDataStatus('error');
        }
    }, []); // No dependencies needed here, called based on firebaseStatus

    // Save Data Logic
    const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => {
        if (!database || !currentUser) {
            console.error("Cannot save: DB unavailable or user not logged in.");
            alert(AppStrings.SAVE_UNAVAILABLE); return false;
        }
        if (!currentUser.emailVerified) {
             alert("Cannot save data: Email not verified."); return false;
        }

        const { validData, errors } = validateAndNormalizePersonData(dataToSave);
        if (!validData) {
            console.error("Cannot save: Data validation failed.", errors);
            alert(AppStrings.SAVE_FAILED_INVALID_DATA(errors)); return false;
        }
        if (errors.length > 0) console.warn("Saving data with minor validation warnings:", errors);

        console.log("Attempting to save validated data to Firebase...");
        try {
            const treeDataRef = ref(database, 'treeData');
            await set(treeDataRef, validData);
            setDataWarningMessage(AppStrings.SAVE_SUCCESS); // Use data warning for save status
            setTimeout(() => setDataWarningMessage(null), 3000);
            return true;
        } catch (error: any) {
            console.error("Error saving data to Firebase:", error);
            if (error.code === 'PERMISSION_DENIED') alert(AppStrings.SAVE_FAILED_PERMISSION);
            else alert(AppStrings.SAVE_FAILED_GENERAL(error.message));
            return false;
        }
    }, [currentUser]); // Depends on currentUser for logged-in & verified check

    // Effect for Initial Fetch
    useEffect(() => {
        if (firebaseStatus === 'available') {
            fetchTreeData();
        } else if (firebaseStatus === 'config_error') {
            // Ensure demo data is loaded if config is bad
            setTreeData(initialValidatedDemoData || []);
            setDbDataStatus('error'); // Indicate data cannot be reliably fetched/saved
        }
        // Clear warnings when status changes (e.g., from error to checking/available)
        setDataWarningMessage(null);
    }, [firebaseStatus, fetchTreeData]);

    // Effect for Tuno Check
     useEffect(() => {
        if (firebaseStatus === 'available' && currentUser && dbDataStatus === 'loaded') {
            const tunoName = AppStrings.HIERARCHIA_BASE_LEVELS.find(l => l.key === 'tuno')?.defaultName;
            const tunos = treeData.filter(p => p.hierarquia === tunoName && isDateOlderThanYears(p.passagemTunoDate, 2));
            if (tunos.length > 0) {
                const names = tunos.map(p => p.name).join(', ');
                const msg = `Review Needed: ${names} ${tunos.length > 1 ? 'have' : 'has'} been 'Tuno' for over 2 years.`;
                // Append to existing warning if any, or set new one
                setDataWarningMessage(prev => prev ? `${prev}\n${msg}` : msg);
            }
        }
    }, [treeData, currentUser, firebaseStatus, dbDataStatus]); // Rerun when data/user/status changes

    // --- CRUD Handlers ---
    // These modify the state directly and attempt to save
    const handleAddPerson = useCallback(async (
        personFormData: Omit<Person, 'id' | 'children' | 'padrinhoId'>, // Form data minus relationships/id
        padrinhoId: string
    ) => {
        const parentIndex = treeData.findIndex(p => p.id === padrinhoId);
        if (parentIndex === -1) {
            console.error(`Parent (Padrinho) with ID ${padrinhoId} not found!`);
            alert(`Error: Could not find the Padrinho/Madrinha.`);
            return false; // Indicate failure
        }

        const newPerson: Person = {
            ...personFormData,
            id: crypto.randomUUID(),
            padrinhoId: padrinhoId,
            children: [],
        };

        const updatedTree = [...treeData];
        updatedTree.push(newPerson);
        updatedTree[parentIndex] = {
            ...updatedTree[parentIndex],
            children: [...updatedTree[parentIndex].children, newPerson.id]
        };

        setTreeData(updatedTree); // Update local state first
        return await saveTreeDataToFirebase(updatedTree); // Attempt to save
    }, [treeData, saveTreeDataToFirebase]);

    const handleEditPerson = useCallback(async (
        personFormData: Omit<Person, 'children' | 'padrinhoId'> & { id: string } // Requires ID, excludes relationships
    ) => {
        const personIndex = treeData.findIndex(p => p.id === personFormData.id);
        if (personIndex === -1) {
            console.error("Person to edit not found!");
            alert("Error: Could not find the person to edit.");
            return false;
        }

        const updatedTree = [...treeData];
        const originalPerson = updatedTree[personIndex];
        updatedTree[personIndex] = {
            ...originalPerson, // Keep existing children and padrinhoId
            ...personFormData, // Overwrite with new form data
        };

        setTreeData(updatedTree);
        return await saveTreeDataToFirebase(updatedTree);
    }, [treeData, saveTreeDataToFirebase]);

    const handleDeletePerson = useCallback(async (personIdToDelete: string) => {
        const childPerson = treeData.find(p => p.id === personIdToDelete);
        if (!childPerson) {
             console.error("Person to delete not found!"); return false;
        }

        let parentPerson: Person | undefined = undefined;
        if (childPerson.padrinhoId) {
            parentPerson = treeData.find(p => p.id === childPerson.padrinhoId);
        }
        const childrenOfDeleted = treeData.filter(p => p.padrinhoId === personIdToDelete);

        let updatedTree = treeData.filter(p => p.id !== personIdToDelete); // Remove person

        // Update parent's children list
        if (parentPerson) {
            updatedTree = updatedTree.map(p =>
                p.id === parentPerson!.id
                    ? { ...p, children: p.children.filter(id => id !== personIdToDelete) }
                    : p
            );
        }
        // Update children's padrinhoId
        if (childrenOfDeleted.length > 0) {
            const childIds = new Set(childrenOfDeleted.map(c => c.id));
            updatedTree = updatedTree.map(p =>
                childIds.has(p.id) ? { ...p, padrinhoId: undefined } : p
            );
        }

        setTreeData(updatedTree);
        return await saveTreeDataToFirebase(updatedTree);
    }, [treeData, saveTreeDataToFirebase]);

    // --- Import/Export ---
     const handleImportData = useCallback(async (importedData: Person[]) => {
        // Validation happens before calling this in ExportImport component
        setTreeData(importedData); // Update local state immediately
        setDataWarningMessage("Data imported locally."); // Initial message
        // Attempt to save if conditions met
        if (currentUser?.emailVerified) {
            const saved = await saveTreeDataToFirebase(importedData);
            if (!saved) {
                 // If save failed, keep the warning specific to saving issues from saveTreeDataToFirebase
            } else {
                // If save succeeded, the message is already updated by saveTreeDataToFirebase
                 setDataWarningMessage(null); // Or clear if save was successful
                 setTimeout(() => setDataWarningMessage(null), 3000); // Clear success message
            }
        } else if (currentUser) {
             setDataWarningMessage("Data imported locally. Verify your email to save to the shared tree.");
             setTimeout(() => { if (dataWarningMessage?.includes("imported locally")) setDataWarningMessage(null); }, 5000);
        } else {
             setDataWarningMessage(AppStrings.IMPORT_LOCAL_WARNING); // Not logged in
             setTimeout(() => { if (dataWarningMessage === AppStrings.IMPORT_LOCAL_WARNING) setDataWarningMessage(null); }, 5000);
        }
    }, [currentUser, saveTreeDataToFirebase, dataWarningMessage]); // Added dataWarningMessage to deps

    const handleExportData = useCallback(() => {
        // Consider running validation here too before returning data?
        return treeData;
    }, [treeData]);

    return {
        treeData,
        dbDataStatus,
        dataWarningMessage,
        fetchTreeData, // Expose fetch if manual refresh is needed
        handleImportData,
        handleExportData,
        handleAddPerson,
        handleEditPerson,
        handleDeletePerson,
    };
}