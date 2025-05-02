// src/components/GenealogyTree.tsx
import React, { useState, useMemo, useCallback } from 'react'; // Added useState, useMemo, useCallback
import Tree, { Point, RawNodeDatum, TreeNodeDatum, RenderCustomNodeElementFn } from 'react-d3-tree';
import { Person } from '../types/models';
import { PlusCircle, MinusCircle, Edit } from 'react-feather';

// Define TreeNode interface at the top level
interface TreeNode {
    name: string;
    attributes: Partial<Person> & { id: string; name: string; gender: string }; // Core attributes required
    children?: TreeNode[];
    // Internal properties added by react-d3-tree
    __rd3t?: {
      id: string;
      depth: number;
      collapsed: boolean;
    };
    // Properties potentially added by the library during collapsing
    _children?: TreeNode[];
}


const placeholderImageUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjY2NjY2NjIiBkPSJNMTIgMTJhMi41IDIuNSAwIDAgMSAyLjUgMi41IDIuNSAyLjUgMCAwIDEgLTIuNSAyLjUgMi41IDIuNSAwIDAgMSAtMi41IC0yLjUgMi41IDIuNSAwIDAgMSAyLjUgLTIuNXptMCAtOWMzLjMxMyAwIDYgMi42ODcgNiA2IDAgMy4zMTQtMi42ODcgNiAtNiA2cy02LTIuNjg2LTYtNiAwLTMuMzEzIDIuNjg3LTYgNi02em0wIDEwYzIuNjcgMCA4IDEuMzMgOCA0djJoLTE2di0yYzAtMi42NyA1LjMzLTQgOC00eiIvPjwvc3ZnPg==";

interface GenealogyTreeProps {
    data: Person[];
    allPeople: Person[];
    onAddPersonClick: (padrinhoId: string) => void; // Changed parentId to padrinhoId
    onDeletePersonClick: (personId: string, personName: string) => void;
    onEditPersonClick: (person: Person) => void;
    isUserLoggedIn: boolean;
}

const GenealogyTree: React.FC<GenealogyTreeProps> = ({
    data: treeDataProp,
    allPeople,
    onAddPersonClick,
    onDeletePersonClick,
    onEditPersonClick,
    isUserLoggedIn
}) => {
    // --- State and Hooks ---
    const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(0.6);
    // Define zoom limits here
    const minZoom = 0.06;
    const maxZoom = 10;
    // REMOVED initialDepthValue

    React.useEffect(() => {
        if (treeDataProp.length > 0) {
            const treeContainer = document.querySelector('.tree-container');
            if (treeContainer) {
                const { width, height } = treeContainer.getBoundingClientRect();
                // Center slightly higher initially
                setTranslate({ x: width / 2, y: height / 4 });
            }
        }
        // Recenter only when base data changes or container resizes (more advanced)
    }, [treeDataProp]);

    // --- Tree Transformation Logic (moved from utils) ---
    const buildTunaTree = useCallback((personId: string | null, peopleMap: Map<string, Person>, processedIds: Set<string>): TreeNode | null => {
        const person = personId ? peopleMap.get(personId) : null;
        if (!person || processedIds.has(person.id)) return null;

        processedIds.add(person.id);

        const treeNode: TreeNode = {
            name: person.name,
            attributes: {
                ...(person as any), // Spread all attributes
                id: person.id, name: person.name, gender: person.gender, // Ensure core exist
            },
            children: []
        };

        const afilhados: TreeNode[] = [];
        peopleMap.forEach(potentialAfilhado => {
            // Check padrinhoId exists and is not the person themselves (prevent self-reference loop)
            if (potentialAfilhado.padrinhoId && potentialAfilhado.padrinhoId === person.id && potentialAfilhado.id !== person.id) {
                const childNode = buildTunaTree(potentialAfilhado.id, peopleMap, processedIds);
                if (childNode) { afilhados.push(childNode); }
            }
        });

        if (afilhados.length > 0) { treeNode.children = afilhados; }
        return treeNode;
    }, []); // No dependencies needed for the build logic itself

    const transformTunaDataForTree = useCallback((people: Person[]): TreeNode => {
        if (!people || people.length === 0) {
             return { name: 'No Data', attributes: { id: 'no_data', name: 'No Data', gender: 'other' } };
        }
        const peopleMap = new Map(people.map(p => [p.id, p]));
        const processedIds = new Set<string>();
        const rootPeople = people.filter(p => !p.padrinhoId || !peopleMap.has(p.padrinhoId));

        if (rootPeople.length === 0 && people.length > 0) {
            console.warn("No clear root nodes found. Creating artificial root.");
            // Attempt to build from all nodes to catch potential orphans/islands
            const allNodes = people
                .map(p => buildTunaTree(p.id, peopleMap, new Set())) // Use new Set for each top-level build attempt
                .filter(node => node !== null) as TreeNode[];
            return { name: 'TAISCTE', attributes: { id: 'artificial_root', name: 'TAISCTE', gender: 'other', imageUrl: 'https://i.imgur.com/0lluid3.jpeg' }, children: allNodes };
        } else if (rootPeople.length === 1) {
            return buildTunaTree(rootPeople[0].id, peopleMap, processedIds) || { name: 'Error', attributes: { id: 'error', name: 'Error generating tree', gender: 'other' } };
        } else {
             return { name: 'TAISCTE', attributes: { id: 'root', name: 'TAISCTE', gender: 'other', imageUrl: 'https://i.imgur.com/0lluid3.jpeg' }, children: rootPeople.map(root => buildTunaTree(root.id, peopleMap, processedIds)).filter(node => node !== null) as TreeNode[] };
        }
    }, [buildTunaTree]); // Depends on buildTunaTree

    const treeData = useMemo(() => {
        console.log("Transforming data for tree..."); // Debug log
        return transformTunaDataForTree(treeDataProp);
    }, [treeDataProp, transformTunaDataForTree]);
    // --- End Tree Data Transformation ---

    const handleUpdate = useCallback(({ translate: newTranslate, zoom: newZoom }: { translate: Point, zoom: number }) => {
        setTranslate(newTranslate); setZoom(newZoom);
    }, []);
    const handleZoomIn = () => { setZoom(prevZoom => Math.min(prevZoom * 1.2, maxZoom)); };
    const handleZoomOut = () => { setZoom(prevZoom => Math.max(prevZoom / 1.2, minZoom)); };


    // Render custom node element
    const renderCustomNodeElement: RenderCustomNodeElementFn = ({ nodeDatum, toggleNode, }) => {
        const nodeAttributes = nodeDatum.attributes || {};
        const personData = (nodeAttributes.id && nodeAttributes.name) ? nodeAttributes as unknown as Person : undefined;

        // --- Checks ---
        const hasAfilhados = !!nodeDatum.children?.length;
        const hasManuallyHiddenAfilhados = !!(nodeDatum as any)?._children?.length;
        // No initial depth, so only check manual toggle
        const showExpandIndicator = hasAfilhados && hasManuallyHiddenAfilhados;
        const isLeafNode = !hasAfilhados && !hasManuallyHiddenAfilhados;
        const isArtificialRoot = ['root', 'artificial_root', 'no_data', 'error'].includes(nodeAttributes?.id as string);
        const canDelete = isUserLoggedIn && isLeafNode && !isArtificialRoot;
        const canAdd = isUserLoggedIn && !isArtificialRoot;
        const canEdit = isUserLoggedIn && !isArtificialRoot;

        // --- Display Setup ---
        const imageUrl = typeof personData?.imageUrl === 'string' && personData.imageUrl ? personData.imageUrl : placeholderImageUrl;
        const nodeName = personData?.name || nodeDatum.name || 'Unknown';
        const displayName = personData?.nickname ? `${personData.name} "${personData.nickname}"` : personData?.name || nodeName;

        const formatDate = (dateStr: string | undefined, format: 'year' | 'month' | 'day') => {
            if (!dateStr || typeof dateStr !== 'string') return '';
            try {
                const date = new Date(dateStr + 'T00:00:00'); // Append time for consistency
                if (isNaN(date.getTime())) return `Invalid Date: ${dateStr}`; // Show error if invalid
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                if (format === 'year') return year.toString();
                if (format === 'month') return `${month}/${year}`;
                if (format === 'day') return `${day}/${month}/${year}`;
            } catch (e) { return `Format Error: ${dateStr}`; }
            return dateStr; // Fallback
        };

        const birthDate = formatDate(personData?.birthDate, 'day');
        const deathDate = formatDate(personData?.deathDate, 'day');
        const subidaDate = formatDate(personData?.subidaPalcoDate, 'month'); // Display YYYY-MM as MM/YYYY
        const passagemDate = formatDate(personData?.passagemTunoDate, 'month'); // Display YYYY-MM as MM/YYYY
        const saidaDate = formatDate(personData?.dataSaidaDaTuna, 'month'); // Display YYYY-MM as MM/YYYY
        const otherInstrumentsText = personData?.otherInstruments?.join(', ');

        // --- Positioning ---
        const cardWidth = 200; const cardHeight = 180;
        const cardX = -cardWidth / 2; const cardY = -cardHeight / 2;
        const indicatorRadius = 6; const indicatorY = cardY + cardHeight + 15;
        const buttonSize = 18; const buttonOffsetY = cardY + cardHeight + 8;
        const buttonSpacing = 10;
        const editButtonX = -buttonSize / 2 - buttonSpacing;
        const deleteButtonX = 0;
        const addButtonX = buttonSize / 2 + buttonSpacing;


        return (
            <g onClick={toggleNode} style={{ cursor: 'pointer' }}>
                {/* Card */}
                <foreignObject width={cardWidth} height={cardHeight} x={cardX} y={cardY}>
                    <div style={styles.nodeCard}>
                        <img src={imageUrl} alt={nodeName} style={isArtificialRoot ? styles.rootImage : styles.personImage} onError={(e) => { const t=e.target as HTMLImageElement; if(t.src!==placeholderImageUrl) t.src=placeholderImageUrl; }}/>
                        <div style={styles.nodeName} title={displayName}>{displayName}</div>
                        {!isArtificialRoot && personData && (
                            <>
                                {personData.hierarquia && <div style={{...styles.nodeDetails, fontWeight: 'bold'}}>{personData.hierarquia}</div>}
                                {personData.naipeVocal && <div style={styles.nodeDetails}>Naipe: {personData.naipeVocal}</div>}
                                {personData.mainInstrument && <div style={styles.nodeDetails}>{personData.mainInstrument}</div>}
                                {otherInstrumentsText && <div style={{...styles.nodeDetails, color: '#777', fontSize: '10px'}}>{otherInstrumentsText}</div>}
                                {subidaDate && <div style={styles.nodeDate}>Subida: {subidaDate}</div>}
                                {passagemDate && <div style={styles.nodeDate}>Passagem: {passagemDate}</div>}
                                {saidaDate && <div style={styles.nodeDate}>Saída: {saidaDate}</div>}
                                {personData.curso && <div style={styles.nodeDate}>Curso: {personData.curso}</div>}
                                {(birthDate || deathDate) && (<div style={styles.nodeDate}>{birthDate ? `Nasc: ${birthDate}` : ''}{birthDate && deathDate ? ' - ' : ''}{deathDate ? `Falc: ${deathDate}` : ''}</div>)}
                                {personData.notes && <div style={styles.nodeNotes}>Notes: {personData.notes}</div>}
                            </>
                        )}
                         {isArtificialRoot && personData?.notes && <div style={styles.nodeNotes}>{personData.notes}</div>}
                    </div>
                </foreignObject>

                {/* Indicator */}
                {showExpandIndicator && ( <circle cx="0" cy={indicatorY} r={indicatorRadius} style={styles.indicatorCircle} onClick={(e) => { e.stopPropagation(); toggleNode(); }} /> )}

                {/* Buttons */}
                {canEdit && personData && ( <g transform={`translate(${editButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onEditPersonClick(personData); }} className="node-action-button"> <Edit size={buttonSize} color="#ffc107"/> </g> )}
                {canDelete && ( <g transform={`translate(${deleteButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onDeletePersonClick(personData?.id || '', nodeName); }} className="node-action-button"> <MinusCircle size={buttonSize} color="#dc3545"/> </g> )}
                {canAdd && ( <g transform={`translate(${addButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onAddPersonClick(personData?.id || ''); }} className="node-action-button"> <PlusCircle size={buttonSize} color="#28a745"/> </g> )}
            </g>
        );
    };

    // Adjust nodeSize
    const nodeHeight = 180;
    const bottomSpacing = 35;
    const totalNodeHeight = nodeHeight + bottomSpacing;

    // Loading/Empty check
    if (!treeDataProp || treeDataProp.length === 0) {
        // Show loading or specific message if needed, e.g., based on dbDataStatus from App
        return <div className="loading">Loading tree data or tree is empty...</div>;
    }
    if (!treeData || ['No Data', 'Error'].includes(treeData.name)) {
         return <div>{treeData.attributes.name || 'Could not generate tree structure.'}</div>;
     }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Zoom Controls */}
             <div className="zoom-controls"> <button className="zoom-button" onClick={handleZoomIn}>+</button> <button className="zoom-button" onClick={handleZoomOut}>-</button> </div>
            <Tree
                data={treeData as unknown as RawNodeDatum}
                orientation="vertical"
                translate={translate} zoom={zoom} onUpdate={handleUpdate}
                zoomable={true} scaleExtent={{ min: minZoom, max: maxZoom }}
                renderCustomNodeElement={renderCustomNodeElement}
                nodeSize={{ x: 240, y: totalNodeHeight }} // Wider nodes
                separation={{ siblings: 1.1, nonSiblings: 1.4 }}
                pathFunc="step"
                // REMOVED initialDepth prop
                transitionDuration={300}
            />
        </div>
    );
};

// --- Styles ---
const styles: { [key: string]: React.CSSProperties } = {
    nodeCard: { border: '1px solid #ccc', borderRadius: '8px', padding: '10px', backgroundColor: 'white', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden', },
    nodeName: { fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95%', },
    nodeDetails: { fontSize: '12px', color: '#555', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95%', },
    nodeDate: { fontSize: '11px', color: '#777', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95%', },
    nodeNotes: { fontSize: '10px', fontStyle: 'italic', color: '#888', marginTop: 'auto', paddingTop: '4px', whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: '2.4em', lineHeight: '1.2em', width: '95%'},
    personImage: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginBottom: '6px', border: '1px solid #eee', flexShrink: 0 },
    rootImage: { width: 'auto', height: '60px', maxWidth: '90%', objectFit: 'contain', marginBottom: '6px', flexShrink: 0 },
    indicatorCircle: { fill: "#6c757d", stroke: "#343a40", strokeWidth: "1", cursor: 'pointer' },
    actionButton: { cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s ease', pointerEvents: 'all' },
};

export default GenealogyTree;