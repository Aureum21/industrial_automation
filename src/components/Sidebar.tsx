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
    <aside className="w-64 bg-gray-900 border-r border-gray-700 p-4 flex flex-col gap-4 text-white z-10 shadow-2xl overflow-y-auto">
      <h2 className="text-xl font-bold border-b border-gray-700 pb-2 mb-2">Blocks Library</h2>
      
      <div className="flex flex-col gap-2">
        <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-2">I/O & Constants</h3>
        <div className="bg-gray-800 p-2 text-sm rounded border border-gray-600 cursor-grab hover:bg-gray-700 transition flex items-center justify-center" onDragStart={(e) => onDragStart(e, 'inputNode')} draggable>Toggle Switch</div>
        <div className="bg-gray-800 p-2 text-sm rounded border border-gray-600 cursor-grab hover:bg-gray-700 transition flex items-center justify-center" onDragStart={(e) => onDragStart(e, 'outputNode')} draggable>Output Coil</div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-green-900 p-2 text-xs rounded border border-green-600 cursor-grab hover:bg-green-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'constantNode', 'HIGH')} draggable>HIGH (1)</div>
          <div className="bg-red-900 p-2 text-xs rounded border border-red-600 cursor-grab hover:bg-red-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'constantNode', 'LOW')} draggable>LOW (0)</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-2">Basic Gates</h3>
        <div className="grid grid-cols-2 gap-2">
          {['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR'].map(gate => (
            <div key={gate} className="bg-blue-900 p-2 text-xs rounded border border-blue-600 cursor-grab hover:bg-blue-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'gateNode', gate)} draggable>{gate}</div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-2">Memory & Misc</h3>
        <div className="bg-purple-900 p-2 text-xs rounded border border-purple-600 cursor-grab hover:bg-purple-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'latchNode', 'RS_LATCH')} draggable>RS Latch (Set/Reset)</div>
        <div className="bg-purple-900 p-2 text-xs rounded border border-purple-600 cursor-grab hover:bg-purple-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'latchNode', 'PULSE_RELAY')} draggable>Pulse Relay (Toggle)</div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-2">Edge Triggers</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-orange-900 p-2 text-xs rounded border border-orange-600 cursor-grab hover:bg-orange-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'edgeNode', 'R_TRIG')} draggable>R_TRIG (↑)</div>
          <div className="bg-orange-900 p-2 text-xs rounded border border-orange-600 cursor-grab hover:bg-orange-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'edgeNode', 'F_TRIG')} draggable>F_TRIG (↓)</div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mt-2">
        <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-2">Timers & Counters</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-teal-900 p-2 text-xs rounded border border-teal-600 cursor-grab hover:bg-teal-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'timerNode', 'TON')} draggable>On-Delay</div>
          <div className="bg-teal-900 p-2 text-xs rounded border border-teal-600 cursor-grab hover:bg-teal-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'timerNode', 'TOF')} draggable>Off-Delay</div>
        </div>
        <div className="bg-teal-900 p-2 text-xs rounded border border-teal-600 cursor-grab hover:bg-teal-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'clockNode', 'CLOCK')} draggable>Async Pulse (Blinker)</div>
        <div className="bg-pink-900 p-2 text-xs rounded border border-pink-600 cursor-grab hover:bg-pink-800 transition text-center font-bold" onDragStart={(e) => onDragStart(e, 'counterNode', 'COUNTER')} draggable>Up/Down Counter</div>
      </div>
    </aside>
  );
}
