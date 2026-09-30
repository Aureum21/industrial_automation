import { Handle, Position } from '@xyflow/react';

export function ClockNode({ data, id }: { data: any, id: string }) {
  return (
    <div className="bg-teal-900 border-2 border-teal-500 rounded-lg px-4 py-3 shadow-xl min-w-[120px] flex flex-col items-center justify-center relative">
      <div className="text-white font-bold tracking-widest text-sm mb-2">
        BLINKER
      </div>
      
      <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] text-teal-300">ON:</span>
          <input 
            type="number" 
            className="bg-gray-900 text-white text-[10px] w-12 px-1 py-0.5 rounded border border-teal-700 outline-none focus:border-teal-400 text-center"
            value={data.onTime || 1000}
            onChange={(e) => data.onParamChange(id, 'onTime', parseInt(e.target.value))}
          />
        </div>
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] text-teal-300">OFF:</span>
          <input 
            type="number" 
            className="bg-gray-900 text-white text-[10px] w-12 px-1 py-0.5 rounded border border-teal-700 outline-none focus:border-teal-400 text-center"
            value={data.offTime || 1000}
            onChange={(e) => data.onParamChange(id, 'offTime', parseInt(e.target.value))}
          />
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="Q" className="w-3 h-3 bg-teal-400" />
    </div>
  );
}
