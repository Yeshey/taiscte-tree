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

  // Handle zoom events
  const handleZoom = (zoom: number) => {
    setZoom(zoom);
  };

  // Render custom node component
  const renderCustomNodeElement = ({ nodeDatum, toggleNode }: any) => {
    return <GenealogyNode person={nodeDatum.attributes} toggleNode={toggleNode} />;
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
        // Removed the onZoom prop as it's not supported
        renderCustomNodeElement={renderCustomNodeElement}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        nodeSize={{ x: 180, y: 120 }}
        pathFunc="step"
      />
    </div>
  );
};

export default GenealogyTree;