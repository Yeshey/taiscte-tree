// src/hooks/useTreeData.ts
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { ref, get, set, DatabaseReference } from 'firebase/database';
import { Person } from '../types/models';
import { validateAndNormalizePersonData } from '../components/ExportImport'; // Keep validator import
import { demoData } from '../data/demoData';
import { database } from '../firebase';
import * as AppStrings from '../constants/strings';

export type DbDataStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
export type FirebaseStatus = 'checking' | 'config_error' | 'unavailable' | 'available'; // Redefine or import

const { validData: initialValidatedDemoData, errors: demoErrors } = validateAndNormalizePersonData(demoData);
if (!initialValidatedDemoData) {
    console.error("FATAL: Demo data is invalid in useTreeData!", demoErrors);
}

const isDateOlderThanYears = (dateStr: string | undefined, years: number): boolean => {
    // ... (implementation)
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
    const [dataWarningMessage, setDataWarningMessage] = useState<string | null>(null);

    const fetchTreeData = useCallback(async () => { /* ... (no changes needed here) ... */
        if (!database) { console.error("DB unavailable"); setDataWarningMessage(AppStrings.FIREBASE_DB_UNAVAILABLE); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); return; }
        const treeDataRef: DatabaseReference = ref(database, 'treeData');
        setDbDataStatus('loading'); setDataWarningMessage(null);
        try {
            const snapshot = await get(treeDataRef);
            if (snapshot.exists()) {
                const dataFromDb = snapshot.val();
                // *** IMPORTANT: Ensure validation handles parentId and no children ***
                const { validData, errors } = validateAndNormalizePersonData(dataFromDb);
                if (validData) { setTreeData(validData); setDbDataStatus('loaded'); if (errors.length > 0) console.warn("Validation issues:", errors); }
                else { console.error("Validation failed:", errors); setDataWarningMessage(AppStrings.FIREBASE_DATA_ERROR(errors.join(', '))); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); }
            } else { console.log("No data found"); setDataWarningMessage("No data in Firebase, showing default tree."); setTreeData(initialValidatedDemoData || []); setDbDataStatus('empty'); }
        } catch (error: any) { console.error("Fetch error:", error); if (error.code === 'PERMISSION_DENIED') setDataWarningMessage(AppStrings.FIREBASE_FETCH_PERMISSION_ERROR); else setDataWarningMessage(AppStrings.FIREBASE_FETCH_ERROR(error.message)); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); }
    }, []);

    const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => { /* ... (no changes needed here, relies on validation) ... */
        if (!database || !currentUser) { alert(AppStrings.SAVE_UNAVAILABLE); return false; }
        if (!currentUser.emailVerified) { alert("Cannot save data: Email not verified."); return false; }
        // *** IMPORTANT: Ensure validation handles parentId and no children ***
        const { validData, errors } = validateAndNormalizePersonData(dataToSave);
        if (!validData) { alert(AppStrings.SAVE_FAILED_INVALID_DATA(errors)); return false; }
        if (errors.length > 0) console.warn("Saving with warnings:", errors);
        try {
            const treeDataRef = ref(database, 'treeData'); await set(treeDataRef, validData);
            setDataWarningMessage(AppStrings.SAVE_SUCCESS); setTimeout(() => setDataWarningMessage(null), 3000); return true;
        } catch (error: any) { console.error("Save error:", error); if (error.code === 'PERMISSION_DENIED') alert(AppStrings.SAVE_FAILED_PERMISSION); else alert(AppStrings.SAVE_FAILED_GENERAL(error.message)); return false; }
     }, [currentUser]);

    useEffect(() => { /* ... (Initial Fetch effect - no changes needed) ... */
        if (firebaseStatus === 'available') { fetchTreeData(); }
        else if (firebaseStatus === 'config_error') { setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); }
        setDataWarningMessage(null);
    }, [firebaseStatus, fetchTreeData]);

    useEffect(() => { /* ... (Tuno Check effect - no changes needed) ... */
        if (firebaseStatus === 'available' && currentUser && dbDataStatus === 'loaded') {
            const tunoName = AppStrings.HIERARCHIA_BASE_LEVELS.find(l => l.key === 'tuno')?.defaultName;
            const tunos = treeData.filter(p => p.hierarquia === tunoName && isDateOlderThanYears(p.passagemTunoDate, 2));
            if (tunos.length > 0) { const names = tunos.map(p => p.name).join(', '); const msg = `Review Needed: ${names}...`; setDataWarningMessage(prev => prev ? `${prev}\n${msg}` : msg); }
        }
    }, [treeData, currentUser, firebaseStatus, dbDataStatus]);

    // --- CRUD Handlers ---
    const handleAddPerson = useCallback(async (
        personFormData: Omit<Person, 'id' | 'parentId'>, // Form data doesn't include parentId
        targetParentId: string // The ID of the node clicked
    ) => {
        // Parent existence check is less critical now as tree builds differently,
        // but good to ensure the targetParentId is valid if possible.
        const parentExists = treeData.some(p => p.id === targetParentId);
        if (!parentExists && targetParentId !== 'root' && targetParentId !== 'artificial_root') { // Allow adding under artificial roots
             console.warn(`Attempting to add under non-existent parent ID: ${targetParentId}`);
             // Decide if this should be an error or just proceed adding as an orphan/root
             // Let's proceed, transformTunaDataForTree will handle it.
        }

        const newPerson: Person = {
            ...personFormData,
            id: crypto.randomUUID(),
            parentId: (targetParentId === 'root' || targetParentId === 'artificial_root') ? undefined : targetParentId, // Set parentId or undefined for root adds
            // No children array to initialize
        };

        const updatedTree = [...treeData, newPerson]; // Just add the new person to the flat list

        setTreeData(updatedTree); // Update local state
        return await saveTreeDataToFirebase(updatedTree); // Attempt to save
    }, [treeData, saveTreeDataToFirebase]);

    const handleEditPerson = useCallback(async (
        // Form data includes id, excludes parentId (can't change parent via edit form)
        personFormData: Omit<Person, 'parentId'> & { id: string }
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
            ...originalPerson, // Keep existing parentId
            ...personFormData, // Overwrite with new form data
        };

        setTreeData(updatedTree);
        return await saveTreeDataToFirebase(updatedTree);
    }, [treeData, saveTreeDataToFirebase]);

    const handleDeletePerson = useCallback(async (personIdToDelete: string) => {
        // Find children (people whose parentId points to the one being deleted)
        const childrenOfDeleted = treeData.filter(p => p.parentId === personIdToDelete);

        // 1. Filter out the person to be deleted
        let updatedTree = treeData.filter(p => p.id !== personIdToDelete);

        // 2. Make the direct children orphans (set their parentId to undefined)
        if (childrenOfDeleted.length > 0) {
            const childIdsToUpdate = new Set(childrenOfDeleted.map(c => c.id));
            updatedTree = updatedTree.map(p =>
                childIdsToUpdate.has(p.id)
                    // Create a new object, copying existing props and setting parentId
                    ? { ...p, parentId: undefined }
                    : p
            );
            console.log(`Made ${childrenOfDeleted.length} children of ${personIdToDelete} orphans.`);
        }

        setTreeData(updatedTree);
        return await saveTreeDataToFirebase(updatedTree);
    }, [treeData, saveTreeDataToFirebase]);

    // --- Import/Export (no changes needed here) ---
    const handleImportData = useCallback(async (importedData: Person[]) => { /* ... */
        setTreeData(importedData); setDataWarningMessage("Data imported locally.");
        if (currentUser?.emailVerified) { const saved = await saveTreeDataToFirebase(importedData); if (saved) { setDataWarningMessage(null); setTimeout(() => setDataWarningMessage(null), 3000); } }
        else if (currentUser) { setDataWarningMessage("Data imported locally. Verify your email to save."); setTimeout(() => { if (dataWarningMessage?.includes("imported locally")) setDataWarningMessage(null); }, 5000); }
        else { setDataWarningMessage(AppStrings.IMPORT_LOCAL_WARNING); setTimeout(() => { if (dataWarningMessage === AppStrings.IMPORT_LOCAL_WARNING) setDataWarningMessage(null); }, 5000); }
    }, [currentUser, saveTreeDataToFirebase, dataWarningMessage]);

    const handleExportData = useCallback(() => treeData, [treeData]);


    return {
        treeData,
        dbDataStatus,
        dataWarningMessage,
        // fetchTreeData, // Not needed externally?
        handleImportData,
        handleExportData,
        handleAddPerson,
        handleEditPerson,
        handleDeletePerson,
    };
}