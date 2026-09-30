import { Handle, Position } from '@xyflow/react';

export function OutputNode({ data }: { data: any }) {
  return (
    <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-4 shadow-xl min-w-[120px] flex flex-col items-center">
      <Handle type="target" position={Position.Left} id="A" className="w-3 h-3 bg-blue-400" />
      <div className="text-gray-400 text-xs font-mono mb-3 text-center">OUTPUT</div>
      <div className={`w-12 h-12 rounded-full border-4 transition-all duration-300 ${
        data.value 
          ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_30px_rgba(250,204,21,0.6)]' 
          : 'bg-gray-900 border-gray-700'
      }`}></div>
    </div>
  );
}
