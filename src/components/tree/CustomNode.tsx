// src/components/tree/CustomNode.tsx
import React from 'react';
import { TreeNodeDatum } from 'react-d3-tree';
import { Person } from '../../types/models';
import { PlusCircle, MinusCircle, Edit } from 'react-feather';

// Placeholder can be defined here or imported if used elsewhere
const placeholderImageUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjY2NjY2NjIiBkPSJNMTIgMTJhMi41IDIuNSAwIDAgMSAyLjUgMi41IDIuNSAyLjUgMCAwIDEgLTIuNSAyLjUgMi41IDIuNSAwIDAgMSAtMi41IC0yLjUgMi41IDIuNSAwIDAgMSAyLjUgLTIuNXptMCAtOWMzLjMxMyAwIDYgMi42ODcgNiA2IDAgMy4zMTQtMi42ODcgNiAtNiA2cy02LTIuNjg2LTYtNiAwLTMuMzEzIDIuNjg3LTYgNi02em0wIDEwYzIuNjcgMCA4IDEuMzMgOCA0djJoLTE2di0yYzAtMi42NyA1LjMzLTQgOC00eiIvPjwvc3ZnPg==";

interface CustomNodeProps {
    nodeDatum: TreeNodeDatum;
    personData?: Person; // Extracted person data (will be undefined for artificial root)
    familyColor?: string; // Calculated color
    isArtificialRoot: boolean; // Explicitly know if it's the main 'root' node
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    cardWidth: number;
    cardHeight: number;
    onNodeClick: (person: Person) => void;
    onAddPersonClick: (targetNodeId: string) => void; // Use targetNodeId for clarity
    onDeletePersonClick: (personId: string, personName: string) => void;
    onEditPersonClick: (person: Person) => void;
    // toggleNode: () => void; // Add if needed for collapse/expand
}

const CustomNode: React.FC<CustomNodeProps> = ({
    nodeDatum,
    personData,
    familyColor,
    isArtificialRoot, // Use this prop
    canAdd,
    canEdit,
    canDelete,
    cardWidth,
    cardHeight,
    onNodeClick,
    onAddPersonClick,
    onDeletePersonClick,
    onEditPersonClick,
    // toggleNode, // Destructure if used
}) => {

    // Use attributes from nodeDatum for artificial root display
    const nodeAttributes = nodeDatum.attributes as any; // Cast for easier access
    const imageUrl = isArtificialRoot
        ? nodeAttributes?.imageUrl || placeholderImageUrl
        : personData?.imageUrl || placeholderImageUrl;
    const nodeName = isArtificialRoot
        ? nodeAttributes?.name || 'TAISCTE'
        : personData?.name || 'Unknown';
    const displayName = personData?.nickname ? `${personData.name} "${personData.nickname}"` : nodeName;
    const familyName = personData?.familyName;

    const nodeCardStyle = {
        ...styles.nodeCard,
        ...(familyColor && !isArtificialRoot && { // Apply color only to actual people
            borderLeft: `6px solid ${familyColor}`,
        }),
    };

    // --- Button Positioning ---
    const cardX = -cardWidth / 2; const cardY = -cardHeight / 2;
    const buttonSize = 16;
    const buttonOffsetY = cardY + cardHeight + 1; // Vertical position below the card
    const buttonSpacing = 8;

    // Determine which buttons are ACTUALLY visible based on props
    const visibleButtons: ('edit' | 'delete' | 'add')[] = [];
    if (canEdit && personData) visibleButtons.push('edit'); // Edit only on real people
    if (canDelete && personData) visibleButtons.push('delete'); // Delete only on real people
    if (canAdd) visibleButtons.push('add'); // Add can appear on any node (including root)

    const visibleButtonCount = visibleButtons.length;
    const totalButtonsWidth = (visibleButtonCount * buttonSize) + (Math.max(0, visibleButtonCount - 1) * buttonSpacing);
    const startX = -totalButtonsWidth / 2; // Center the group of buttons horizontally

    const getButtonPositionX = (type: 'edit' | 'delete' | 'add'): number | null => {
        const index = visibleButtons.indexOf(type);
        if (index === -1) return null;
        return startX + (index * (buttonSize + buttonSpacing));
    };

    const editButtonX = getButtonPositionX('edit');
    const deleteButtonX = getButtonPositionX('delete');
    let addButtonX = getButtonPositionX('add'); // Use let to allow modification

    // *** ADDED: Adjust Add button position specifically for the root node ***
    const rootButtonOffset = -10; // Shift 10 pixels to the left for the root
    if (isArtificialRoot && addButtonX !== null) {
        addButtonX += rootButtonOffset;
    }
    // *** END ADJUSTMENT ***


    // --- Handlers ---
    const handleNodeCardClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (personData && !isArtificialRoot) { // Only trigger details for actual people
            onNodeClick(personData);
        }
        // Optional: Add expand/collapse logic if needed
        // else if (!isArtificialRoot && toggleNode) { // Allow collapsing real nodes
        //     toggleNode();
        // }
    };

    const handleAddClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        const targetNodeId = isArtificialRoot ? 'root' : personData?.id;
        if (targetNodeId) {
            onAddPersonClick(targetNodeId);
        } else {
            console.error("Cannot add: Node identifier is missing.");
        }
    };

    const handleEditClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (personData && canEdit) {
            onEditPersonClick(personData);
        }
    };

    const handleDeleteClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (personData && canDelete) {
            onDeletePersonClick(personData.id, personData.name || 'this person');
        }
    };


    return (
        <g onClick={handleNodeCardClick} style={{ cursor: isArtificialRoot ? 'default' : 'pointer' }}>
            <foreignObject width={cardWidth} height={cardHeight} x={cardX} y={cardY}>
                <div style={nodeCardStyle}>
                    <img src={imageUrl} alt={nodeName} style={isArtificialRoot ? styles.rootImage : styles.personImage} onError={(e) => { const t=e.target as HTMLImageElement; if(t.src!==placeholderImageUrl) t.src=placeholderImageUrl; }}/>

                    {/* Display name differently for root vs person */}
                    {isArtificialRoot ? (
                         <div style={{...styles.nodeName, marginTop: '10px', fontWeight: 'bold'}}>{nodeName}</div>
                    ) : (
                         <div style={styles.nodeName} title={displayName}>{displayName}</div>
                    )}

                    {!isArtificialRoot && personData && (
                         <div style={{...styles.nodeDetails, fontSize: '10px', fontStyle: 'italic'}}>Família {familyName || '?'}</div>
                    )}
                    {!isArtificialRoot && personData && (
                        <>
                            <div style={styles.nodeDetails}>{personData.hierarquia || '-'}</div>
                            <div style={styles.nodeDetails}>{personData.naipeVocal || '-'}</div>
                            <div style={styles.nodeDetails}>{personData.mainInstrument || '-'}</div>
                        </>
                    )}
                </div>
            </foreignObject>

             {/* Action Buttons - Render based on calculated positions */}
             {/* Edit Button */}
             {canEdit && personData && editButtonX !== null && (
                 <g transform={`translate(${editButtonX}, ${buttonOffsetY})`} onClick={handleEditClick} className="node-action-button" style={styles.actionButton}>
                     <title>Edit {personData.name}</title>
                     <Edit size={buttonSize} color="#ffc107"/>
                 </g>
             )}
             {/* Delete Button */}
             {canDelete && personData && deleteButtonX !== null && (
                 <g transform={`translate(${deleteButtonX}, ${buttonOffsetY})`} onClick={handleDeleteClick} className="node-action-button" style={styles.actionButton}>
                     <title>Delete {personData.name}</title>
                     <MinusCircle size={buttonSize} color="#dc3545"/>
                 </g>
             )}
             {/* Add Button - Use the potentially adjusted addButtonX */}
             {canAdd && addButtonX !== null && (
                 <g transform={`translate(${addButtonX}, ${buttonOffsetY})`} onClick={handleAddClick} className="node-action-button" style={styles.actionButton}>
                     <title>Add Afilhado {isArtificialRoot ? 'to TAISCTE' : `to ${nodeName}`}</title>
                     <PlusCircle size={buttonSize} color="#28a745"/>
                 </g>
             )}
        </g>
    );
};


// --- Styles (No changes needed here) ---
const styles: { [key: string]: React.CSSProperties } = {
    nodeCard: {
        border: '1px solid #ccc',
        borderLeft: '6px solid transparent',
        borderRadius: '8px', padding: '8px',
        backgroundColor: 'white', width: '100%', height: '100%',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start', // Aligned content to top
        textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden',
        paddingLeft: '5px', // Compensate for border-left potential width
    },
    nodeName: {
        fontWeight: 'bold', fontSize: '13px',
        marginBottom: '3px', maxWidth: '95%',
        whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.3',
        marginTop: '4px',
    },
    nodeDetails: {
        fontSize: '11px',
        color: '#555', marginBottom: '1px', whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95%',
    },
    personImage: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid #eee',
        flexShrink: 0, // Prevent image shrinking
        marginTop: '5px', // Add some top margin
    },
    rootImage: { // Style specifically for the root logo/image
        width: 'auto', // Let aspect ratio determine width
        height: '45px', // Slightly larger for root
        maxWidth: '80%', // Limit width within card
        objectFit: 'contain', // Ensure logo isn't distorted
        flexShrink: 0,
        marginBottom: '5px', // Space below logo
        marginTop: '5px',
    },
    actionButton: {
        cursor: 'pointer',
        opacity: 0.6,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: 'all' // Ensure clicks are registered
    },
    // actionButton hover is handled by CSS: .node-action-button:hover { opacity: 1; }
};

export default CustomNode;