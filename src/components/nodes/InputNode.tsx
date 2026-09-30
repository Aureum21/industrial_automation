import { Handle, Position } from '@xyflow/react';

export function InputNode({ data, id }: { data: any, id: string }) {
  // If the user has assigned a tag, they are pulling data wirelessly from an output coil
  const isWireless = !!data.tag;

  return (
    <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-3 shadow-xl min-w-[120px]">
      <div className="flex justify-between items-center mb-2">
        <div className="text-gray-400 text-xs font-mono">INPUT</div>
        <input 
          type="text" 
          placeholder="Tag (e.g. M1)"
          className="bg-gray-900 text-white text-[10px] w-16 px-1 py-0.5 rounded border border-gray-700 outline-none focus:border-blue-500"
          value={data.tag || ''}
          onChange={(e) => data.onTagChange(id, e.target.value)}
        />
      </div>
      
      {!isWireless ? (
        <button 
          onClick={() => data.onToggle(id, !data.value)}
          className={`w-full py-2 rounded font-bold transition-colors ${
            data.value ? 'bg-green-500 text-green-900 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-700 text-gray-400'
          }`}
        >
          {data.value ? 'ON' : 'OFF'}
        </button>
      ) : (
        <div className={`w-full py-2 rounded font-bold text-center transition-colors ${
          data.value ? 'bg-green-500 text-green-900' : 'bg-gray-700 text-gray-400'
        }`}>
           READ: {data.tag}
        </div>
      )}

      <Handle type="source" position={Position.Right} id="Q" className="w-3 h-3 bg-blue-400" />
    </div>
  );
}
