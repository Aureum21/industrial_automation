import { Handle, Position } from '@xyflow/react';

export function GateNode({ data }: { data: any }) {
  const isNot = data.gateType === 'NOT';

  return (
    <div className="bg-blue-900 border-2 border-blue-500 rounded-lg px-6 py-4 shadow-xl min-w-[100px] flex items-center justify-center">
      <Handle type="target" position={Position.Left} id="A" style={{ top: isNot ? '50%' : '30%' }} className="w-3 h-3 bg-blue-400" />
      {!isNot && (
        <Handle type="target" position={Position.Left} id="B" style={{ top: '70%' }} className="w-3 h-3 bg-blue-400" />
      )}
      
      <div className="text-white font-bold tracking-widest text-lg">
        {data.gateType}
      </div>

      <Handle type="source" position={Position.Right} id="Q" className="w-3 h-3 bg-blue-400" />
    </div>
  );
}
