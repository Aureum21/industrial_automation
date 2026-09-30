import React from 'react';

export default function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, gateType?: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    if (gateType) {
      event.dataTransfer.setData('application/reactflow/gateType', gateType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-700 p-4 flex flex-col gap-4 text-white z-10 shadow-2xl">
      <h2 className="text-xl font-bold border-b border-gray-700 pb-2 mb-2">Blocks Library</h2>
      
      <div className="flex flex-col gap-3">
        <h3 className="text-sm text-gray-400 uppercase font-bold">I/O</h3>
        <div 
          className="bg-gray-800 p-3 rounded border border-gray-600 cursor-grab hover:bg-gray-700 transition flex items-center justify-center"
          onDragStart={(e) => onDragStart(e, 'inputNode')} draggable
        >
          Toggle Switch
        </div>
        <div 
          className="bg-gray-800 p-3 rounded border border-gray-600 cursor-grab hover:bg-gray-700 transition flex items-center justify-center"
          onDragStart={(e) => onDragStart(e, 'outputNode')} draggable
        >
          Lightbulb
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <h3 className="text-sm text-gray-400 uppercase font-bold">Logic Gates</h3>
        <div 
          className="bg-blue-900 p-3 rounded border border-blue-600 cursor-grab hover:bg-blue-800 transition text-center font-bold tracking-wider"
          onDragStart={(e) => onDragStart(e, 'gateNode', 'AND')} draggable
        >
          AND
        </div>
        <div 
          className="bg-blue-900 p-3 rounded border border-blue-600 cursor-grab hover:bg-blue-800 transition text-center font-bold tracking-wider"
          onDragStart={(e) => onDragStart(e, 'gateNode', 'OR')} draggable
        >
          OR
        </div>
        <div 
          className="bg-blue-900 p-3 rounded border border-blue-600 cursor-grab hover:bg-blue-800 transition text-center font-bold tracking-wider"
          onDragStart={(e) => onDragStart(e, 'gateNode', 'NOT')} draggable
        >
          NOT
        </div>
      </div>
      
      <div className="mt-auto text-xs text-gray-500 text-center">
        Drag blocks onto the canvas to build logic.
      </div>
    </aside>
  );
}
