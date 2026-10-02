'use client';
import LabWorkspace from '@/components/lab/LabWorkspace';

export default function PostPage() {
  return (
    <main className="bg-white min-h-screen text-gray-900 pb-32">
      <article className="mx-auto max-w-3xl px-5 sm:px-8 mt-16">
        <h1 className="text-4xl sm:text-5xl font-serif font-extrabold tracking-tight mb-8 leading-tight">
          Building a Water Treatment Simulator
        </h1>
        
        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500">
            J
          </div>
          <div>
            <div className="font-medium text-gray-900">John Doe</div>
            <div className="text-sm text-gray-500 flex gap-2">
              <span>12 min read</span>
              <span>·</span>
              <span>Sep 25</span>
            </div>
          </div>
        </div>

        <div className="prose prose-lg prose-gray max-w-none font-serif text-xl leading-relaxed text-gray-800 mb-12">
          <p>
            When designing a control system for a water treatment facility, one of the most fundamental concepts to master is interlocking logic. We need to ensure that the primary pump cannot start unless the intake valve is fully open, and we need a system to gracefully shut down the pump if the tank level exceeds the high-level limit.
          </p>
          <p>
            In traditional PLCs, this is often handled with a mix of latches and edge triggers. Let&apos;s look at a live interactive example.
          </p>
          <p>
            I have embedded the simulation below. Try toggling the <strong>Intake Valve</strong> (Input) and then press the <strong>Start Button</strong> to see how the RS Latch holds the state of the motor.
          </p>
        </div>

        {/* Embedded Interactive Simulation */}
        <div className="my-16 -mx-5 sm:-mx-12 rounded-xl overflow-hidden border border-gray-200 shadow-xl h-[600px] flex flex-col">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Interactive Simulation</span>
             <span className="text-xs text-gray-400">Powered by AutomationHub</span>
          </div>
          <div className="flex-grow bg-[#0b1118]">
            <LabWorkspace />
          </div>
        </div>

        <div className="prose prose-lg prose-gray max-w-none font-serif text-xl leading-relaxed text-gray-800">
          <p>
            As you can see, once the latch is set, releasing the start button doesn&apos;t stop the motor. The only way to stop the process is by triggering the Reset pin, which in our case is wired to the High-Level Sensor or the emergency stop.
          </p>
          <p>
            This fundamental pattern—using an RS Latch combined with AND gates for safety interlocks—forms the backbone of almost every industrial automation sequence.
          </p>
        </div>
      </article>
    </main>
  );
}
