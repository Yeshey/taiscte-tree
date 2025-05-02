// src/components/tree/CustomNode.tsx
import React from 'react';
import { TreeNodeDatum } from 'react-d3-tree';
import { Person } from '../../types/models';
import { PlusCircle, MinusCircle, Edit } from 'react-feather';

// Placeholder can be defined here or imported if used elsewhere
const placeholderImageUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjY2NjY2NjIiBkPSJNMTIgMTJhMi41IDIuNSAwIDAgMSAyLjUgMi41IDIuNSAyLjUgMCAwIDEgLTIuNSAyLjUgMi41IDIuNSAwIDAgMSAtMi41IC0yLjUgMi41IDIuNSAwIDAgMSAyLjUgLTIuNXptMCAtOWMzLjMxMyAwIDYgMi42ODcgNiA2IDAgMy4zMTQtMi42ODcgNiAtNiA2cy02LTIuNjg2LTYtNiAwLTMuMzEzIDIuNjg3LTYgNi02em0wIDEwYzIuNjcgMCA4IDEuMzMgOCA0djJoLTE2di0yYzAtMi42NyA1LjMzLTQgOC00eiIvPjwvc3ZnPg==";

interface CustomNodeProps {
    nodeDatum: TreeNodeDatum;
    personData?: Person; // Extracted person data
    familyColor?: string; // Calculated color
    isArtificialRoot: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    cardWidth: number;
    cardHeight: number;
    onNodeClick: (person: Person) => void;
    onAddPersonClick: (padrinhoId: string) => void;
    onDeletePersonClick: (personId: string, personName: string) => void;
    onEditPersonClick: (person: Person) => void;
}

const CustomNode: React.FC<CustomNodeProps> = ({
    nodeDatum,
    personData,
    familyColor,
    isArtificialRoot,
    canAdd,
    canEdit,
    canDelete,
    cardWidth,
    cardHeight,
    onNodeClick,
    onAddPersonClick,
    onDeletePersonClick,
    onEditPersonClick,
}) => {

    const imageUrl = typeof personData?.imageUrl === 'string' && personData.imageUrl ? personData.imageUrl : placeholderImageUrl;
    const nodeName = personData?.name || nodeDatum.name || 'Unknown';
    const displayName = personData?.nickname ? `${personData.name} "${personData.nickname}"` : personData?.name || nodeName;
    const familyName = personData?.familyName;

    const nodeCardStyle = {
        ...styles.nodeCard,
        ...(familyColor && !isArtificialRoot && {
            borderLeft: `6px solid ${familyColor}`,
        }),
    };

    const formatDate = (dateStr: string | undefined, format: 'year' | 'month' | 'day') => {
        if (!dateStr || typeof dateStr !== 'string') return '';
        try {
            const date = new Date(dateStr + 'T00:00:00');
            if (isNaN(date.getTime())) return `Invalid Date: ${dateStr}`;
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            if (format === 'year') return year.toString();
            if (format === 'month') return `${month}/${year}`;
            if (format === 'day') return `${day}/${month}/${year}`;
        } catch (e) { return `Format Error: ${dateStr}`; }
        return dateStr;
    };

    // --- Button Positioning ---
    const cardX = -cardWidth / 2; const cardY = -cardHeight / 2;
    const buttonSize = 16;
    const buttonOffsetY = cardY + cardHeight + 1;
    const buttonSpacing = 8;
    const visibleButtons: ('edit' | 'delete' | 'add')[] = [];
    if (canEdit && personData) visibleButtons.push('edit');
    if (canDelete) visibleButtons.push('delete');
    if (canAdd) visibleButtons.push('add');
    const visibleButtonCount = visibleButtons.length;
    const totalButtonsWidth = (visibleButtonCount * buttonSize) + (Math.max(0, visibleButtonCount - 1) * buttonSpacing);
    const startX = -totalButtonsWidth / 2;
    const getButtonPosition = (type: 'edit' | 'delete' | 'add'): number | null => {
        const index = visibleButtons.indexOf(type);
        if (index === -1) return null;
        return startX + (index * (buttonSize + buttonSpacing));
    };
    const editButtonX = getButtonPosition('edit');
    const deleteButtonX = getButtonPosition('delete');
    const addButtonX = getButtonPosition('add');

    // --- Handlers ---
    const handleNodeCardClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (personData && !isArtificialRoot) {
            onNodeClick(personData);
        }
    };

    return (
        <g onClick={handleNodeCardClick} style={{ cursor: isArtificialRoot ? 'default' : 'pointer' }}>
            <foreignObject width={cardWidth} height={cardHeight} x={cardX} y={cardY}>
                <div style={nodeCardStyle}>
                    <img src={imageUrl} alt={nodeName} style={isArtificialRoot ? styles.rootImage : styles.personImage} onError={(e) => { const t=e.target as HTMLImageElement; if(t.src!==placeholderImageUrl) t.src=placeholderImageUrl; }}/>
                    {!isArtificialRoot && (
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
                    {isArtificialRoot && <div style={{marginTop: '10px', fontWeight: 'bold'}}>{nodeName}</div>}
                </div>
            </foreignObject>

             {/* Action Buttons */}
             {canEdit && personData && editButtonX !== null && ( <g transform={`translate(${editButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onEditPersonClick(personData); }} className="node-action-button" style={styles.actionButton}> <Edit size={buttonSize} color="#ffc107"/> </g> )}
             {canDelete && deleteButtonX !== null && ( <g transform={`translate(${deleteButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onDeletePersonClick(personData?.id || '', nodeName); }} className="node-action-button" style={styles.actionButton}> <MinusCircle size={buttonSize} color="#dc3545"/> </g> )}
             {canAdd && addButtonX !== null && ( <g transform={`translate(${addButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onAddPersonClick(personData?.id || ''); }} className="node-action-button" style={styles.actionButton}> <PlusCircle size={buttonSize} color="#28a745"/> </g> )}
        </g>
    );
};


// --- Styles (Copied subset from GenealogyTree) ---
const styles: { [key: string]: React.CSSProperties } = {
    nodeCard: {
        border: '1px solid #ccc',
        borderLeft: '6px solid transparent',
        borderRadius: '8px', padding: '8px',
        backgroundColor: 'white', width: '100%', height: '100%',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden',
        paddingLeft: '5px',
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
        flexShrink: 0
    },
    rootImage: {
        width: 'auto',
        height: '40px',
        maxWidth: '90%',
        objectFit: 'contain',
        flexShrink: 0,
        marginBottom: '5px',
    },
    actionButton: {
        cursor: 'pointer',
        opacity: 0.6,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: 'all'
    },
};

export default CustomNode;