import React, { useState } from 'react';
import Tree from 'react-d3-tree';
import { Person } from '../types/models';
import GenealogyNode from './GenealogyNode';
import { transformDataForTree } from '../utils/treeHelpers';

interface GenealogyTreeProps {
    data: Person[];
  }
  
  const GenealogyTree: React.FC<GenealogyTreeProps> = ({ data }) => {
    const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
  
    // Set initial position on component mount
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
  
    // Debugging - log the tree data
    React.useEffect(() => {
      console.log('Tree data:', treeData);
    }, [treeData]);
  
    // Render custom node element
    const renderCustomNodeElement = (rd: any) => {
      console.log('Node data:', rd);
      return (
        <g>
          <foreignObject 
            width={150} 
            height={100} 
            x={-75} // Center the foreignObject
            y={-50}
          >
            <div style={{ 
              border: '1px solid #ccc', 
              borderRadius: '5px', 
              padding: '10px', 
              backgroundColor: 'white',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderLeft: rd.nodeDatum.attributes?.gender === 'male' ? '4px solid #4286f4' : 
                         rd.nodeDatum.attributes?.gender === 'female' ? '4px solid #f44271' : '4px solid #888',
            }}>
              <div style={{ fontWeight: 'bold' }}>{rd.nodeDatum.name}</div>
              {rd.nodeDatum.attributes?.birthDate && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  b. {new Date(rd.nodeDatum.attributes.birthDate).getFullYear()}
                  {rd.nodeDatum.attributes?.deathDate && 
                    ` - d. ${new Date(rd.nodeDatum.attributes.deathDate).getFullYear()}`}
                </div>
              )}
              {rd.nodeDatum.attributes?.notes && (
                <div style={{ fontSize: '10px', marginTop: '3px' }}>
                  {rd.nodeDatum.attributes.notes}
                </div>
              )}
            </div>
          </foreignObject>
        </g>
      );
    };
  
    if (data.length === 0) {
      return <div>No family tree data available.</div>;
    }
  
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
          <button onClick={() => setZoom(zoom * 1.2)}>+</button>
          <button onClick={() => setZoom(zoom / 1.2)}>-</button>
        </div>
        <Tree
          data={treeData}
          orientation="vertical"
          translate={translate}
          zoom={zoom}
          renderCustomNodeElement={renderCustomNodeElement}
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          nodeSize={{ x: 180, y: 120 }}
          pathFunc="step"
        />
      </div>
    );
  };
  
  export default GenealogyTree;