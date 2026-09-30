import { Handle, Position } from '@xyflow/react';

export function CounterNode({ data, id }: { data: any, id: string }) {
  return (
    <div className="bg-pink-900 border-2 border-pink-500 rounded-lg py-3 w-[140px] shadow-xl flex flex-col items-center relative">
      <Handle type="target" position={Position.Left} id="CU" style={{ top: '20%' }} className="w-3 h-3 bg-pink-400" />
      <span className="absolute left-2 top-[12%] text-[10px] font-mono text-pink-300">CU</span>
      
      <Handle type="target" position={Position.Left} id="CD" style={{ top: '50%' }} className="w-3 h-3 bg-pink-400" />
      <span className="absolute left-2 top-[42%] text-[10px] font-mono text-pink-300">CD</span>
      
      <Handle type="target" position={Position.Left} id="R" style={{ top: '80%' }} className="w-3 h-3 bg-pink-400" />
      <span className="absolute left-2 top-[72%] text-[10px] font-mono text-pink-300">R</span>
      
      <div className="text-white font-bold tracking-widest text-sm text-center mb-1">
        COUNTER
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-pink-300">Limit:</span>
        <input 
          type="number" 
          placeholder="5"
          className="bg-gray-900 text-white text-[10px] w-12 px-1 py-0.5 rounded border border-pink-700 outline-none focus:border-pink-400 text-center"
          value={data.limit || 5}
          onChange={(e) => data.onParamChange(id, 'limit', parseInt(e.target.value))}
        />
      </div>

      <Handle type="source" position={Position.Right} id="Q" className="w-3 h-3 bg-pink-400" />
      <span className="absolute right-2 top-[42%] text-[10px] font-mono text-pink-300">Q</span>
    </div>
  );
}
