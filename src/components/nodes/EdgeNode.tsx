import { Handle, Position } from '@xyflow/react';

export function EdgeNode({ data }: { data: any }) {
  const isRising = data.gateType === 'R_TRIG';
  
  return (
    <div className="bg-orange-900 border-2 border-orange-500 rounded-lg px-6 py-4 shadow-xl min-w-[100px] flex flex-col items-center justify-center relative">
      <Handle type="target" position={Position.Left} id="A" className="w-3 h-3 bg-orange-400" />
      
      <div className="text-white font-bold tracking-widest text-sm flex items-center gap-1">
        {data.gateType} 
        <span className="text-lg font-black">{isRising ? '↑' : '↓'}</span>
      </div>

      <Handle type="source" position={Position.Right} id="Q" className="w-3 h-3 bg-orange-400" />
    </div>
  );
}
