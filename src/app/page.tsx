'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { LogicEngine, BlockType } from '@/lib/LogicEngine';
import Sidebar from '@/components/Sidebar';
import { InputNode } from '@/components/nodes/InputNode';
import { OutputNode } from '@/components/nodes/OutputNode';
import { GateNode } from '@/components/nodes/GateNode';

const nodeTypes = {
  inputNode: InputNode,
  outputNode: OutputNode,
  gateNode: GateNode,
};

let id = 0;
const getId = () => `block_${id++}`;

function Workspace() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const engineRef = useRef(new LogicEngine());
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const syncVisualsFromEngine = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const block = engineRef.current.blocks.get(n.id);
        if (!block) return n;
        
        if (n.type === 'inputNode') {
           return { ...n, data: { ...n.data, value: block.value } };
        }
        if (n.type === 'outputNode') {
           return { ...n, data: { ...n.data, value: block.outputs['Q'] } };
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleToggle = useCallback((nodeId: string, newValue: boolean) => {
    engineRef.current.setInput(nodeId, newValue);
    // tick multiple times to propagate through deep circuits
    for(let i=0; i<5; i++) engineRef.current.tick(); 
    syncVisualsFromEngine();
  }, [syncVisualsFromEngine]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#60a5fa', strokeWidth: 3 } }, eds));
      
      if (params.source && params.target && params.sourceHandle && params.targetHandle) {
         engineRef.current.addConnection({
            fromBlockId: params.source,
            fromPin: params.sourceHandle,
            toBlockId: params.target,
            toPin: params.targetHandle
         });
         for(let i=0; i<5; i++) engineRef.current.tick();
         syncVisualsFromEngine();
      }
    },
    [setEdges, syncVisualsFromEngine]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow/type');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNodeId = getId();
      const gateType = event.dataTransfer.getData('application/reactflow/gateType');

      let engineType: BlockType = 'INPUT';
      if (type === 'outputNode') engineType = 'OUTPUT';
      else if (type === 'gateNode') engineType = gateType as BlockType;

      engineRef.current.addBlock({
         id: newNodeId,
         type: engineType,
         inputs: {},
         outputs: { Q: false },
         value: false
      });

      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: { 
           gateType,
           onToggle: handleToggle,
           value: false
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, handleToggle]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 font-sans">
      <Sidebar />
      <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-950"
          colorMode="dark"
        >
          <Controls className="bg-gray-800 border-gray-700 fill-white" />
          <Background color="#374151" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <Workspace />
    </ReactFlowProvider>
  );
}
