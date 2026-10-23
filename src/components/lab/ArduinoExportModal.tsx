'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Cpu,
  Layers,
  Activity,
  Zap,
  Sliders,
  HelpCircle,
  FileCode,
  HardDrive,
  Info,
  ExternalLink,
} from 'lucide-react';
import type { CircuitDocument } from '@/lib/automation/types';
import {
  BOARD_PRESETS,
  type ArduinoBoardId,
  type ArduinoExportConfig,
  type PinAssignment,
  type PinElectricalMode,
  autoAssignPins,
  generateArduinoSketch,
} from '@/lib/codegen/arduinoGenerator';

interface ArduinoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: CircuitDocument;
}

export default function ArduinoExportModal({ isOpen, onClose, doc }: ArduinoExportModalProps) {
  const [board, setBoard] = useState<ArduinoBoardId>('uno');
  const [scanCycleMs, setScanCycleMs] = useState<number>(10);
  const [enableTelemetry, setEnableTelemetry] = useState<boolean>(true);
  const [telemetryIntervalMs, setTelemetryIntervalMs] = useState<number>(250);
  const [pinAssignments, setPinAssignments] = useState<Record<string, PinAssignment>>({});
  const [activeTab, setActiveTab] = useState<'code' | 'pins' | 'guide'>('code');
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize or re-assign pins when doc or board changes
  useEffect(() => {
    if (!isOpen) return;
    setPinAssignments(autoAssignPins(doc, board));
  }, [isOpen, doc, board]);

  // Handle board change
  const handleBoardChange = (newBoard: ArduinoBoardId) => {
    setBoard(newBoard);
    setPinAssignments(autoAssignPins(doc, newBoard));
  };

  const currentPreset = BOARD_PRESETS[board] ?? BOARD_PRESETS.uno;

  // Compute config
  const config = useMemo<ArduinoExportConfig>(() => {
    return {
      board,
      scanCycleMs,
      enableSerialTelemetry: enableTelemetry,
      telemetryIntervalMs,
      pinAssignments,
    };
  }, [board, scanCycleMs, enableTelemetry, telemetryIntervalMs, pinAssignments]);

  // Generate Arduino C++ code
  const sketchCode = useMemo(() => {
    try {
      return generateArduinoSketch(doc, config);
    } catch (err) {
      return `// Error generating Arduino sketch: ${err instanceof Error ? err.message : String(err)}`;
    }
  }, [doc, config]);

  // List of blocks that have or can have physical pins
  const ioBlocks = useMemo(() => {
    return doc.blocks.filter((b) =>
      ['INPUT', 'NC_INPUT', 'OUTPUT', 'ANALOG_INPUT', 'ANALOG_OUTPUT'].includes(b.type)
    );
  }, [doc]);

  // Copy code handler
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sketchCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = sketchCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download .ino file
  const handleDownloadIno = () => {
    const rawName = doc.name || 'automation_sketch';
    const filename = `${rawName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'sketch'}.ino`;
    const blob = new Blob([sketchCode], { type: 'text/x-c;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Update a pin assignment
  const updatePinAssignment = (blockId: string, patch: Partial<PinAssignment>) => {
    setPinAssignments((prev) => {
      const existing = prev[blockId] ?? {
        blockId,
        pinNumber: '2',
        mode: 'INPUT_PULLUP',
        invertLogic: true,
      };
      return {
        ...prev,
        [blockId]: { ...existing, ...patch },
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#1c1c1e] text-[#f5f5f7] rounded-2xl border border-[#3a3a3c] shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2c2c2e] bg-[#242426]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                  Export to Standalone Arduino Sketch
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-[#0071e3]/20 border border-[#0071e3]/40 text-[#5ac8fa]">
                  .INO / C++
                </span>
              </div>
              <p className="text-xs text-[#8e8e93]">
                Zero-library, deterministic non-blocking PLC runtime for microcontroller hardware.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e8e93] hover:text-white hover:bg-[#3a3a3c] transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Board & Global Config Toolbar */}
        <div className="px-6 py-3.5 border-b border-[#2c2c2e] bg-[#18181a] flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Target Board Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[#8e8e93] font-medium flex items-center gap-1.5">
              <Cpu size={14} className="text-[#0071e3]" /> Target Board:
            </span>
            <div className="flex rounded-lg bg-[#2c2c2e] p-0.5 border border-[#3a3a3c]">
              {(['uno', 'nano', 'mega', 'esp32', 'pico'] as ArduinoBoardId[]).map((bId) => {
                const isSelected = board === bId;
                const p = BOARD_PRESETS[bId];
                return (
                  <button
                    key={bId}
                    onClick={() => handleBoardChange(bId)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      isSelected
                        ? 'bg-[#0071e3] text-white shadow-xs'
                        : 'text-[#aeaeb2] hover:text-white hover:bg-[#3a3a3c]'
                    }`}
                    title={p.description}
                  >
                    {bId.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timing & Telemetry Settings */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#2c2c2e] px-2.5 py-1 rounded-lg border border-[#3a3a3c]">
              <Activity size={13} className="text-[#30d158]" />
              <span className="text-[#8e8e93]">Scan Cycle:</span>
              <select
                aria-label="Scan cycle period"
                value={scanCycleMs}
                onChange={(e) => setScanCycleMs(Number(e.target.value))}
                className="bg-transparent text-white font-mono text-xs outline-none cursor-pointer"
              >
                <option value={5} className="bg-[#2c2c2e] text-white">5 ms (200 Hz)</option>
                <option value={10} className="bg-[#2c2c2e] text-white">10 ms (100 Hz)</option>
                <option value={20} className="bg-[#2c2c2e] text-white">20 ms (50 Hz)</option>
                <option value={50} className="bg-[#2c2c2e] text-white">50 ms (20 Hz)</option>
                <option value={100} className="bg-[#2c2c2e] text-white">100 ms (10 Hz)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-[#2c2c2e] px-2.5 py-1 rounded-lg border border-[#3a3a3c]">
              <input
                type="checkbox"
                checked={enableTelemetry}
                onChange={(e) => setEnableTelemetry(e.target.checked)}
                className="rounded accent-[#0071e3]"
              />
              <span className="text-[#f5f5f7]">Serial Monitor (115200 baud)</span>
            </label>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-[#2c2c2e] bg-[#1c1c1e]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'code'
                  ? 'bg-[#2c2c2e] text-white border border-[#3a3a3c]'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              <FileCode size={14} className={activeTab === 'code' ? 'text-amber-400' : ''} />
              Generated Sketch (.ino)
            </button>
            <button
              onClick={() => setActiveTab('pins')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'pins'
                  ? 'bg-[#2c2c2e] text-white border border-[#3a3a3c]'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              <Sliders size={14} className={activeTab === 'pins' ? 'text-[#0071e3]' : ''} />
              Pin Configurator ({ioBlocks.length} I/O)
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'guide'
                  ? 'bg-[#2c2c2e] text-white border border-[#3a3a3c]'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              <HelpCircle size={14} className={activeTab === 'guide' ? 'text-[#30d158]' : ''} />
              Hardware Wiring &amp; Upload Guide
            </button>
          </div>

          {/* Quick Actions (Copy & Download) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-[#3a3a3c] text-white transition active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-[#30d158]" />
                  <span className="text-[#30d158]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadIno}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-sm active:scale-95"
            >
              <Download size={14} />
              <span>Download .ino</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-[#161618]">
          {activeTab === 'code' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between text-xs text-[#8e8e93] mb-2 font-mono">
                <span>{currentPreset.name} · Standalone C++ Source</span>
                <span>{sketchCode.split('\n').length} lines · Zero External Libraries</span>
              </div>
              <div className="relative flex-1 min-h-[380px] rounded-xl border border-[#2c2c2e] bg-[#0d0d0e] p-4 overflow-auto">
                <pre className="font-mono text-xs leading-relaxed text-[#d1d1d6] whitespace-pre selection:bg-[#0071e3] selection:text-white">
                  <code>{sketchCode}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'pins' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#242426] border border-[#2c2c2e] flex items-start gap-3 text-xs text-[#aeaeb2]">
                <Info size={16} className="text-[#0071e3] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Deterministic Hardware I/O Mapping:</strong>{' '}
                  Digital inputs default to <code className="text-[#5ac8fa]">INPUT_PULLUP</code> with inverted logic so standard push buttons can be wired directly between the Arduino pin and GND without external resistors. Digital outputs drive LEDs or industrial relay modules directly.
                </div>
              </div>

              {ioBlocks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8e8e93]">
                  No physical input/output blocks (INPUT, OUTPUT, ANALOG_INPUT, ANALOG_OUTPUT) found in this circuit.
                  The generated sketch will run logic internally with telemetry.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#2c2c2e] bg-[#1c1c1e]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#242426] text-[#8e8e93] border-b border-[#2c2c2e] uppercase tracking-wider text-[10px] font-mono">
                      <tr>
                        <th className="py-2.5 px-4">Circuit Block</th>
                        <th className="py-2.5 px-4">Block Type</th>
                        <th className="py-2.5 px-4">Physical Pin</th>
                        <th className="py-2.5 px-4">Electrical Mode</th>
                        <th className="py-2.5 px-4">Hardware Hookup Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2c2c2e]">
                      {ioBlocks.map((b) => {
                        const assignment = pinAssignments[b.id] ?? {
                          blockId: b.id,
                          pinNumber: '2',
                          mode: 'INPUT_PULLUP',
                          invertLogic: true,
                        };

                        const isDigitalIn = b.type === 'INPUT' || b.type === 'NC_INPUT';
                        const isDigitalOut = b.type === 'OUTPUT';
                        const isAnalogIn = b.type === 'ANALOG_INPUT';
                        const isAnalogOut = b.type === 'ANALOG_OUTPUT';

                        // Available pin choices
                        const choices = isAnalogIn
                          ? currentPreset.availableAnalogInPins
                          : isAnalogOut
                          ? currentPreset.availablePwmPins
                          : currentPreset.availableDigitalPins;

                        return (
                          <tr key={b.id} className="hover:bg-[#242426]/60 transition">
                            <td className="py-3 px-4 font-medium text-white">
                              {b.label || b.id}
                              {b.label && <span className="block font-mono text-[10px] text-[#8e8e93]">{b.id}</span>}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                  isDigitalIn
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                    : isDigitalOut
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : isAnalogIn
                                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {b.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                aria-label={`Physical pin for ${b.label || b.id}`}
                                value={assignment.pinNumber}
                                onChange={(e) => updatePinAssignment(b.id, { pinNumber: e.target.value })}
                                className="bg-[#2c2c2e] text-white border border-[#3a3a3c] rounded px-2 py-1 font-mono text-xs outline-none focus:border-[#0071e3]"
                              >
                                {choices.map((pin) => (
                                  <option key={pin} value={pin} className="bg-[#2c2c2e] text-white">
                                    Pin {pin} {pin === currentPreset.builtinLedPin ? '(LED)' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              {isDigitalIn ? (
                                <select
                                  aria-label={`Electrical mode for ${b.label || b.id}`}
                                  value={assignment.mode}
                                  onChange={(e) => {
                                    const mode = e.target.value as PinElectricalMode;
                                    updatePinAssignment(b.id, {
                                      mode,
                                      invertLogic: mode === 'INPUT_PULLUP',
                                    });
                                  }}
                                  className="bg-[#2c2c2e] text-white border border-[#3a3a3c] rounded px-2 py-1 text-xs outline-none focus:border-[#0071e3]"
                                >
                                  <option value="INPUT_PULLUP">INPUT_PULLUP (Pushbutton to GND)</option>
                                  <option value="INPUT">INPUT (Active High with 10k pull-down)</option>
                                </select>
                              ) : isDigitalOut ? (
                                <select
                                  aria-label={`Output polarity for ${b.label || b.id}`}
                                  value={assignment.invertLogic ? 'INVERTED' : 'STANDARD'}
                                  onChange={(e) =>
                                    updatePinAssignment(b.id, {
                                      invertLogic: e.target.value === 'INVERTED',
                                    })
                                  }
                                  className="bg-[#2c2c2e] text-white border border-[#3a3a3c] rounded px-2 py-1 text-xs outline-none focus:border-[#0071e3]"
                                >
                                  <option value="STANDARD">Active HIGH (Direct LED / Contactor)</option>
                                  <option value="INVERTED">Active LOW (Optocoupled Relay Module)</option>
                                </select>
                              ) : isAnalogIn ? (
                                <span className="text-[#aeaeb2] font-mono text-[11px]">
                                  ADC ({currentPreset.adcResolutionBits}-bit, 0..{currentPreset.adcMaxRaw})
                                </span>
                              ) : (
                                <span className="text-[#aeaeb2] font-mono text-[11px]">PWM (8-bit, 0..255)</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#8e8e93]">
                              {isDigitalIn && assignment.mode === 'INPUT_PULLUP'
                                ? `Connect switch between Pin ${assignment.pinNumber} and GND.`
                                : isDigitalIn
                                ? `Connect switch to +5V; add 10k resistor from Pin ${assignment.pinNumber} to GND.`
                                : isDigitalOut
                                ? `Connect Pin ${assignment.pinNumber} to relay IN or LED anode via 220Ω resistor.`
                                : isAnalogIn
                                ? `Connect potentiometer wiper to Pin ${assignment.pinNumber}.`
                                : `PWM output on Pin ${assignment.pinNumber}.`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="max-w-3xl space-y-6 text-xs text-[#d1d1d6] leading-relaxed">
              <div className="p-4 rounded-xl bg-[#242426] border border-[#2c2c2e]">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <HardDrive size={16} className="text-[#0071e3]" />
                  Getting Started in the Official Arduino IDE
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-[#aeaeb2]">
                  <li>
                    Click <strong className="text-white">Download .ino</strong> above to save your sketch.
                  </li>
                  <li>
                    Open the <strong className="text-white">Arduino IDE</strong> (version 1.8.x or 2.x).
                  </li>
                  <li>
                    Choose <span className="font-mono text-white">File &gt; Open...</span> and select the downloaded file. If Arduino prompts to create a containing folder with the same name, click <strong className="text-white">OK</strong>.
                  </li>
                  <li>
                    Under <span className="font-mono text-white">Tools &gt; Board</span>, select your microcontroller (<strong className="text-white">{currentPreset.name}</strong>).
                  </li>
                  <li>
                    Select your serial COM port under <span className="font-mono text-white">Tools &gt; Port</span>.
                  </li>
                  <li>
                    Click <strong className="text-white">Upload (➔)</strong>.
                  </li>
                  <li>
                    Open the <strong className="text-white">Serial Monitor</strong> (<span className="font-mono text-white">Ctrl + Shift + M</span>) and set baud rate to <strong className="text-white">115200</strong> to view real-time PLC cycle telemetry!
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-[#242426] border border-[#2c2c2e]">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Sliders size={16} className="text-amber-400" />
                  Hardware Breadboard Hookup Summary
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="text-[#8e8e93] border-b border-[#3a3a3c]">
                      <tr>
                        <th className="py-1 px-3">Pin</th>
                        <th className="py-1 px-3">Role</th>
                        <th className="py-1 px-3">Wiring Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2c2c2e] text-[#aeaeb2]">
                      {ioBlocks.map((b) => {
                        const a = pinAssignments[b.id];
                        if (!a) return null;
                        return (
                          <tr key={b.id}>
                            <td className="py-1.5 px-3 text-white font-bold">{a.pinNumber}</td>
                            <td className="py-1.5 px-3 text-[#5ac8fa]">{b.label || b.id}</td>
                            <td className="py-1.5 px-3 text-[#d1d1d6]">
                              {a.mode === 'INPUT_PULLUP'
                                ? `Button between Pin ${a.pinNumber} and GND (Internal pull-up enabled)`
                                : a.mode === 'OUTPUT'
                                ? `Output to Relay/LED (${a.invertLogic ? 'Active Low' : 'Active High'})`
                                : a.mode === 'ANALOG_INPUT'
                                ? `Analog 0..${currentPreset.operatingVoltage}V signal into Pin ${a.pinNumber}`
                                : `PWM Out from Pin ${a.pinNumber}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#242426] border border-[#2c2c2e]">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Check size={16} className="text-[#30d158]" />
                  Zero External Dependencies Guarantee
                </h3>
                <p className="text-[#aeaeb2]">
                  The generated C++ code uses native embedded structs for all timers (<code className="text-[#5ac8fa]">TON</code>, <code className="text-[#5ac8fa]">TOF</code>, <code className="text-[#5ac8fa]">TP</code>), flip-flops (<code className="text-[#5ac8fa]">RS_Latch</code>, <code className="text-[#5ac8fa]">PulseRelay</code>), edge detectors (<code className="text-[#5ac8fa]">R_Trig</code>), and PID controllers. You do not need to install any libraries or packages from Library Manager. It compiles cleanly on any fresh Arduino installation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#2c2c2e] bg-[#242426] text-xs">
          <div className="flex items-center gap-2 text-[#8e8e93]">
            <span>Deterministic Scan: {scanCycleMs} ms</span>
            <span>•</span>
            <span>Microcontroller Logic Runtime</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#aeaeb2] hover:text-white transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadIno}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-sm"
            >
              <Download size={14} />
              <span>Download ({doc.name || 'sketch'}.ino)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
