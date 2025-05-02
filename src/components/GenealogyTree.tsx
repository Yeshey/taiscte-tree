// src/components/GenealogyTree.tsx
import React, { useState, useMemo, useCallback } from 'react'; // Added useState, useMemo, useCallback
import Tree, { Point, RawNodeDatum, TreeNodeDatum, RenderCustomNodeElementFn } from 'react-d3-tree';
import { Person } from '../types/models';
import { PlusCircle, MinusCircle, Edit } from 'react-feather';
import TaiscteLogo from '../assets/TAISCTE_logo.png';

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

// --- HSL Color Generation Logic (moved from utils for this specific implementation) ---
function generateHslColor(hue: number): string {
  const saturation = 75; // Fixed saturation
  const lightness = 60; // Fixed lightness
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
interface GenealogyTreeProps {
    data: Person[];
    allPeople: Person[];
    onAddPersonClick: (padrinhoId: string) => void; // Changed parentId to padrinhoId
    onDeletePersonClick: (personId: string, personName: string) => void;
    onEditPersonClick: (person: Person) => void;
    isUserLoggedIn: boolean;
    onNodeClick: (person: Person) => void;
}

const GenealogyTree: React.FC<GenealogyTreeProps> = ({
    data: treeDataProp,
    allPeople,
    onAddPersonClick,
    onDeletePersonClick,
    onEditPersonClick,
    isUserLoggedIn,
    onNodeClick
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

    // --- UPDATED: Memoize family colors with guaranteed distinction ---
    const familyColorMap = useMemo(() => {
        const map = new Map<string, string>();
        // Get unique family names, filtering out any potential undefined/empty strings
        const uniqueFamilies = Array.from(
            new Set(treeDataProp.map(p => p.familyName).filter((name): name is string => !!name))
        ).sort(); // Sorting ensures somewhat consistent color assignment if families appear/disappear

        const numFamilies = uniqueFamilies.length;
        if (numFamilies === 0) {
            return map; // Return empty map if no families
        }

        // Calculate the step angle for hue distribution
        const hueStep = 360 / numFamilies;

        console.log(`Assigning colors to ${numFamilies} unique families with hue step ${hueStep.toFixed(2)}`);

        uniqueFamilies.forEach((familyName, index) => {
            // Calculate hue based on index to ensure even distribution
            const hue = Math.round(index * hueStep);
            const color = generateHslColor(hue); // Use the simplified generator
            map.set(familyName, color);
            // console.log(`  Family: ${familyName}, Index: ${index}, Hue: ${hue}, Color: ${color}`); // Detailed debug log
        });

        console.log("Generated Unique Family Colors:", map);
        return map;
    }, [treeDataProp]); // Recalculate when tree data changes



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
            return { name: 'TAISCTE', attributes: { id: 'artificial_root', name: 'TAISCTE', gender: 'other',  imageUrl: TaiscteLogo }, children: allNodes };
        } else if (rootPeople.length === 1) {
            return buildTunaTree(rootPeople[0].id, peopleMap, processedIds) || { name: 'Error', attributes: { id: 'error', name: 'Error generating tree', gender: 'other' } };
        } else {
             return { name: 'TAISCTE', attributes: { id: 'root', name: 'TAISCTE', gender: 'other',  imageUrl: TaiscteLogo }, children: rootPeople.map(root => buildTunaTree(root.id, peopleMap, processedIds)).filter(node => node !== null) as TreeNode[] };
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

    const cardWidth = 200;
    const cardHeight = 185;
    const bottomButtonSpacing = 35; // How much space buttons need
    const noButtonSpacing = 20;      // Minimal space below card if no buttons
    const bottomSpacing = isUserLoggedIn ? bottomButtonSpacing : noButtonSpacing;
    const totalNodeHeight = cardHeight + bottomSpacing;


    // Render custom node element
    const renderCustomNodeElement: RenderCustomNodeElementFn = ({ nodeDatum }) => {
        // ... (attribute extraction, personData setup - remains the same)
        const nodeAttributes = nodeDatum.attributes as TreeNode['attributes'] | undefined;
        const personData = (nodeAttributes?.id && nodeAttributes?.name) ? nodeAttributes as unknown as Person : undefined;

        // ... (isLeafNode, isArtificialRoot, canAdd/Edit/Delete checks - remain the same)
        const hasAfilhados = !!nodeDatum.children?.length;
        const hasManuallyHiddenAfilhados = !!(nodeDatum as any)?._children?.length;
        const isLeafNode = !hasAfilhados && !hasManuallyHiddenAfilhados;
        const isArtificialRoot = ['root', 'artificial_root', 'no_data', 'error'].includes(nodeAttributes?.id as string);
        const canDelete = isUserLoggedIn && isLeafNode && !isArtificialRoot;
        const canAdd = isUserLoggedIn && !isArtificialRoot;
        const canEdit = isUserLoggedIn && !isArtificialRoot;


        // ... (imageUrl, nodeName, displayName setup - remains the same)
        const imageUrl = typeof personData?.imageUrl === 'string' && personData.imageUrl ? personData.imageUrl : placeholderImageUrl;
        const nodeName = personData?.name || nodeDatum.name || 'Unknown';
        const displayName = personData?.nickname ? `${personData.name} "${personData.nickname}"` : personData?.name || nodeName;

        // --- Get family color (using the map) ---
        const familyName = personData?.familyName;
        // Use the map generated by useMemo
        const familyColor = familyName ? familyColorMap.get(familyName) : undefined;

        // --- Combine base style with dynamic border ---
        const nodeCardStyle = {
            ...styles.nodeCard,
            ...(familyColor && !isArtificialRoot && {
                borderLeft: `6px solid ${familyColor}`,
            }),
        };

        // ... (date formatting, button positioning, click handlers - remain the same)
         const formatDate = (dateStr: string | undefined, format: 'year' | 'month' | 'day') => { /* ... date formatting ... */
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
        const subidaDate = formatDate(personData?.subidaPalcoDate, 'month');
        const passagemDate = formatDate(personData?.passagemTunoDate, 'month');
        const saidaDate = formatDate(personData?.dataSaidaDaTuna, 'month');
        const otherInstrumentsText = personData?.otherInstruments?.join(', ');


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

        const handleNodeCardClick = (event: React.MouseEvent) => {
            event.stopPropagation();
            if (personData && !isArtificialRoot) {
                onNodeClick(personData);
            }
        };


        return (
             // ... (wrapping <g> with onClick)
            <g onClick={handleNodeCardClick} style={{ cursor: isArtificialRoot ? 'default' : 'pointer' }}>
                {/* ... (foreignObject) */}
                <foreignObject width={cardWidth} height={cardHeight} x={cardX} y={cardY}>
                    {/* Apply nodeCardStyle here */}
                    <div style={nodeCardStyle}>
                        {/* ... (img, nodeName, familyName display, other details) ... */}
                        <img src={imageUrl} alt={nodeName} style={isArtificialRoot ? styles.rootImage : styles.personImage} onError={(e) => { const t=e.target as HTMLImageElement; if(t.src!==placeholderImageUrl) t.src=placeholderImageUrl; }}/>
                        {!isArtificialRoot && (
                             <div style={styles.nodeName} title={displayName}>{displayName}</div>
                        )}
                        {!isArtificialRoot && personData && (
                             <div style={{...styles.nodeDetails, fontSize: '10px', fontStyle: 'italic'}}>Família {personData.familyName || '?'}</div>
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
                 {/* ... (action buttons <g> elements) ... */}
                 {canEdit && personData && editButtonX !== null && ( <g transform={`translate(${editButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onEditPersonClick(personData); }} className="node-action-button" style={styles.actionButton}> <Edit size={buttonSize} color="#ffc107"/> </g> )}
                 {canDelete && deleteButtonX !== null && ( <g transform={`translate(${deleteButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onDeletePersonClick(personData?.id || '', nodeName); }} className="node-action-button" style={styles.actionButton}> <MinusCircle size={buttonSize} color="#dc3545"/> </g> )}
                 {canAdd && addButtonX !== null && ( <g transform={`translate(${addButtonX}, ${buttonOffsetY})`} onClick={(e) => { e.stopPropagation(); onAddPersonClick(personData?.id || ''); }} className="node-action-button" style={styles.actionButton}> <PlusCircle size={buttonSize} color="#28a745"/> </g> )}

            </g>
        );
    };

    // ... (nodeHeight, empty checks, return statement with <Tree> component - remain the same)
    const nodeHeight = 85;

    if (!treeDataProp || treeDataProp.length === 0) { return <div className="loading">Loading tree data or tree is empty...</div>; }
    if (!treeData || ['No Data', 'Error'].includes(treeData.name)) { return <div>{treeData.attributes.name || 'Could not generate tree structure.'}</div>; }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
             <div className="zoom-controls"> <button className="zoom-button" onClick={handleZoomIn}>+</button> <button className="zoom-button" onClick={handleZoomOut}>-</button> </div>
            <Tree
                data={treeData as unknown as RawNodeDatum}
                orientation="vertical"
                translate={translate} zoom={zoom} onUpdate={handleUpdate}
                zoomable={true} scaleExtent={{ min: minZoom, max: maxZoom }}
                renderCustomNodeElement={renderCustomNodeElement}
                nodeSize={{ x: cardWidth + 20, y: totalNodeHeight }}
                separation={{ siblings: 1.0, nonSiblings: 1.2 }}
                pathFunc="step"
                collapsible={false}
                transitionDuration={0}
            />
        </div>
    );
};

// ... (styles object remains the same)
const styles: { [key: string]: React.CSSProperties } = {
    nodeCard: { // Base style, borderLeft will be added dynamically
        border: '1px solid #ccc',
        borderLeft: '6px solid transparent', // Default transparent border (width set dynamically)
        borderRadius: '8px', padding: '8px',
        backgroundColor: 'white', width: '100%', height: '100%',
        boxSizing: 'border-box', // Important for border width calculation
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden',
        paddingLeft: '5px', // Add some padding so text isn't flush against the border
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
    rootImage: { // Style for the TAISCTE logo on root nodes
        width: 'auto',
        height: '40px',
        maxWidth: '90%',
        objectFit: 'contain',
        flexShrink: 0,
        marginBottom: '5px', // Add some space below the logo
    },
    indicatorCircle: { fill: "#6c757d", stroke: "#343a40", strokeWidth: "1", cursor: 'pointer' },
    actionButton: { // Added style for better hover feedback etc.
        cursor: 'pointer',
        opacity: 0.6, // Slightly transparent by default
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: 'all' // Ensure it captures clicks
    },
    // actionButton hover is handled by CSS in App.css (.node-action-button:hover)
};


export default GenealogyTree;