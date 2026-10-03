import React from 'react';
import type { CircuitFlowNode } from '../CircuitNode';

interface LadderEditorProps {
  nodes: CircuitFlowNode[];
  onDropNode: (type: string, rung: number, col: number) => void;
}

const COLUMNS = 8;
const MAX_RUNGS = 20;

export default function LadderEditor({ nodes, onDropNode }: LadderEditorProps) {
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
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, rung: number, col: number) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/fieldnotes-block');
    if (type) {
      onDropNode(type, rung, col);
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
                      className={`h-16 flex items-center justify-center border-2 border-dashed transition-colors
                        ${isCoilZone ? 'w-24 ml-auto' : 'w-24'}
                        ${node ? 'border-transparent' : 'border-transparent group-hover:border-gray-200 hover:bg-gray-50'}`
                      }
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, rungIndex, colIndex)}
                    >
                      {node ? (
                        <div className="bg-white border-2 border-blue-500 rounded p-2 text-xs font-bold text-blue-700 shadow-sm flex flex-col items-center justify-center w-full h-full">
                          <span className="truncate w-full text-center">{node.data.tag || node.data.label}</span>
                        </div>
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
