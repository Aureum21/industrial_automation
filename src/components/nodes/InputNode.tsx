import { Handle, Position } from '@xyflow/react';

export function InputNode({ data, id }: { data: any, id: string }) {
  return (
    <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-4 shadow-xl min-w-[120px]">
      <div className="text-gray-400 text-xs font-mono mb-2 text-center">INPUT</div>
      <button 
        onClick={() => data.onToggle(id, !data.value)}
        className={`w-full py-2 rounded font-bold transition-colors ${
          data.value ? 'bg-green-500 text-green-900 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-700 text-gray-400'
        }`}
      >
        {data.value ? 'ON' : 'OFF'}
      </button>
      <Handle type="source" position={Position.Right} id="Q" className="w-3 h-3 bg-blue-400" />
    </div>
  );
}
