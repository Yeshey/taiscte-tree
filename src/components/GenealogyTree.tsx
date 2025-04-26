import React, { useState, useCallback } from 'react';
import Tree, { Point, RawNodeDatum, TreeNodeDatum, RenderCustomNodeElementFn } from 'react-d3-tree'; // Corrected import
import { Person } from '../types/models';
import { transformDataForTree } from '../utils/treeHelpers';

interface GenealogyTreeProps {
    data: Person[];
}

// Placeholder image (simple SVG person icon encoded as data URI)
const placeholderImageUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjY2NjY2NjIiBkPSJNMTIgMTJhMi41IDIuNSAwIDAgMSAyLjUgMi41IDIuNSAyLjUgMCAwIDEgLTIuNSAyLjUgMi41IDIuNSAwIDAgMSAtMi41IC0yLjUgMi41IDIuNSAwIDAgMSAyLjUgLTIuNXptMCAtOWMzLjMxMyAwIDYgMi42ODcgNiA2IDAgMy4zMTQtMi42ODcgNiAtNiA2cy02LTIuNjg2LTYtNiAwLTMuMzEzIDIuNjg3LTYgNi02em0wIDEwYzIuNjcgMCA4IDEuMzMgOCA0djJoLTE2di0yYzAtMi42NyA1LjMzLTQgOC00eiIvPjwvc3ZnPg==";


const GenealogyTree: React.FC<GenealogyTreeProps> = ({ data }) => {
  const minZoom = 0.06;
  const maxZoom = 10;

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
  }, [data]);

  const treeData = React.useMemo(() => {
    return transformDataForTree(data);
  }, [data]);

  const handleUpdate = useCallback((newTranslate: Point, newZoom: number) => {
    setTranslate(newTranslate);
    setZoom(newZoom);
  }, []);

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.2, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom / 1.2, minZoom));
  };

  // Render custom node element with image
  const renderCustomNodeElement: RenderCustomNodeElementFn = ({ // Use the imported type
    nodeDatum,
    toggleNode,
  }) => {
    const nodeAttributes = nodeDatum.attributes || {};

    // --- FIX 1: Type check for imageUrl ---
    const imageUrl = typeof nodeAttributes.imageUrl === 'string' && nodeAttributes.imageUrl
                      ? nodeAttributes.imageUrl
                      : placeholderImageUrl;

    // --- FIX 2: Type checks for dates ---
    const birthYear = typeof nodeAttributes.birthDate === 'string' && nodeAttributes.birthDate
                      ? new Date(nodeAttributes.birthDate).getFullYear()
                      : null; // Handle invalid/missing date

    const deathYear = typeof nodeAttributes.deathDate === 'string' && nodeAttributes.deathDate
                      ? new Date(nodeAttributes.deathDate).getFullYear()
                      : null; // Handle invalid/missing date

    // --- Ensure years are valid numbers before displaying ---
    const displayBirthYear = birthYear && !isNaN(birthYear) ? birthYear : null;
    const displayDeathYear = deathYear && !isNaN(deathYear) ? deathYear : null;

    const nodeName = nodeDatum.name || 'Unknown'; // Handle potentially undefined name

    return (
      <g onClick={toggleNode} style={{ cursor: 'pointer' }}> {/* Added onClick and cursor */}
        <foreignObject
          width={160}
          height={120}
          x={-80}
          y={-60}
        >
          <div style={{
            border: '1px solid #ccc',
            borderRadius: '5px',
            padding: '5px',
            backgroundColor: 'white',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderLeft: nodeAttributes.gender === 'male' ? '4px solid #4286f4' :
                       nodeAttributes.gender === 'female' ? '4px solid #f44271' : '4px solid #888',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            {/* Image Section */}
            <img
              src={imageUrl} // Now guaranteed to be string
              alt={nodeName} // Use safe name
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: '5px',
                border: '1px solid #eee'
              }}
              onError={(e) => { // Optional: Handle image loading errors
                  const target = e.target as HTMLImageElement;
                  if (target.src !== placeholderImageUrl) {
                      target.src = placeholderImageUrl; // Fallback to placeholder on error
                  }
              }}
            />
            {/* Text Section */}
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '3px' }}>
              {nodeName}
            </div>
            {/* Display validated dates */}
            {(displayBirthYear || displayDeathYear) && (
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>
                {displayBirthYear ? `b. ${displayBirthYear}` : ''}
                {displayBirthYear && displayDeathYear ? ' - ' : ''}
                {displayDeathYear ? `d. ${displayDeathYear}` : ''}
              </div>
            )}
            {/* Check notes existence and type */}
            {typeof nodeAttributes.notes === 'string' && nodeAttributes.notes && (
              <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#888' }}>
                {nodeAttributes.notes}
              </div>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  if (data.length === 0 || !treeData || treeData.name === 'No Data') {
    return <div>No family tree data available or data is empty.</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="zoom-controls">
        <button className="zoom-button" onClick={handleZoomIn}>+</button>
        <button className="zoom-button" onClick={handleZoomOut}>-</button>
      </div>
      <Tree
        data={treeData as RawNodeDatum}
        orientation="vertical"
        translate={translate}
        zoom={zoom}
        onUpdate={({ translate: newTranslate, zoom: newZoom }) => handleUpdate(newTranslate, newZoom)} // Destructure update object
        zoomable={true}
        scaleExtent={{ min: minZoom, max: maxZoom }}
        renderCustomNodeElement={renderCustomNodeElement}
        separation={{ siblings: 1.3, nonSiblings: 1.8 }}
        nodeSize={{ x: 200, y: 150 }}
        pathFunc="step"
        depthFactor={200}
        // initialDepth={1} // otherwise the initial tree will only show the root
        transitionDuration={300}
      />
    </div>
  );
};

export default GenealogyTree;