import React, { useState } from 'react';
import { Flame, ShieldCheck, Scale, Lock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const DragonFlowchart: React.FC = () => {
  const [activeGate, setActiveGate] = useState<number>(1);

  const gates = [
    {
      id: 1,
      title: "1. The Dragon's Breath",
      subtitle: "Deterministic Calldata Inspector",
      icon: Flame,
      color: "from-orange-500 to-amber-500",
      borderColor: "border-orange-500/40",
      description: "Pure deterministic code compares executable transaction parameters between baseline and proposed manifests. No AI is used here, guaranteeing arithmetic certainty.",
      checks: [
        "ACTION_COUNT_DELTA (Addition/removal of operations)",
        "TARGET_MUTATION (Contract call address redirects)",
        "SELECTOR_MUTATION (Function call selector tampering)",
        "RECIPIENT_DIVERGENCE (Payout beneficiary alterations)",
        "CAPITAL_DELTA (Treasury spending cap increases)",
        "ZERO_ADDRESS_ALERT & UNLIMITED_ALLOWANCE_ALERT"
      ]
    },
    {
      id: 2,
      title: "2. The Dragon Council",
      subtitle: "Multi-Validator Semantic Consensus",
      icon: Scale,
      color: "from-amber-500 to-red-500",
      borderColor: "border-amber-500/40",
      description: "Independent GenLayer validators execute comparative semantic evaluation. The council judges whether the natural-language changelog transparently explains every single material change.",
      checks: [
        "gl.eq_principle.prompt_comparative across independent nodes",
        "Prompt Injection Neutralization (inputs fenced as inert data)",
        "Threat classification (AUTHORITY_EXPANSION, PURPOSE_DRIFT, etc.)",
        "Deterministic override: if action diff exists but is undisclosed, veto is automatic",
        "Risk score assessment from 0 (harmless) to 100 (critical breach)"
      ]
    },
    {
      id: 3,
      title: "3. The Guardian's Seal",
      subtitle: "Sovereign Enactment Gate",
      icon: Lock,
      color: "from-emerald-500 to-teal-500",
      borderColor: "border-emerald-500/40",
      description: "AI validators can only certify or veto. Only the authenticated covenant guardian can commit a certified revision into active canon. Eliminates rogue AI execution risks.",
      checks: [
        "get_caller_address() == covenant.guardian verification",
        "Strict check that codicil.status == COUNCIL_CERTIFIED",
        "Parent epoch binding verification prevents desynchronization",
        "Atomic state transition: Epoch N becomes historic, Epoch N+1 becomes canon"
      ]
    }
  ];

  return (
    <div className="bg-[#10131a] border border-orange-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">Dragon Sentry Architecture Radar</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Three defensive gates protecting DAO covenants from silent scope creep and calldata manipulation.
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
          Fail-Closed Invariants
        </span>
      </div>

      {/* Pipeline Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {gates.map((gate) => {
          const Icon = gate.icon;
          const isActive = activeGate === gate.id;
          return (
            <button
              key={gate.id}
              onClick={() => setActiveGate(gate.id)}
              className={`p-4 rounded-xl text-left transition-all border ${
                isActive
                  ? `${gate.borderColor} bg-gradient-to-b from-[#181c26] to-[#131620] shadow-lg shadow-orange-950/20 ring-1 ring-orange-500/40`
                  : 'border-white/5 bg-[#141720]/60 hover:border-white/10 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${gate.color} text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                )}
              </div>
              <div className="font-semibold text-sm text-slate-100">{gate.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{gate.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Active Gate Detailed Panel */}
      {(() => {
        const active = gates.find((g) => g.id === activeGate)!;
        return (
          <div className="bg-[#141720] border border-white/5 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-300 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  {active.title} — {active.subtitle}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{active.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {active.checks.map((check, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-300 bg-[#0d0f14] px-3 py-2 rounded-lg border border-white/5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
