// src/hooks/useDropdownOptions.ts
import { useMemo } from 'react';
import { Person } from '../types/models';
import * as AppStrings from '../constants/strings';

export function useDropdownOptions(treeData: Person[]) {

    const familyNameOptions: string[] = useMemo(() => {
        const names = new Set(treeData.map(p => p.familyName).filter(Boolean));
        return Array.from(names).sort();
    }, [treeData]);

    const naipeOptions: string[] = useMemo(() => {
        const naipes = new Set(
            treeData
                .map(p => p.naipeVocal)
                .filter((n): n is string => typeof n === 'string' && n !== '')
        );
        return Array.from(naipes).sort();
    }, [treeData]);

    const instrumentOptions: string[] = useMemo(() => {
        const instruments = new Set<string>();
        treeData.forEach(p => {
            if (p.mainInstrument && typeof p.mainInstrument === 'string') {
                instruments.add(p.mainInstrument);
            }
            p.otherInstruments?.forEach(inst => {
                if (typeof inst === 'string' && inst !== '') {
                    instruments.add(inst);
                }
            });
        });
        return Array.from(instruments).sort();
    }, [treeData]);

    const hierarchyOptions: string[] = useMemo(() => {
        const currentHierarchy = treeData
            .map(p => p.hierarquia)
            .filter((h): h is string => typeof h === 'string' && h !== '');

        const options = new Set<string>(AppStrings.HIERARCHIA_BASE_LEVELS.map(l => l.defaultName));
        currentHierarchy.forEach(h => options.add(h));

        return Array.from(options).sort((a, b) => {
            const indexA = AppStrings.HIERARCHIA_BASE_LEVELS.findIndex(l => l.defaultName === a);
            const indexB = AppStrings.HIERARCHIA_BASE_LEVELS.findIndex(l => l.defaultName === b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [treeData]);

    return {
        familyNameOptions,
        naipeOptions,
        instrumentOptions,
        hierarchyOptions,
    };
}