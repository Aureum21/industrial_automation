import { Handle, Position } from '@xyflow/react';

export function OutputNode({ data, id }: { data: any, id: string }) {
  return (
    <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-4 shadow-xl min-w-[120px] flex flex-col items-center">
      <Handle type="target" position={Position.Left} id="A" className="w-3 h-3 bg-blue-400" />
      
      <div className="flex flex-col items-center mb-3 gap-1">
        <div className="text-gray-400 text-xs font-mono">OUTPUT</div>
        <input 
          type="text" 
          placeholder="Tag (e.g. M1)"
          className="bg-gray-900 text-white text-[10px] w-16 px-1 py-0.5 rounded border border-gray-700 outline-none text-center focus:border-blue-500"
          value={data.tag || ''}
          onChange={(e) => data.onTagChange(id, e.target.value)}
        />
      </div>

      <div className={`w-12 h-12 rounded-full border-4 transition-all duration-300 ${
        data.value 
          ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_30px_rgba(250,204,21,0.6)]' 
          : 'bg-gray-900 border-gray-700'
      }`}></div>
    </div>
  );
}
