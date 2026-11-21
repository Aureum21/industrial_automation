'use client';

import { createContext, useContext, useMemo } from 'react';
import type { LogicEngine } from '@/lib/LogicEngine';
import { buildLadder, conducts, type LadderNode, type Rung, type SignalRef } from '@/lib/automation/ladder';
import { sortBlocksTopologically } from '@/lib/codegen/arduinoGenerator';
import { BLOCK_CATALOG } from '@/lib/automation/catalog';

type Read = (ref: SignalRef) => unknown;

/** Block IDs of push buttons/switches the reader may toggle by clicking their contact. */
const ToggleContext = createContext<{ toggleable: Set<string>; toggle?: (blockId: string) => void }>({ toggleable: new Set() });

const ON = '#16a34a';
const OFF = '#9ca3af';

function Wire({ powered, grow = false }: { powered: boolean; grow?: boolean }) {
  return <span aria-hidden className={`${grow ? 'flex-1' : 'w-3'} h-[2px] shrink-0 self-center`} style={{ background: powered ? ON : OFF, minWidth: grow ? 12 : undefined }} />;
}

function Contact({ node, read }: { node: Extract<LadderNode, { kind: 'contact' }>; read: Read }) {
  const closed = conducts(node, read);
  const color = closed ? ON : OFF;
  const { toggleable, toggle } = useContext(ToggleContext);
  const clickable = Boolean(toggle && node.ref.pin === 'Q' && toggleable.has(node.ref.blockId));
  const title = `${node.negated ? 'Normally closed' : 'Normally open'} contact: ${node.label} (${closed ? 'closed' : 'open'})`;
  if (clickable) {
    return (
      <button type="button" onClick={() => toggle!(node.ref.blockId)} className="flex shrink-0 cursor-pointer flex-col items-center rounded-md px-0.5 hover:bg-[#0071e3]/5" title={`${title}. Click to switch ${node.label} ${read(node.ref) ? 'OFF' : 'ON'}.`}>
        <ContactBody node={node} color={color} />
      </button>
    );
  }
  return (
    <span className="flex shrink-0 flex-col items-center px-0.5" title={title}>
      <ContactBody node={node} color={color} />
    </span>
  );
}

function ContactBody({ node, color }: { node: Extract<LadderNode, { kind: 'contact' }>; color: string }) {
  return (
    <>
      <span className="max-w-24 truncate font-mono text-[10px] leading-4 text-[#515154]">{node.label}</span>
      <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden>
        <line x1="0" y1="12" x2="14" y2="12" stroke={color} strokeWidth="2" />
        <line x1="26" y1="12" x2="40" y2="12" stroke={color} strokeWidth="2" />
        <line x1="14" y1="2" x2="14" y2="22" stroke={color} strokeWidth="2.5" />
        <line x1="26" y1="2" x2="26" y2="22" stroke={color} strokeWidth="2.5" />
        {node.negated && <line x1="11" y1="21" x2="29" y2="3" stroke={color} strokeWidth="2" />}
      </svg>
      <span className="h-4" />
    </>
  );
}

function Logic({ node, read }: { node: LadderNode; read: Read }) {
  switch (node.kind) {
    case 'contact':
      return <Contact node={node} read={read} />;
    case 'open':
      return <span className="self-center px-2 font-mono text-[10px] text-red-500" title="Nothing is wired to this input, so it is always OFF">not wired</span>;
    case 'series':
      if (!node.items.length) return <Wire powered grow />;
      return (
        <span className="flex items-center">
          {node.items.map((item, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <Wire powered={conducts({ kind: 'series', items: node.items.slice(0, index) }, read)} />}
              <Logic node={item} read={read} />
            </span>
          ))}
        </span>
      );
    case 'parallel':
      return (
        <span className="flex flex-col border-x-2 py-0.5" style={{ borderColor: conducts(node, read) ? ON : OFF }}>
          {node.branches.map((branch, index) => (
            <span key={index} className="flex items-center">
              <Wire powered={conducts(branch, read)} />
              <Logic node={branch} read={read} />
              <Wire powered={conducts(branch, read)} grow />
            </span>
          ))}
        </span>
      );
  }
}

const formatValue = (value: unknown) => (typeof value === 'boolean' ? (value ? 'ON' : 'OFF') : typeof value === 'number' ? (Number.isInteger(value) ? String(value) : value.toFixed(2)) : String(value ?? ''));

function RungRow({ rung, index, read }: { rung: Rung; index: number; read: Read }) {
  const definition = BLOCK_CATALOG[rung.type];
  const self = (pin: string) => read({ blockId: rung.blockId, pin });

  if (rung.kind === 'coil') {
    const logic = rung.inputs[0]?.logic ?? { kind: 'open' as const };
    const energized = conducts(logic, read);
    return (
      <div className="flex items-stretch">
        <RungNumber index={index} />
        <div className="flex flex-1 items-center border-l-[3px] border-r-[3px] border-[#1d1d1f] py-2">
          <Logic node={logic} read={read} />
          <Wire powered={energized} grow />
          <span className="flex shrink-0 flex-col items-center px-1" title={`${definition.name}: ${rung.label} (${energized ? 'energized' : 'off'})`}>
            <span className="max-w-28 truncate font-mono text-[10px] font-semibold leading-4 text-[#1d1d1f]">{rung.label}</span>
            <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden>
              <line x1="0" y1="12" x2="10" y2="12" stroke={energized ? ON : OFF} strokeWidth="2" />
              <path d="M15 2 Q8 12 15 22" fill="none" stroke={energized ? ON : OFF} strokeWidth="2.5" />
              <path d="M25 2 Q32 12 25 22" fill="none" stroke={energized ? ON : OFF} strokeWidth="2.5" />
              {rung.type === 'FLAG' && <text x="20" y="16" textAnchor="middle" fontSize="9" fill={energized ? ON : OFF}>M</text>}
              <line x1="30" y1="12" x2="40" y2="12" stroke={energized ? ON : OFF} strokeWidth="2" />
            </svg>
            <span className="h-4" />
          </span>
          <Wire powered={energized} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-stretch">
      <RungNumber index={index} />
      <div className="flex flex-1 items-stretch border-l-[3px] border-r-[3px] border-[#1d1d1f] py-2">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          {rung.inputs.map((input) =>
            input.logic ? (
              <div key={input.pin} className="flex items-center">
                <Logic node={input.logic} read={read} />
                <Wire powered={conducts(input.logic, read)} grow />
              </div>
            ) : (
              <div key={input.pin} className="flex h-10 items-center justify-end gap-2 pr-2 font-mono text-[10px] text-[#515154]">
                {input.value ? `${input.value.label} = ${formatValue(read(input.value.ref))}` : <span className="text-red-500">not wired</span>}
                <span className="h-[2px] w-6 bg-[#72d9e5]" />
              </div>
            ),
          )}
        </div>
        <div className="my-auto w-36 shrink-0 rounded-md border-2 border-[#1d1d1f] bg-white text-[10px]" title={definition.description}>
          <div className="truncate border-b border-[#e5e5ea] bg-[#f5f5f7] px-2 py-1 font-mono font-semibold">{definition.shortName} · {rung.label}</div>
          <div className="flex justify-between gap-2 px-2 py-1 font-mono">
            <span className="space-y-0.5">{rung.inputs.map((input) => <span key={input.pin} className="block text-[#86868b]">{input.pin}</span>)}</span>
            <span className="space-y-0.5 text-right">
              {rung.outputs.map((pin) => {
                const value = self(pin);
                return (
                  <span key={pin} className="block" style={{ color: value === true ? ON : '#1d1d1f' }}>
                    {pin} {formatValue(value)}
                  </span>
                );
              })}
            </span>
          </div>
        </div>
        <Wire powered={self('Q') === true} />
      </div>
    </div>
  );
}

function RungNumber({ index }: { index: number }) {
  return <span className="w-10 shrink-0 pt-3 pr-2 text-right font-mono text-[10px] text-[#86868b]">{String(index + 1).padStart(3, '0')}</span>;
}

export default function LadderView({ engine, syncKey, onToggleInput }: { engine: LogicEngine; syncKey: number; onToggleInput?: (blockId: string) => void }) {
  // syncKey changes on every scan and every edit; rebuilding is cheap for lab-sized circuits.
  const { rungs, toggleable } = useMemo(() => {
    void syncKey;
    const doc = engine.toDocument();
    let order = doc.blocks;
    try {
      order = sortBlocksTopologically(doc);
    } catch {
      // Unbroken feedback loops are reported by the simulator; fall back to document order.
    }
    return { rungs: buildLadder(doc, order), toggleable: new Set(doc.blocks.filter((block) => block.type === 'INPUT' || block.type === 'NC_INPUT').map((block) => block.id)) };
  }, [engine, syncKey]);
  const read: Read = (ref) => engine.blocks.get(ref.blockId)?.outputs[ref.pin];

  return (
    <ToggleContext.Provider value={{ toggleable, toggle: onToggleInput }}>
    <div className="h-full overflow-auto bg-white px-4 pb-48 pt-16">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 max-w-2xl text-xs leading-5 text-[#86868b]">
          Ladder view (read-only), generated from the function blocks. Gates become contacts: AND in series, OR in parallel, NOT as a normally closed contact. Green means power flows. Click a switch contact to operate it; edit the circuit in the function block view.
        </p>
        {rungs.length ? (
          <div className="space-y-1">
            {rungs.map((rung, index) => <RungRow key={rung.id} rung={rung} index={index} read={read} />)}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-[#86868b]">No rungs yet. Add an output or a function block in the Visual view.</p>
        )}
      </div>
    </div>
    </ToggleContext.Provider>
  );
}
