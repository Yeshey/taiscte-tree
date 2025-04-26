import React, { useState, useCallback } from 'react';
import Tree, { Point, RawNodeDatum, TreeNodeDatum, RenderCustomNodeElementFn } from 'react-d3-tree'; // Corrected import
import { Person } from '../types/models';
import { transformDataForTree } from '../utils/treeHelpers';
import { PlusCircle, MinusCircle, Edit } from 'react-feather'; 

interface GenealogyTreeProps {
    data: Person[];
}

// Placeholder image (simple SVG person icon encoded as data URI)
const placeholderImageUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjY2NjY2NjIiBkPSJNMTIgMTJhMi41IDIuNSAwIDAgMSAyLjUgMi41IDIuNSAyLjUgMCAwIDEgLTIuNSAyLjUgMi41IDIuNSAwIDAgMSAtMi41IC0yLjUgMi41IDIuNSAwIDAgMSAyLjUgLTIuNXptMCAtOWMzLjMxMyAwIDYgMi42ODcgNiA2IDAgMy4zMTQtMi42ODcgNiAtNiA2cy02LTIuNjg2LTYtNiAwLTMuMzEzIDIuNjg3LTYgNi02em0wIDEwYzIuNjcgMCA4IDEuMzMgOCA0djJoLTE2di0yYzAtMi42NyA1LjMzLTQgOC00eiIvPjwvc3ZnPg==";

interface GenealogyTreeProps {
    data: Person[];
    onAddPersonClick: (parentId: string) => void;
    onDeletePersonClick: (personId: string, personName: string) => void;
    onEditPersonClick: (person: Person) => void;
    isUserLoggedIn: boolean;
}

const GenealogyTree: React.FC<GenealogyTreeProps> = ({
    data,
    onAddPersonClick,
    onDeletePersonClick,
    onEditPersonClick,
    isUserLoggedIn
}) => {
    const minZoom = 0.06;
    const maxZoom = 10;
    const initialDepthValue = 1;
    const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(0.6);

    React.useEffect(() => {
        if (data.length > 0) {
          const treeContainer = document.querySelector('.tree-container');
          if (treeContainer) {
            const { width, height } = treeContainer.getBoundingClientRect();
            setTranslate({ x: width / 2, y: height / 5 });
          }
        }
    }, [data]); // Re-center only when base data changes

    // Use explicit type for useMemo return if needed, but TreeNode should align
    const treeData = React.useMemo(() => {
        return transformDataForTree(data);
    }, [data]);

    const handleUpdate = useCallback(({ translate: newTranslate, zoom: newZoom }: { translate: Point, zoom: number }) => {
      setTranslate(newTranslate);
      setZoom(newZoom);
  }, []); // Keep empty dependencies

    const handleZoomIn = () => { setZoom(prevZoom => Math.min(prevZoom * 1.2, maxZoom)); };
    const handleZoomOut = () => { setZoom(prevZoom => Math.max(prevZoom / 1.2, minZoom)); };

    // Render custom node element
    const renderCustomNodeElement: RenderCustomNodeElementFn = ({
        nodeDatum,
        toggleNode,
    }) => {
        const nodeAttributes = nodeDatum.attributes || {};
        // --- FIX 1: Get Person data safely from attributes ---
        // Cast attributes directly, assuming transformDataForTree populated it correctly
        const personData = nodeAttributes as unknown as Person | undefined;

        // --- Checks ---
        const nodeDepth = nodeDatum.__rd3t?.depth;
        const hasActualChildren = !!nodeDatum.children?.length;
        const hasManuallyHiddenChildren = !!(nodeDatum as any)?._children?.length;
        const hasInitiallyHiddenChildren = hasActualChildren && typeof nodeDepth === 'number' && (nodeDepth + 1 >= initialDepthValue);
        const showExpandIndicator = hasActualChildren && (hasInitiallyHiddenChildren || hasManuallyHiddenChildren);
        const isLeafNode = !hasActualChildren && !hasManuallyHiddenChildren;
        const canDelete = isUserLoggedIn && isLeafNode && nodeAttributes?.id !== 'root';
        const canAdd = isUserLoggedIn && nodeAttributes?.id !== 'root';
        const canEdit = isUserLoggedIn && nodeAttributes?.id !== 'root';

        // --- Display Setup ---
        const imageUrl = typeof nodeAttributes.imageUrl === 'string' && nodeAttributes.imageUrl ? nodeAttributes.imageUrl : placeholderImageUrl;
        const nodeName = nodeDatum.name || 'Unknown';
        const isRootNode = nodeAttributes?.id === 'root';

        const formatDate = (dateStr: string | undefined | number | boolean, format: 'year' | 'month') => {
            if (typeof dateStr !== 'string' || !dateStr) return ''; // Ensure it's a string
            try {
                 if (format === 'month' && /^\d{4}-\d{2}$/.test(dateStr)) { const [year, month] = dateStr.split('-'); return `${month}/${year}`; }
                 // Handle cases where date might be just YYYY or invalid
                 if (!dateStr.includes('-')) { // Basic check if it's not YYYY-MM or YYYY-MM-DD
                    if (/^\d{4}$/.test(dateStr) && format === 'year') return dateStr; // If just year, return it
                    return ''; // Otherwise invalid format
                 }
                const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
                if (isNaN(date.getTime())) return '';
                if (format === 'year') return date.getFullYear().toString();
                if (format === 'month') return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            } catch (e) { return ''; }
            return '';
        };

        const birthYear = formatDate(nodeAttributes.birthDate, 'year');
        const deathYear = formatDate(nodeAttributes.deathDate, 'year');
        const subidaDate = formatDate(nodeAttributes.subidaPalcoDate, 'month');
        const passagemDate = formatDate(nodeAttributes.passagemTunoDate, 'month');

        // --- Positioning ---
        const cardWidth    = 180;
        const cardHeight   = 160;
        const cardX        = -cardWidth / 2;
        const cardY        = -cardHeight / 2;
        const indicatorRadius = 6;
        const indicatorY      = cardY + cardHeight + 15;
        const buttonSize    = 18;
        const buttonOffsetY = cardY + cardHeight + 5;
        // Buttons: edit (left), delete (center), add (right)
        const editButtonX   = cardX + (buttonSize / 2);
        const deleteButtonX = cardX + (cardWidth / 2) + (buttonSize / 2);
        const addButtonX    = cardX + cardWidth - (buttonSize / 2) - 15;

        return (
            <g onClick={toggleNode} style={{ cursor: 'pointer' }}>
                {/* Main Node Card */}
                <foreignObject width={cardWidth} height={cardHeight} x={cardX} y={cardY}>
                    <div style={styles.nodeCard}>
                         {/* Image */}
                        <img
                            src={imageUrl} alt={nodeName}
                            style={isRootNode ? styles.rootImage : styles.personImage}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== placeholderImageUrl) { target.src = placeholderImageUrl; }
                             }}
                        />
                        {/* Details */}
                        <div style={styles.nodeName}>{nodeName}</div>
                        {(birthYear || deathYear) && (<div style={styles.nodeDetails}>{birthYear ? `b. ${birthYear}` : ''}{birthYear && deathYear ? ' - ' : ''}{deathYear ? `d. ${deathYear}` : ''}</div>)}
                        {!isRootNode && (
                            <>
                                {nodeAttributes.curso && <div style={styles.nodeDetails}>Curso: {nodeAttributes.curso}</div>}
                                {nodeAttributes.vocalNaipe && <div style={styles.nodeDetails}>Naipe: {nodeAttributes.vocalNaipe}</div>}
                                {nodeAttributes.instrumento && <div style={styles.nodeDetails}>Instrumento: {nodeAttributes.instrumento}</div>}
                                {subidaDate && <div style={styles.nodeDetails}>Subida: {subidaDate}</div>}
                                {passagemDate && <div style={styles.nodeDetails}>Passagem: {passagemDate}</div>}
                                {nodeAttributes.notes && <div style={styles.nodeNotes}>Notes: {nodeAttributes.notes}</div>}
                            </>
                        )}
                        {isRootNode && nodeAttributes.notes && <div style={styles.nodeNotes}>{nodeAttributes.notes}</div>}
                    </div>
                </foreignObject>

                
                {/* Expand/Collapse Indicator Circle */}
                { // THIS WAS TO SHOW A LITTLE INDICATOR IN NODES THAT STILL HAVE CHILDS
                /*showExpandIndicator && (
                    <circle cx="0" cy={indicatorY} r={indicatorRadius} style={styles.indicatorCircle} onClick={(e) => { e.stopPropagation(); toggleNode(); }} />
                )*/}

                {/* --- FIX 2: Icons are now available --- */}
                {/* Add Person Button */}
                {canAdd && (
                    <g transform={`translate(${addButtonX + buttonSize/2}, ${buttonOffsetY})`}
                       onClick={(e) => { e.stopPropagation(); onAddPersonClick(nodeAttributes.id as string); }}
                       className="node-action-button"> {/* <<< Class is already here */}
                        <PlusCircle size={buttonSize} color="#28a745"/>
                    </g>
                )}

                 {/* Edit Person Button */}
                 {canEdit && personData && ( // Check if personData exists before allowing edit
                    <g transform={`translate(${editButtonX - buttonSize/2}, ${buttonOffsetY})`} // Center below
                       onClick={(e) => { e.stopPropagation(); onEditPersonClick(personData); }}
                       className="node-action-button">
                        <Edit size={buttonSize} color="#ffc107"/>
                    </g>
                 )}

                {/* Delete Person Button */}
                {canDelete && (
                     <g transform={`translate(${deleteButtonX - buttonSize}, ${buttonOffsetY})`} // Adjust positioning
                       onClick={(e) => { e.stopPropagation(); onDeletePersonClick(nodeAttributes.id as string, nodeName); }}
                       className="node-action-button">
                        <MinusCircle size={buttonSize} color="#dc3545"/>
                    </g>
                )}
            </g>
        );
    };

    // Adjust nodeSize
    const nodeHeight = 160; const bottomSpacing = 35;
    const totalNodeHeight = nodeHeight + bottomSpacing;

    // --- FIX 3: Simplify loading/empty check ---
    if (!treeData || treeData.name === 'No Data') {
        // Check if data is empty or if the transformed tree is the "No Data" node
        // Use the original data prop length for a more direct check if needed: if (data.length === 0) ...
         return <div>No family tree data available or data is empty.</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div className="zoom-controls">
                <button className="zoom-button" onClick={handleZoomIn}>+</button>
                <button className="zoom-button" onClick={handleZoomOut}>-</button>
            </div>
            <Tree
                // --- FIX 4: Keep cast, ensures compatibility ---
                data={treeData as RawNodeDatum}
                orientation="vertical"
                translate={translate}
                zoom={zoom}
                onUpdate={handleUpdate} // Use the memoized handler
                zoomable={true}
                scaleExtent={{ min: minZoom, max: maxZoom }}
                renderCustomNodeElement={renderCustomNodeElement}
                separation={{ siblings: 1.2, nonSiblings: 1.5 }}
                nodeSize={{ x: 220, y: totalNodeHeight }}
                pathFunc="step"
                depthFactor={200} // Adjust vertical spacing if needed
                // initialDepth={initialDepthValue} // fully expanded
                transitionDuration={300}
            />
        </div>
    );
};

// --- Styles (Keep as is) ---
const styles: { [key: string]: React.CSSProperties } = {
    nodeCard: { border: '1px solid #ccc', borderRadius: '8px', padding: '8px', backgroundColor: 'white', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden', },
    nodeName: { fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95%' },
    nodeDetails: { fontSize: '11px', color: '#555', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95%' },
    nodeNotes: { fontSize: '10px', fontStyle: 'italic', color: '#777', marginTop: '3px', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: '3.6em', lineHeight: '1.2em' },
    personImage: { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', marginBottom: '5px', border: '1px solid #eee' },
    rootImage: { width: 'auto', height: '55px', maxWidth: '90%', objectFit: 'contain', marginBottom: '5px', },
    indicatorCircle: { fill: "#6c757d", stroke: "#343a40", strokeWidth: "1", cursor: 'pointer' },
    actionButton: { cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s ease', },
};

export default GenealogyTree;