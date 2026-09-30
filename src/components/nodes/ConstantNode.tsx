import { Handle, Position } from '@xyflow/react';

export function ConstantNode({ data }: { data: any }) {
  const isHigh = data.gateType === 'HIGH';
  return (
    <div className={`${isHigh ? 'bg-green-900 border-green-500' : 'bg-red-900 border-red-500'} border-2 rounded-lg px-4 py-2 shadow-xl flex items-center justify-center relative`}>
      <div className="text-white font-bold tracking-widest text-sm">
        {isHigh ? 'HIGH (1)' : 'LOW (0)'}
      </div>
      <Handle type="source" position={Position.Right} id="Q" className={`w-3 h-3 ${isHigh ? 'bg-green-400' : 'bg-red-400'}`} />
    </div>
  );
}
