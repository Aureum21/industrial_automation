import React from 'react';
import type { BlockType } from '@/lib/automation/types';

/**
 * Inline SVG icons styled after LOGO! Soft Comfort block symbols.
 * Each returns a 28×28 SVG element with recognizable IEC-style schematic graphics.
 */
const icons: Partial<Record<BlockType, () => React.ReactNode>> = {
  // ── Digital I/O ──
  INPUT: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="22" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="14" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="14" y1="10" x2="14" y2="18" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  OUTPUT: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="22" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="14" r="5" fill="currentColor" opacity="0.2"/><circle cx="14" cy="14" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  HIGH: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><text x="14" y="19" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor">1</text></svg>
  ),
  LOW: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><text x="14" y="19" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor">0</text></svg>
  ),
  FLAG: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><path d="M8 5v18M8 5l12 6-12 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),

  // ── Logic Gates (IEC rectangular style like LOGO!) ──
  AND: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="6" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">&amp;</text></svg>
  ),
  OR: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="6" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor">≥1</text></svg>
  ),
  NOT: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><polygon points="6,6 22,14 6,22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="24" cy="14" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  XOR: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="6" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor">=1</text></svg>
  ),
  NAND: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="12" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">&amp;</text><circle cx="23" cy="14" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  NOR: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="12" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor">≥1</text><circle cx="23" cy="14" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  XNOR: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="6" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">=</text></svg>
  ),
  AND_EDGE: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">&amp;</text><polyline points="22,18 25,14 22,10" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  NAND_EDGE: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="2" y="6" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="10" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">&amp;</text><circle cx="20" cy="14" r="2" fill="none" stroke="currentColor" strokeWidth="1.2"/><polyline points="23,18 26,14 23,10" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),

  // ── Timers (IEC timer symbols) ──
  TON: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="8,20 8,14 16,14 16,8 20,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  TOF: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="8,8 8,14 16,14 16,20 20,20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  ON_OFF_DELAY: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="7,18 10,18 10,10 18,10 18,18 21,18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  RETENTIVE_TON: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="8,20 8,14 16,14 16,8 20,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><line x1="8" y1="22" x2="20" y2="22" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  CLOCK: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="14" y1="7" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5"/><line x1="14" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  PULSE_TIMER: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="8,18 8,8 16,8 16,18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><line x1="16" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  STOPWATCH: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><circle cx="14" cy="15" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="14" y1="8" x2="14" y2="15" stroke="currentColor" strokeWidth="1.5"/><line x1="12" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="2"/></svg>
  ),

  // ── Counters ──
  COUNTER: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="13" textAnchor="middle" fontSize="7" fill="currentColor">CTU</text><text x="14" y="21" textAnchor="middle" fontSize="7" fill="currentColor">CTD</text></svg>
  ),
  HOURS_COUNTER: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">h</text></svg>
  ),

  // ── Memory ──
  RS_LATCH: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="13" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">S</text><line x1="6" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="0.8"/><text x="14" y="22" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">R</text></svg>
  ),
  PULSE_RELAY: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="9,18 14,8 19,18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  R_TRIG: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="9,20 9,8 19,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
  ),
  F_TRIG: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="9,8 9,20 19,20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
  ),

  // ── Analog Processing ──
  MATH: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="19" textAnchor="middle" fontSize="14" fill="currentColor">Σ</text></svg>
  ),
  ANALOG_COMPARATOR: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">⋛</text></svg>
  ),
  PI_CONTROLLER: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">PI</text></svg>
  ),
  PWM: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="7,18 7,10 12,10 12,18 17,18 17,10 22,10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  ANALOG_AMPLIFIER: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><polygon points="5,6 23,14 5,22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  ANALOG_FILTER: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M7 18 Q10 8, 14 14 Q18 20, 21 10" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  ANALOG_MUX: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><path d="M5 4 L23 10 L23 18 L5 24 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  ANALOG_RAMP: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="8,20 14,8 20,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  DATA_LOG: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><polyline points="8,18 11,12 14,16 17,10 20,14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ),
  SHIFT_REGISTER: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="4" y="8" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="10" y1="8" x2="10" y2="20" stroke="currentColor" strokeWidth="0.8"/><line x1="14" y1="8" x2="14" y2="20" stroke="currentColor" strokeWidth="0.8"/><line x1="18" y1="8" x2="18" y2="20" stroke="currentColor" strokeWidth="0.8"/><path d="M7 22 L14 25 L21 22" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
  ),
  // ── Mechatronics ──
  SERVO_AXIS: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M14 10v4l3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><text x="14" y="26" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor">SERVO</text></svg>
  ),
  DC_MOTOR: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="17.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">M</text></svg>
  ),
  KINEMATICS_2D: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><path d="M4 24 L14 14 L24 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="14" r="2" fill="currentColor"/><circle cx="24" cy="8" r="2" fill="currentColor"/></svg>
  ),
  INV_KINEMATICS_2D: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><path d="M4 24 L14 14 L24 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="14" r="2" fill="none" stroke="currentColor"/><circle cx="24" cy="8" r="2" fill="none" stroke="currentColor"/></svg>
  ),
  PID_CONTROLLER: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="22" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor">PID</text></svg>
  ),
  TRANSFER_FUNCTION: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="22" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M6 18 Q 10 18, 14 14 T 22 10" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  SIGNAL_GENERATOR: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="22" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M5 14 Q 9 6, 14 14 T 23 14" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  MATH_EXPRESSION: () => (
    <svg viewBox="0 0 28 28" className="w-7 h-7"><rect x="3" y="6" width="22" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="14" y="18" textAnchor="middle" fontSize="10" fontStyle="italic" fontWeight="bold" fill="currentColor">ƒ(x)</text></svg>
  ),
};

export function BlockIcon({ type }: { type: BlockType }) {
  const Icon = icons[type];
  if (!Icon) return null;
  return <Icon />;
}

export default icons;
