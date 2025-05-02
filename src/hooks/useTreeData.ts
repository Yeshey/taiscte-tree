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

    const fetchTreeData = useCallback(async () => {
        if (!database) { console.error("DB unavailable"); setDataWarningMessage(AppStrings.FIREBASE_DB_UNAVAILABLE); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); return; }
        const treeDataRef: DatabaseReference = ref(database, 'treeData');
        setDbDataStatus('loading'); setDataWarningMessage(null);
        try {
            const snapshot = await get(treeDataRef);
            if (snapshot.exists()) {
                const dataFromDb = snapshot.val();
                const { validData, errors } = validateAndNormalizePersonData(dataFromDb);
                if (validData) { setTreeData(validData); setDbDataStatus('loaded'); if (errors.length > 0) console.warn("Validation issues:", errors); }
                else { console.error("Validation failed:", errors); setDataWarningMessage(AppStrings.FIREBASE_DATA_ERROR(errors.join(', '))); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); }
            } else { console.log("No data found in Firebase, showing default tree."); setDataWarningMessage("No data in Firebase, showing default tree."); setTreeData(initialValidatedDemoData || []); setDbDataStatus('empty'); }
        } catch (error: any) { console.error("Fetch error:", error); if (error.code === 'PERMISSION_DENIED') setDataWarningMessage(AppStrings.FIREBASE_FETCH_PERMISSION_ERROR); else setDataWarningMessage(AppStrings.FIREBASE_FETCH_ERROR(error.message)); setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); }
    }, []);

    const saveTreeDataToFirebase = useCallback(async (dataToSave: Person[]) => {
        if (!database || !currentUser) { alert(AppStrings.SAVE_UNAVAILABLE); return false; }
        if (!currentUser.emailVerified) { alert(AppStrings.SAVE_FAILED_PERMISSION_VERIFY); return false; }
        const { validData, errors } = validateAndNormalizePersonData(dataToSave);
        if (!validData) { alert(AppStrings.SAVE_FAILED_INVALID_DATA(errors)); return false; }
        if (errors.length > 0) console.warn("Saving with warnings:", errors);
        try {
            const treeDataRef = ref(database, 'treeData'); await set(treeDataRef, validData);
            // Don't show success message immediately, let it be cleared naturally or by other warnings
            // setDataWarningMessage(AppStrings.SAVE_SUCCESS);
            // setTimeout(() => setDataWarningMessage(null), 3000);
            console.log("Tree data saved successfully.");
            return true;
        } catch (error: any) { console.error("Save error:", error); if (error.code === 'PERMISSION_DENIED') alert(AppStrings.SAVE_FAILED_PERMISSION); else alert(AppStrings.SAVE_FAILED_GENERAL(error.message)); return false; }
     }, [currentUser]);

    useEffect(() => {
        if (firebaseStatus === 'available') { fetchTreeData(); }
        else if (firebaseStatus === 'config_error') { setTreeData(initialValidatedDemoData || []); setDbDataStatus('error'); setDataWarningMessage(AppStrings.FIREBASE_CONFIG_ERROR); }
    }, [firebaseStatus, fetchTreeData]);

    useEffect(() => {
        if (firebaseStatus === 'available' && currentUser && dbDataStatus === 'loaded') {
            const tunoName = AppStrings.HIERARCHIA_BASE_LEVELS.find(l => l.key === 'tuno')?.defaultName;
            const tunosNeedingReview = treeData.filter(p => p.hierarquia === tunoName && isDateOlderThanYears(p.passagemTunoDate, 2));

            if (tunosNeedingReview.length > 0) {
                const names = tunosNeedingReview.map(p => p.name).join(', ');
                const msg = `Review Needed: ${names} (Tuno > 2 years).`;

                setDataWarningMessage(prev => {
                    const reviewMsgRegex = /Review Needed:.*\(Tuno > 2 years\)\.?\n?/;
                    const prevWithoutReview = prev?.replace(reviewMsgRegex, '') || null;
                    // Append new message, ensuring only one instance
                    return prevWithoutReview ? `${prevWithoutReview.trim()}\n${msg}` : msg;
                });
            } else {
                 // Remove the warning if no tunos need review anymore
                 const reviewMsgRegex = /Review Needed:.*\(Tuno > 2 years\)\.?\n?/;
                 setDataWarningMessage(prev => prev?.replace(reviewMsgRegex, '').trim() || null);
            }
        } else if (dbDataStatus !== 'loading') {
             // Clear review warning if not loaded/logged in
             const reviewMsgRegex = /Review Needed:.*\(Tuno > 2 years\)\.?\n?/;
             setDataWarningMessage(prev => prev?.replace(reviewMsgRegex, '').trim() || null);
        }
    }, [treeData, currentUser, firebaseStatus, dbDataStatus]);

    // --- CRUD Handlers ---
    const handleAddPerson = useCallback(async (
        personFormData: Omit<Person, 'id' | 'parentId'>,
        targetParentId: string // The ID of the node clicked (could be 'root')
    ) => {
        if (!currentUser?.emailVerified) {
             alert(AppStrings.ACTION_REQUIRES_VERIFICATION("add members"));
             return false;
        }

        // *** ADDED: Check if the target parent exists in the data OR is the special 'root' ID ***
        const parentExists = targetParentId === 'root' || treeData.some(p => p.id === targetParentId);
        if (!parentExists) {
             console.error(`Attempting to add under non-existent parent ID: ${targetParentId}`);
             alert("Error: Cannot add member. The selected parent node does not exist.");
             return false;
        }
        // *** END CHECK ***

        const newPerson: Person = {
            ...personFormData,
            id: crypto.randomUUID(),
            // *** MODIFIED: Set parentId to undefined if adding under 'root' ***
            parentId: targetParentId === 'root' ? undefined : targetParentId,
        };

        const updatedTree = [...treeData, newPerson];
        setTreeData(updatedTree); // Update local state first

        const success = await saveTreeDataToFirebase(updatedTree); // Attempt to save
        if (!success) {
            // Revert local state if save failed
            setTreeData(prev => prev.filter(p => p.id !== newPerson.id));
            return false;
        }
        return true; // Save was successful
    }, [treeData, saveTreeDataToFirebase, currentUser]);

    const handleEditPerson = useCallback(async (
        personFormData: Omit<Person, 'parentId'> & { id: string }
    ) => {
         if (!currentUser?.emailVerified) {
            alert(AppStrings.ACTION_REQUIRES_VERIFICATION("edit members"));
            return false;
        }

        const personIndex = treeData.findIndex(p => p.id === personFormData.id);
        if (personIndex === -1) {
            console.error("Person to edit not found!");
            alert("Error: Could not find the person to edit.");
            return false;
        }

        const originalPerson = treeData[personIndex]; // Keep track of original for rollback
        const updatedTree = [...treeData];
        updatedTree[personIndex] = {
            ...originalPerson, // Keep existing parentId
            ...personFormData, // Overwrite with new form data
        };

        setTreeData(updatedTree); // Update local state

        const success = await saveTreeDataToFirebase(updatedTree);
        if (!success) {
            // Revert local state if save failed
            setTreeData(prev => {
                const revertedTree = [...prev];
                const idx = revertedTree.findIndex(p => p.id === personFormData.id);
                if (idx !== -1) revertedTree[idx] = originalPerson;
                return revertedTree;
            });
            return false;
        }
        return true; // Save successful
    }, [treeData, saveTreeDataToFirebase, currentUser]);

    const handleDeletePerson = useCallback(async (personIdToDelete: string) => {
        if (!currentUser?.emailVerified) {
            alert(AppStrings.ACTION_REQUIRES_VERIFICATION("delete members"));
            return false;
        }

        const originalTree = [...treeData]; // Keep copy for rollback
        const childrenOfDeleted = treeData.filter(p => p.parentId === personIdToDelete);

        let updatedTree = treeData.filter(p => p.id !== personIdToDelete);

        if (childrenOfDeleted.length > 0) {
            const childIdsToUpdate = new Set(childrenOfDeleted.map(c => c.id));
            updatedTree = updatedTree.map(p =>
                childIdsToUpdate.has(p.id)
                    ? { ...p, parentId: undefined } // Make children orphans (root members)
                    : p
            );
            console.log(`Made ${childrenOfDeleted.length} children of ${personIdToDelete} orphans.`);
        }

        setTreeData(updatedTree); // Update local state

        const success = await saveTreeDataToFirebase(updatedTree);
        if (!success) {
             // Revert local state if save failed
             setTreeData(originalTree);
             return false;
        }
        return true; // Save successful
    }, [treeData, saveTreeDataToFirebase, currentUser]);

    const handleImportData = useCallback(async (importedData: Person[]) => {
        const { validData, errors } = validateAndNormalizePersonData(importedData);
        if (!validData) {
            alert(AppStrings.IMPORT_FAILED_INVALID(errors));
            return;
        }
        if (errors.length > 0) {
            console.warn("Importing with validation warnings:", errors);
            // Decide if you want to alert the user about non-fatal warnings
            // alert(AppStrings.IMPORT_SUCCESS_PARTIAL(errors));
        }

        const originalTree = [...treeData]; // Keep for rollback if needed
        setTreeData(validData); // Set local state immediately

        if (currentUser?.emailVerified) {
            setDataWarningMessage("Imported locally. Attempting to save to Firebase...");
            const saved = await saveTreeDataToFirebase(validData);
            if (saved) {
                setDataWarningMessage(AppStrings.SAVE_SUCCESS);
                setTimeout(() => setDataWarningMessage(null), 3000);
            } else {
                setDataWarningMessage("Import successful locally, but FAILED to save to Firebase. Check errors.");
                // Optionally revert local state on save failure after import?
                 setTreeData(originalTree); // Revert if save fails
                 setDataWarningMessage("Import failed: Could not save the imported data to Firebase. Reverted local changes.");
            }
        } else if (currentUser) {
            setDataWarningMessage(AppStrings.IMPORT_LOCAL_VERIFY_WARNING);
        } else {
            setDataWarningMessage(AppStrings.IMPORT_LOCAL_WARNING);
        }
    }, [currentUser, saveTreeDataToFirebase, treeData]); // Added treeData dependency for rollback

    const handleExportData = useCallback(() => {
         // Validate before exporting
         const { validData, errors } = validateAndNormalizePersonData(treeData);
         if (!validData) {
             console.error("Current tree data is invalid, cannot export:", errors);
             alert(`Export failed: Current data is invalid. Please fix errors first.\n- ${errors.join('\n- ')}`);
             return []; // Return empty array or handle error appropriately
         }
         if (errors.length > 0) {
             console.warn("Exporting data with validation warnings:", errors);
         }
         return validData; // Export the validated data
    }, [treeData]);


    return {
        treeData,
        dbDataStatus,
        dataWarningMessage,
        // fetchTreeData, // Not usually needed externally
        handleImportData,
        handleExportData,
        handleAddPerson,
        handleEditPerson,
        handleDeletePerson,
    };
}