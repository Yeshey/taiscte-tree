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

    const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => {
        if (!database || !currentUser) { alert(AppStrings.SAVE_UNAVAILABLE); return false; }
        if (!currentUser.emailVerified) { alert(AppStrings.SAVE_FAILED_PERMISSION_VERIFY); return false; } // Specific message
        // *** IMPORTANT: Ensure validation handles parentId and no children ***
        const { validData, errors } = validateAndNormalizePersonData(dataToSave);
        if (!validData) { alert(AppStrings.SAVE_FAILED_INVALID_DATA(errors)); return false; }
        if (errors.length > 0) console.warn("Saving with warnings:", errors);
        try {
            const treeDataRef = ref(database, 'treeData'); await set(treeDataRef, validData);
            setDataWarningMessage(AppStrings.SAVE_SUCCESS); setTimeout(() => setDataWarningMessage(null), 3000); return true;
        } catch (error: any) { console.error("Save error:", error); if (error.code === 'PERMISSION_DENIED') alert(AppStrings.SAVE_FAILED_PERMISSION); else alert(AppStrings.SAVE_FAILED_GENERAL(error.message)); return false; }
     }, [currentUser]); // Add currentUser dependency

    useEffect(() => { /* ... (Initial Fetch effect - no changes needed) ... */
        if (firebaseStatus === 'available') { fetchTreeData(); }
        else if (firebaseStatus === 'config_error') { setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); setDataWarningMessage(AppStrings.FIREBASE_CONFIG_ERROR); } // Show config error message
        // Clear specific messages on status change, but maybe keep config error?
        // setDataWarningMessage(null);
    }, [firebaseStatus, fetchTreeData]);

    // --- FIX Double Warning Bug ---
    useEffect(() => {
        if (firebaseStatus === 'available' && currentUser && dbDataStatus === 'loaded') {
            const tunoName = AppStrings.HIERARCHIA_BASE_LEVELS.find(l => l.key === 'tuno')?.defaultName;
            const tunosNeedingReview = treeData.filter(p => p.hierarquia === tunoName && isDateOlderThanYears(p.passagemTunoDate, 2));

            if (tunosNeedingReview.length > 0) {
                const names = tunosNeedingReview.map(p => p.name).join(', ');
                const msg = `Review Needed: ${names} (Tuno > 2 years).`; // Make message more specific

                setDataWarningMessage(prev => {
                    // Check if this *specific* message is already present
                    if (prev && prev.includes(msg)) {
                        return prev; // Already included, don't add again
                    }
                    // Append if not already present
                    return prev ? `${prev}\n${msg}` : msg;
                });
            }
            // Optional: Remove the warning if no tunos need review anymore?
            // else {
            //    setDataWarningMessage(prev => prev?.replace(/Review Needed:.*\(Tuno > 2 years\).\n?/, '') || null);
            // }
        }
    }, [treeData, currentUser, firebaseStatus, dbDataStatus]); // Keep dependencies

    // --- CRUD Handlers (Ensure verification check) ---
    const handleAddPerson = useCallback(async (
        personFormData: Omit<Person, 'id' | 'parentId'>, // Form data doesn't include parentId
        targetParentId: string // The ID of the node clicked
    ) => {
        // --- Add Verification Check ---
        if (!currentUser?.emailVerified) {
             alert(AppStrings.ACTION_REQUIRES_VERIFICATION("add members"));
             return false;
        }
        // --- End Check ---

        const parentExists = treeData.some(p => p.id === targetParentId);
        if (!parentExists && targetParentId !== 'root' && targetParentId !== 'artificial_root') { // Allow adding under artificial roots
             console.warn(`Attempting to add under non-existent parent ID: ${targetParentId}`);
        }

        const newPerson: Person = {
            ...personFormData,
            id: crypto.randomUUID(),
            parentId: (targetParentId === 'root' || targetParentId === 'artificial_root') ? undefined : targetParentId, // Set parentId or undefined for root adds
        };

        const updatedTree = [...treeData, newPerson]; // Just add the new person to the flat list

        setTreeData(updatedTree); // Update local state
        return await saveTreeDataToFirebase(updatedTree); // Attempt to save
    }, [treeData, saveTreeDataToFirebase, currentUser]); // Add currentUser

    const handleEditPerson = useCallback(async (
        // Form data includes id, excludes parentId (can't change parent via edit form)
        personFormData: Omit<Person, 'parentId'> & { id: string }
    ) => {
         // --- Add Verification Check ---
         if (!currentUser?.emailVerified) {
            alert(AppStrings.ACTION_REQUIRES_VERIFICATION("edit members"));
            return false;
        }
        // --- End Check ---

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
    }, [treeData, saveTreeDataToFirebase, currentUser]); // Add currentUser

    const handleDeletePerson = useCallback(async (personIdToDelete: string) => {
        // --- Add Verification Check ---
        if (!currentUser?.emailVerified) {
            alert(AppStrings.ACTION_REQUIRES_VERIFICATION("delete members"));
            return false;
        }
        // --- End Check ---

        const childrenOfDeleted = treeData.filter(p => p.parentId === personIdToDelete);

        let updatedTree = treeData.filter(p => p.id !== personIdToDelete);

        if (childrenOfDeleted.length > 0) {
            const childIdsToUpdate = new Set(childrenOfDeleted.map(c => c.id));
            updatedTree = updatedTree.map(p =>
                childIdsToUpdate.has(p.id)
                    ? { ...p, parentId: undefined }
                    : p
            );
            console.log(`Made ${childrenOfDeleted.length} children of ${personIdToDelete} orphans.`);
        }

        setTreeData(updatedTree);
        return await saveTreeDataToFirebase(updatedTree);
    }, [treeData, saveTreeDataToFirebase, currentUser]); // Add currentUser

    // --- Import/Export (no changes needed here) ---
    const handleImportData = useCallback(async (importedData: Person[]) => {
        setTreeData(importedData); setDataWarningMessage("Data imported locally.");
        if (currentUser?.emailVerified) { const saved = await saveTreeDataToFirebase(importedData); if (saved) { setDataWarningMessage(AppStrings.SAVE_SUCCESS); setTimeout(() => setDataWarningMessage(null), 3000); } } // Clear message on save success
        else if (currentUser) { setDataWarningMessage(AppStrings.IMPORT_LOCAL_VERIFY_WARNING); setTimeout(() => { if (dataWarningMessage === AppStrings.IMPORT_LOCAL_VERIFY_WARNING) setDataWarningMessage(null); }, 5000); }
        else { setDataWarningMessage(AppStrings.IMPORT_LOCAL_WARNING); setTimeout(() => { if (dataWarningMessage === AppStrings.IMPORT_LOCAL_WARNING) setDataWarningMessage(null); }, 5000); }
    }, [currentUser, saveTreeDataToFirebase, dataWarningMessage]); // Keep dataWarningMessage dependency

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