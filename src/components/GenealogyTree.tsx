// src/components/GenealogyTree.tsx
import React, { useState, useMemo, useCallback } from 'react';
import Tree, { Point, RawNodeDatum, TreeNodeDatum, RenderCustomNodeElementFn } from 'react-d3-tree';
import { Person } from '../types/models';
// Import the new component and utils
import CustomNode from './tree/CustomNode';
import { transformTunaDataForTree, generateHslColor, TreeNode } from '../utils/treeTransform'; // Adjusted path

// GenealogyTreeProps remains the same
interface GenealogyTreeProps {
    data: Person[];
    allPeople: Person[];
    onAddPersonClick: (padrinhoId: string) => void;
    onDeletePersonClick: (personId: string, personName: string) => void;
    onEditPersonClick: (person: Person) => void;
    isUserLoggedIn: boolean;
    onNodeClick: (person: Person) => void;
}

const GenealogyTree: React.FC<GenealogyTreeProps> = ({
    data: treeDataProp,
    // allPeople prop might not be needed if CustomNode doesn't use it directly
    onAddPersonClick,
    onDeletePersonClick,
    onEditPersonClick,
    isUserLoggedIn,
    onNodeClick
}) => {
    const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(0.6);
    const minZoom = 0.06;
    const maxZoom = 10;

    // Effect for centering (no change)
    React.useEffect(() => {
        // Center the view when the component mounts or data changes significantly
        const treeContainer = document.querySelector('.tree-container');
        if (treeContainer) {
            const { width, height } = treeContainer.getBoundingClientRect();
            // Adjust initial centering based on whether it's the artificial root
            setTranslate({ x: width / 2, y: height / 4 });
        }
    }, [treeDataProp]); // Trigger centering based on prop change

    // Memoized color map (no change)
    const familyColorMap = useMemo(() => {
        const map = new Map<string, string>();
        const uniqueFamilies = Array.from(
            new Set(treeDataProp.map(p => p.familyName).filter((name): name is string => !!name))
        ).sort();
        const numFamilies = uniqueFamilies.length;
        if (numFamilies === 0) return map;
        const hueStep = 360 / numFamilies;
        uniqueFamilies.forEach((familyName, index) => {
            const hue = Math.round(index * hueStep);
            map.set(familyName, generateHslColor(hue));
        });
        console.log("Generated Unique Family Colors:", map);
        return map;
    }, [treeDataProp]);

    // Memoized tree data using imported transformation function
    const treeData = useMemo(() => {
        console.log("Transforming data for tree using imported function...");
        return transformTunaDataForTree(treeDataProp);
    }, [treeDataProp]);

    // Zoom/Pan Handlers (no change)
    const handleUpdate = useCallback(({ translate: newTranslate, zoom: newZoom }: { translate: Point, zoom: number }) => {
        setTranslate(newTranslate); setZoom(newZoom);
    }, []);
    const handleZoomIn = () => { setZoom(prevZoom => Math.min(prevZoom * 1.2, maxZoom)); };
    const handleZoomOut = () => { setZoom(prevZoom => Math.max(prevZoom / 1.2, minZoom)); };

    // Constants for layout (no change)
    const cardWidth = 200;
    const cardHeight = 185;
    const bottomButtonSpacing = 35;
    const noButtonSpacing = 20;
    const bottomSpacing = isUserLoggedIn ? bottomButtonSpacing : noButtonSpacing;
    const totalNodeHeight = cardHeight + bottomSpacing;

    // Simplified Render Function - Delegates to CustomNode
    const renderCustomNodeElement: RenderCustomNodeElementFn = ({ nodeDatum, toggleNode }) => { // Added toggleNode for potential future use
        // Extract necessary data and calculate props for CustomNode
        const nodeAttributes = nodeDatum.attributes as TreeNode['attributes'] | undefined;
        const personData = (nodeAttributes?.id && nodeAttributes?.name && nodeAttributes.id !== 'root' && nodeAttributes.id !== 'no_data' && nodeAttributes.id !== 'error_root') ? nodeAttributes as unknown as Person : undefined;
        const familyName = personData?.familyName;
        const familyColor = familyName ? familyColorMap.get(familyName) : undefined;
        // Check if it's the artificial root (ID 'root') or other non-person nodes
        const isArtificialRoot = nodeAttributes?.id === 'root';
        const isNonPersonNode = ['no_data', 'error_root'].includes(nodeAttributes?.id as string) || isArtificialRoot;


        // Determine permissions based on login status and node type
        const hasAfilhados = !!nodeDatum.children?.length;
        const hasManuallyHiddenAfilhados = !!(nodeDatum as any)?._children?.length; // Check if manually collapsed
        const isLeafNode = !hasAfilhados && !hasManuallyHiddenAfilhados; // Consider collapsed nodes as non-leaf for deletion

        // Permissions Logic:
        const canEdit = isUserLoggedIn && !isNonPersonNode && !!personData; // Can edit only real people
        const canDelete = isUserLoggedIn && !isNonPersonNode && !!personData && isLeafNode; // Can delete only real leaf people
        // *** MODIFIED: Allow add button on the artificial root ***
        const canAdd = isUserLoggedIn; // Add button can appear on ANY node if logged in

        return (
            <CustomNode
                nodeDatum={nodeDatum}
                personData={personData} // Will be undefined for artificial root
                familyColor={familyColor}
                isArtificialRoot={isArtificialRoot} // Pass specifically if it's the main 'root' node
                canAdd={canAdd}
                canEdit={canEdit}
                canDelete={canDelete}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                onNodeClick={onNodeClick}
                onAddPersonClick={onAddPersonClick}
                onDeletePersonClick={onDeletePersonClick}
                onEditPersonClick={onEditPersonClick}
                // toggleNode={toggleNode} // Pass if CustomNode needs to handle collapse/expand
            />
        );
    };

    // Loading/Empty checks (no change) - transform function handles empty data now
    // if (!treeDataProp || treeDataProp.length === 0) { return <div className="loading">Loading tree data or tree is empty...</div>; }
    // if (!treeData || ['No Data', 'Error'].includes(treeData.name)) { return <div>{treeData.attributes?.name || 'Could not generate tree structure.'}</div>; }

    // Main return with Tree component (no change in structure)
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
             <div className="zoom-controls"> <button className="zoom-button" onClick={handleZoomIn}>+</button> <button className="zoom-button" onClick={handleZoomOut}>-</button> </div>
            <Tree
                data={treeData as unknown as RawNodeDatum} // Data is now always the artificial root structure
                orientation="vertical"
                translate={translate} zoom={zoom} onUpdate={handleUpdate}
                zoomable={true} scaleExtent={{ min: minZoom, max: maxZoom }}
                renderCustomNodeElement={renderCustomNodeElement}
                nodeSize={{ x: cardWidth + 20, y: totalNodeHeight }}
                separation={{ siblings: 1.0, nonSiblings: 1.2 }}
                pathFunc="step"
                // collapsible={true} // Enable if you want expand/collapse behavior
                // initialDepth={1} // Optionally start with only the first level visible
                transitionDuration={0} // Set to 0 for faster updates, or e.g. 300 for animations
            />
        </div>
    );
};

export default GenealogyTree;