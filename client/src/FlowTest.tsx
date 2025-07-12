import React, { useState, useCallback } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  Controls,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function FlowTest() {
  // Step 1: Initialize state for nodes and their positions
  const [nodes, setNodes] = useState([
    {
      id: 'initial',
      position: { x: 100, y: 100 },
      data: { label: 'Initial' },
      type: 'default', // ✅ Has both source and target
    },
    {
      id: 'inquiry',
      position: { x: 300, y: 200 },
      data: { label: 'Inquiry' },
      type: 'default', // ✅ Has both source and target
    },
  ]);

  // Step 2: Update node positions manually during drag
  const onNodeDrag = useCallback((event, node) => {
    console.log('Node being dragged:', node);
    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === node.id
          ? { ...n, position: { x: node.position.x, y: node.position.y } }
          : n
      )
    );
  }, []);

  // Step 3: Handle the end of the drag
  const onNodeDragStop = useCallback((event, node) => {
    console.log('Node drag stopped:', node);
    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === node.id
          ? { ...n, position: { x: node.position.x, y: node.position.y } }
          : n
      )
    );
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes} // Step 4: Use state nodes
          edges={[
            {
              id: 'e1-2',
              source: 'initial',
              target: 'inquiry',
              label: 'Go to Inquiry',
              type: 'straight',
            },
          ]}
          fitView
          nodesDraggable={true} // Enable node dragging globally
          nodesConnectable={false} // Keep nodes non-connectable
          elementsSelectable={true}
          onNodeDrag={onNodeDrag} // Track drag events
          onNodeDragStop={onNodeDragStop} // Track when drag stops
        >
          <Controls />
          <Background />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
