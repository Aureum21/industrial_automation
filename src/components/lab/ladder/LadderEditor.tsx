import React from 'react';
import type { CircuitFlowNode } from '../CircuitNode';

interface LadderEditorProps {
  nodes: CircuitFlowNode[];
  onDropNode: (type: string, rung: number, col: number) => void;
  onMoveNode: (id: string, rung: number, col: number) => void;
  onDeleteNode: (id: string) => void;
}

const COLUMNS = 8;
const MAX_RUNGS = 20;

function LadderNode({ node, onDelete }: { node: CircuitFlowNode, onDelete: () => void }) {
  const type = node.data.blockType;
  const label = node.data.tag || node.data.label;
  const isPowered = node.data.inputValue === true || node.data.outputs?.Q === true; // Highlight if active
  const wireColor = isPowered ? 'bg-green-500' : 'bg-gray-800';
  const borderColor = isPowered ? 'border-green-500' : 'border-gray-800';
  const textColor = isPowered ? 'text-green-600' : 'text-gray-700';

  const DeleteBtn = () => (
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm cursor-pointer"
    >
      ✕
    </button>
  );

  if (type === 'INPUT') {
    return (
      <div className="flex items-center justify-center w-full h-full relative group cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => { e.dataTransfer.setData('application/fieldnotes-block-id', node.id); e.dataTransfer.effectAllowed = 'move'; }}>
        <div className={`absolute left-0 right-0 top-1/2 h-0.5 ${wireColor} -translate-y-1/2 z-0`} />
        <div className="relative z-10 w-6 h-8 bg-white flex justify-between px-[1px]">
          <div className={`w-0.5 h-full ${wireColor}`} />
          <div className={`w-0.5 h-full ${wireColor}`} />
        </div>
        <span className={`absolute -top-4 text-[10px] font-bold ${textColor}`}>{label}</span>
        <DeleteBtn />
      </div>
    );
  }

  if (type === 'NC_INPUT') {
    return (
      <div className="flex items-center justify-center w-full h-full relative group cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => { e.dataTransfer.setData('application/fieldnotes-block-id', node.id); e.dataTransfer.effectAllowed = 'move'; }}>
        <div className={`absolute left-0 right-0 top-1/2 h-0.5 ${wireColor} -translate-y-1/2 z-0`} />
        <div className="relative z-10 w-6 h-8 bg-white flex justify-between px-[1px]">
          <div className={`w-0.5 h-full ${wireColor}`} />
          <div className={`absolute left-1/2 top-1/2 w-8 h-0.5 ${wireColor} -translate-x-1/2 -translate-y-1/2 -rotate-45`} />
          <div className={`w-0.5 h-full ${wireColor}`} />
        </div>
        <span className={`absolute -top-4 text-[10px] font-bold ${textColor}`}>{label}</span>
        <DeleteBtn />
      </div>
    );
  }

  if (type === 'OUTPUT') {
    return (
      <div className="flex items-center justify-center w-full h-full relative group cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => { e.dataTransfer.setData('application/fieldnotes-block-id', node.id); e.dataTransfer.effectAllowed = 'move'; }}>
        <div className={`absolute left-0 right-0 top-1/2 h-0.5 ${wireColor} -translate-y-1/2 z-0`} />
        <div className={`relative z-10 w-8 h-8 rounded-full border-2 ${borderColor} bg-white flex items-center justify-center`} />
        <span className={`absolute -top-4 text-[10px] font-bold ${textColor}`}>{label}</span>
        <DeleteBtn />
      </div>
    );
  }

  // Complex block fallback
  return (
    <div className="flex items-center justify-center w-full h-full relative px-2 group cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => { e.dataTransfer.setData('application/fieldnotes-block-id', node.id); e.dataTransfer.effectAllowed = 'move'; }}>
      <div className={`absolute left-0 right-0 top-1/2 h-0.5 ${wireColor} -translate-y-1/2 z-0`} />
      <div className={`relative z-10 bg-white border-2 ${borderColor} rounded p-1 w-full text-center shadow-sm`}>
        <div className={`text-[10px] font-bold truncate ${textColor}`}>{label}</div>
      </div>
      <DeleteBtn />
    </div>
  );
}

export default function LadderEditor({ nodes, onDropNode, onMoveNode, onDeleteNode }: LadderEditorProps) {
  // Convert nodes into a lookup grid for easy rendering
  const grid = new Map<string, CircuitFlowNode>();
  for (const node of nodes) {
    // Snap positions back to grid indices
    const col = Math.round(node.position.x / 150);
    const rung = Math.round(node.position.y / 100);
    grid.set(`${rung}-${col}`, node);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/fieldnotes-block-id')) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent, rung: number, col: number) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/fieldnotes-block');
    const id = e.dataTransfer.getData('application/fieldnotes-block-id');
    if (type) {
      onDropNode(type, rung, col);
    } else if (id) {
      onMoveNode(id, rung, col);
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-slate-50 overflow-auto p-8 font-mono select-none">
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 shadow-sm min-h-full relative flex">
        
        {/* Left Power Rail (True) */}
        <div className="w-1 bg-red-500 absolute left-12 top-4 bottom-4 z-10" />

        <div className="flex-1 py-8 pl-12 pr-8 flex flex-col gap-0">
          {Array.from({ length: MAX_RUNGS }).map((_, rungIndex) => (
            <div key={rungIndex} className="flex relative h-24 border-b border-gray-100 group">
              
              {/* Rung Number */}
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-xs text-gray-300 font-bold">
                {rungIndex + 1}
              </div>

              {/* Rung Wire (Background) */}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2" />

              {/* Grid Cells */}
              <div className="flex-1 flex items-center justify-between relative z-20">
                {Array.from({ length: COLUMNS }).map((_, colIndex) => {
                  const isCoilZone = colIndex === COLUMNS - 1;
                  const cellKey = `${rungIndex}-${colIndex}`;
                  const node = grid.get(cellKey);

                  return (
                    <div 
                      key={colIndex}
                      className={`h-16 flex items-center justify-center transition-colors
                        ${isCoilZone ? 'w-24 ml-auto' : 'w-24'}
                        ${node ? '' : 'border-2 border-dashed border-transparent group-hover:border-gray-200 hover:bg-gray-50'}`
                      }
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, rungIndex, colIndex)}
                    >
                      {node ? (
                        <LadderNode node={node} onDelete={() => onDeleteNode(node.id)} />
                      ) : (
                        <div className="opacity-0 hover:opacity-100 text-gray-300 text-xl font-light">
                          +
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Power Rail (Neutral) */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 z-10 opacity-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
