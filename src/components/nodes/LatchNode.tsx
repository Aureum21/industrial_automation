import { Handle, Position } from '@xyflow/react';

export function LatchNode({ data }: { data: any }) {
  const isPulse = data.gateType === 'PULSE_RELAY';

  return (
    <div className="bg-purple-900 border-2 border-purple-500 rounded-lg py-4 w-[120px] shadow-xl flex flex-col items-center relative">
      {isPulse ? (
        <>
          <Handle type="target" position={Position.Left} id="A" style={{ top: '50%' }} className="w-3 h-3 bg-purple-400" />
          <span className="absolute left-2 top-[42%] text-[10px] font-mono text-purple-300">Trg</span>
        </>
      ) : (
        <>
          <Handle type="target" position={Position.Left} id="S" style={{ top: '30%' }} className="w-3 h-3 bg-purple-400" />
          <span className="absolute left-2 top-[22%] text-[10px] font-mono text-purple-300">S</span>
          
          <Handle type="target" position={Position.Left} id="R" style={{ top: '70%' }} className="w-3 h-3 bg-purple-400" />
          <span className="absolute left-2 top-[62%] text-[10px] font-mono text-purple-300">R</span>
        </>
      )}
      
      <div className="text-white font-bold tracking-widest text-md text-center px-6">
        {isPulse ? (
          <>PULSE<br/><span className="text-[10px] font-normal">RELAY</span></>
        ) : (
          <>RS<br/><span className="text-[10px] font-normal">LATCH</span></>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="Q" className="w-3 h-3 bg-purple-400" />
      <span className="absolute right-2 top-[42%] text-[10px] font-mono text-purple-300">Q</span>
    </div>
  );
}
