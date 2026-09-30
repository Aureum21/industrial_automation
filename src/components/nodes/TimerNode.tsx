import { Handle, Position } from '@xyflow/react';

export function TimerNode({ data, id }: { data: any, id: string }) {
  return (
    <div className="bg-teal-900 border-2 border-teal-500 rounded-lg px-4 py-3 shadow-xl min-w-[120px] flex flex-col items-center justify-center relative">
      <Handle type="target" position={Position.Left} id="A" className="w-3 h-3 bg-teal-400" />
      
      <div className="text-white font-bold tracking-widest text-sm mb-1">
        {data.gateType}
      </div>
      
      <div className="flex items-center gap-1">
        <input 
          type="number" 
          placeholder="2000"
          className="bg-gray-900 text-white text-[10px] w-12 px-1 py-0.5 rounded border border-teal-700 outline-none focus:border-teal-400 text-center"
          value={data.duration || 2000}
          onChange={(e) => data.onParamChange(id, 'duration', parseInt(e.target.value))}
        />
        <span className="text-[10px] text-teal-300">ms</span>
      </div>

      <Handle type="source" position={Position.Right} id="Q" className="w-3 h-3 bg-teal-400" />
    </div>
  );
}
