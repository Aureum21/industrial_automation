'use client';
import { useState, useEffect, useRef } from 'react';
import { LogicEngine } from '@/lib/LogicEngine';

export default function Home() {
  const [engine, setEngine] = useState<LogicEngine | null>(null);
  const [outputState, setOutputState] = useState(false);
  const [in1, setIn1] = useState(false);
  const [in2, setIn2] = useState(false);

  // Use a ref to store the engine across renders
  const engineRef = useRef<LogicEngine | null>(null);

  useEffect(() => {
    const le = new LogicEngine();
    
    le.addBlock({ id: 'in1', type: 'INPUT', inputs: {}, outputs: { Q: false }, value: false });
    le.addBlock({ id: 'in2', type: 'INPUT', inputs: {}, outputs: { Q: false }, value: false });
    le.addBlock({ id: 'and1', type: 'AND', inputs: { A: false, B: false }, outputs: { Q: false } });
    le.addBlock({ id: 'out1', type: 'OUTPUT', inputs: { A: false }, outputs: { Q: false } });

    le.addConnection({ fromBlockId: 'in1', fromPin: 'Q', toBlockId: 'and1', toPin: 'A' });
    le.addConnection({ fromBlockId: 'in2', fromPin: 'Q', toBlockId: 'and1', toPin: 'B' });
    le.addConnection({ fromBlockId: 'and1', fromPin: 'Q', toBlockId: 'out1', toPin: 'A' });

    engineRef.current = le;
    setEngine(le);
  }, []);

  const handleToggle = (id: string, value: boolean) => {
    if (!engineRef.current) return;
    
    // Update the engine input
    engineRef.current.setInput(id, value);
    // Tick twice to propagate signal through the AND gate to the OUTPUT
    engineRef.current.tick(); 
    engineRef.current.tick(); 

    // Update React state for UI
    if (id === 'in1') setIn1(value);
    if (id === 'in2') setIn2(value);
    setOutputState(engineRef.current.blocks.get('out1')?.outputs['Q'] ?? false);
  };

  if (!engine) return <div>Loading Simulator...</div>;

  return (
    <main className="min-h-screen p-12 bg-gray-900 text-white flex flex-col items-center font-sans">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Automation Hub</h1>
      <p className="text-gray-400 mb-12">Phase 1: Real-time Logic Execution Engine (PoC)</p>
      
      <div className="bg-gray-800 p-12 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-16 border border-gray-700">
        
        {/* Input Layer */}
        <div className="flex justify-around relative">
          <div className="flex flex-col items-center gap-4 z-10">
            <span className="font-mono text-gray-400 text-sm tracking-widest">INPUT A</span>
            <button 
              onClick={() => handleToggle('in1', !in1)}
              className={`w-20 h-32 rounded-xl shadow-inner transition-all duration-200 border-2 active:scale-95 flex items-center justify-center font-bold text-xl ${in1 ? 'bg-green-500 border-green-400 text-green-900 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
            >
              {in1 ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex flex-col items-center gap-4 z-10">
            <span className="font-mono text-gray-400 text-sm tracking-widest">INPUT B</span>
            <button 
              onClick={() => handleToggle('in2', !in2)}
              className={`w-20 h-32 rounded-xl shadow-inner transition-all duration-200 border-2 active:scale-95 flex items-center justify-center font-bold text-xl ${in2 ? 'bg-green-500 border-green-400 text-green-900 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
            >
              {in2 ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Logic Layer */}
        <div className="flex justify-center relative">
           <div className="bg-blue-600 px-12 py-6 rounded-xl font-bold tracking-widest shadow-lg text-2xl relative z-10 border-2 border-blue-400 text-white">
              AND GATE
           </div>
        </div>

        {/* Output Layer */}
        <div className="flex justify-center mt-4">
          <div className="flex flex-col items-center gap-6">
            <span className="font-mono text-gray-400 text-sm tracking-widest">OUTPUT</span>
            <div className={`w-40 h-40 rounded-full transition-all duration-300 border-8 flex items-center justify-center ${
              outputState 
                ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_120px_rgba(250,204,21,0.8)] scale-105' 
                : 'bg-gray-800 border-gray-700 shadow-inner scale-100'
            }`}>
              <span className={`font-bold text-2xl ${outputState ? 'text-yellow-900' : 'text-gray-600'}`}>
                {outputState ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
