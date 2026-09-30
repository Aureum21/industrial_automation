'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { LatchNode } from '@/components/nodes/LatchNode';
import { EdgeNode } from '@/components/nodes/EdgeNode';
import { TimerNode } from '@/components/nodes/TimerNode';

const nodeTypes = {
  inputNode: InputNode,
  outputNode: OutputNode,
  gateNode: GateNode,
  latchNode: LatchNode,
  edgeNode: EdgeNode,
  timerNode: TimerNode
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
        
        let needsUpdate = false;
        let newValue = false;

        if (n.type === 'inputNode') {
           newValue = block.value ?? false;
           if (n.data.value !== newValue) needsUpdate = true;
        }
        
        // Sync outputs so LEDs light up
        if (n.type === 'outputNode') {
           newValue = block.outputs['Q'] ?? false;
           if (n.data.value !== newValue) needsUpdate = true;
        }

        if (needsUpdate) {
           return { ...n, data: { ...n.data, value: newValue } };
        }
        return n;
      })
    );
  }, [setNodes]);

  useEffect(() => {
    // 10 ticks per second for smooth timer and edge trigger behavior
    const interval = setInterval(() => {
      engineRef.current.tick();
      syncVisualsFromEngine();
    }, 100);
    return () => clearInterval(interval);
  }, [syncVisualsFromEngine]);

  const handleToggle = useCallback((nodeId: string, newValue: boolean) => {
    engineRef.current.setInput(nodeId, newValue);
  }, []);

  const handleTagChange = useCallback((nodeId: string, newTag: string) => {
    engineRef.current.setTag(nodeId, newTag);
    setNodes((nds) => 
      nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, tag: newTag } } : n)
    );
  }, [setNodes]);

  const handleParamChange = useCallback((nodeId: string, paramKey: string, paramVal: any) => {
    engineRef.current.setParam(nodeId, paramKey, paramVal);
    setNodes((nds) => 
      nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, [paramKey]: paramVal } } : n)
    );
  }, [setNodes]);

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
      }
    },
    [setEdges]
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
      else if (type === 'gateNode' || type === 'latchNode' || type === 'edgeNode' || type === 'timerNode') {
          engineType = gateType as BlockType;
      }

      engineRef.current.addBlock({
         id: newNodeId,
         type: engineType,
         inputs: {},
         outputs: { Q: false },
         value: false,
         params: type === 'timerNode' ? { duration: 2000 } : {}
      });

      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: { 
           gateType,
           onToggle: handleToggle,
           onTagChange: handleTagChange,
           onParamChange: handleParamChange,
           value: false,
           tag: '',
           duration: 2000
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, handleToggle, handleTagChange, handleParamChange]
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
