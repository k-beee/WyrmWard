import React, { useState } from 'react';
import { Flame, ShieldCheck, Scale, Lock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface GateDef {
  id: number;
  gateTag: string;
  title: string;
  subtitle: string;
  icon: typeof Flame;
  gateClass: string;
  iconColor: string;
  description: string;
  guaranteeTitle: string;
  guaranteeText: string;
  checks: string[];
}

export const DragonFlowchart: React.FC = () => {
  const [activeGate, setActiveGate] = useState<number>(1);

  const gates: GateDef[] = [
    {
      id: 1,
      gateTag: 'GATE 01 · ARITHMETIC',
      title: "1. The Dragon's Breath",
      subtitle: 'Deterministic Calldata Inspector',
      icon: Flame,
      gateClass: 'gate-1',
      iconColor: 'var(--ww-ember)',
      description:
        'Pure deterministic Python comparison of executable transaction parameters between baseline and proposed manifests. No AI is used at this stage, guaranteeing absolute mathematical certainty.',
      guaranteeTitle: 'Arithmetic Fail-Closed Invariant',
      guaranteeText:
        'If any target address, function selector, spending limit, or beneficiary diverges between the baseline and proposed calldata without being disclosed, the proposal is immediately flagged for automatic veto.',
      checks: [
        'ACTION_COUNT_DELTA (Addition or deletion of operations)',
        'TARGET_MUTATION (Contract call address redirects)',
        'SELECTOR_MUTATION (Function call selector tampering)',
        'RECIPIENT_DIVERGENCE (Payout beneficiary alterations)',
        'CAPITAL_DELTA (Treasury spending cap increases)',
        'ZERO_ADDRESS_ALERT & UNLIMITED_ALLOWANCE_ALERT',
      ],
    },
    {
      id: 2,
      gateTag: 'GATE 02 · CONSENSUS',
      title: '2. The Dragon Council',
      subtitle: 'Multi-Validator Semantic Consensus',
      icon: Scale,
      gateClass: 'gate-2',
      iconColor: 'var(--ww-gold)',
      description:
        'Independent GenLayer validator nodes execute comparative semantic evaluation. The council judges whether the natural-language changelog transparently explains every single material change.',
      guaranteeTitle: 'Consensus Equivalence Principle',
      guaranteeText:
        'gl.eq_principle.prompt_comparative ensures multi-node agreement across independent LLMs. Untrusted inputs are strictly fenced to neutralize prompt injection attacks.',
      checks: [
        'gl.eq_principle.prompt_comparative multi-node consensus',
        'Prompt Injection Neutralization (inputs fenced as inert data)',
        'Threat classification (AUTHORITY_EXPANSION, PURPOSE_DRIFT)',
        'Deterministic override: undisclosed diffs trigger automatic veto',
        'Continuous risk scoring from 0 (harmless) to 100 (critical breach)',
        'Categorical verdicts: EDITORIAL_APPROVED vs HOSTILE_REJECTED',
      ],
    },
    {
      id: 3,
      gateTag: 'GATE 03 · SOVEREIGN',
      title: "3. The Guardian's Seal",
      subtitle: 'Sovereign Enactment Gate',
      icon: Lock,
      gateClass: 'gate-3',
      iconColor: 'var(--ww-emerald)',
      description:
        'AI validators can only certify or veto amendments. Only the authenticated covenant guardian can commit a certified revision into active canon, eliminating rogue autonomous execution.',
      guaranteeTitle: 'Human Guardian Non-Autonomous Invariant',
      guaranteeText:
        'AI is forbidden from self-committing amendments into state. The cryptographic transaction commit requires the human guardian signature on-chain.',
      checks: [
        'get_caller_address() == covenant.guardian verification',
        'Strict verification of codicil.status == COUNCIL_CERTIFIED',
        'Parent epoch binding check prevents desynchronization',
        'Atomic state transition: Epoch N becomes historic, Epoch N+1 becomes canon',
        'Execution calldata manifest sealed immutably in GenVM storage',
      ],
    },
  ];

  const active = gates.find((g) => g.id === activeGate) || gates[0];
  const ActiveIcon = active.icon;

  return (
    <div className="ww-radar-panel">
      {/* Radar Header */}
      <div className="ww-radar-header">
        <div className="ww-radar-title-group">
          <h3>
            <ShieldCheck size={22} color="var(--ww-ember)" />
            Dragon Sentry Architecture Radar
          </h3>
          <p>
            Three defensive gates protecting DAO covenants from silent scope creep, calldata manipulation,
            and unauthorized treasury deviations across the revision lifecycle.
          </p>
        </div>
        <span className="ww-radar-badge">
          <ShieldCheck size={13} />
          FAIL-CLOSED INVARIANTS
        </span>
      </div>

      {/* 3-Gate Pipeline Stepper */}
      <div className="ww-radar-pipeline">
        {gates.map((gate) => {
          const Icon = gate.icon;
          const isActive = activeGate === gate.id;
          return (
            <button
              key={gate.id}
              type="button"
              onClick={() => setActiveGate(gate.id)}
              className={`ww-gate-card ${gate.gateClass} ${isActive ? 'active' : ''}`}
            >
              <div className="ww-gate-top">
                <div className={`ww-gate-icon-box ${gate.gateClass}`}>
                  <Icon size={20} color={gate.iconColor} />
                </div>
                <span className="ww-gate-step-tag">{gate.gateTag}</span>
              </div>
              <div>
                <div className="ww-gate-name">{gate.title}</div>
                <div className="ww-gate-subtitle">{gate.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Gate Detailed Dossier */}
      <div className="ww-gate-dossier">
        <div className="ww-gate-dossier-header">
          <div className="ww-gate-dossier-title">
            <ActiveIcon size={18} color={active.iconColor} />
            <span>
              {active.title} — {active.subtitle}
            </span>
          </div>
          <span className="ww-badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
            {active.gateTag}
          </span>
        </div>

        <p className="ww-gate-dossier-desc">{active.description}</p>

        {/* Security Invariants & Checks */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--ww-text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            Enforced Checks & Verifications
          </div>
          <div className="ww-gate-checks-grid">
            {active.checks.map((check, idx) => (
              <div key={idx} className="ww-gate-check-card">
                <CheckCircle2 size={14} color={active.iconColor} style={{ flexShrink: 0 }} />
                <code>{check}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Guarantee Box */}
        <div className={`ww-gate-guarantee-box ${active.gateClass}`}>
          <ShieldAlert size={18} color={active.iconColor} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h5>{active.guaranteeTitle}</h5>
            <p>{active.guaranteeText}</p>
          </div>
        </div>
      </div>

      {/* Sequential Architecture Diagram Strip */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--ww-text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '10px',
          }}
        >
          End-to-End Governance Transition Path
        </div>
        <div className="ww-radar-seq-strip">
          <div className="ww-radar-seq-node">
            <span>Input</span>
            <strong>Draft Codicil</strong>
          </div>
          <div className="ww-radar-seq-arrow">
            <ArrowRight size={16} />
          </div>
          <div className="ww-radar-seq-node">
            <span style={{ color: 'var(--ww-ember)' }}>Gate 1</span>
            <strong>Calldata Inspection</strong>
          </div>
          <div className="ww-radar-seq-arrow">
            <ArrowRight size={16} />
          </div>
          <div className="ww-radar-seq-node">
            <span style={{ color: 'var(--ww-gold)' }}>Gate 2</span>
            <strong>GenVM AI Consensus</strong>
          </div>
          <div className="ww-radar-seq-arrow">
            <ArrowRight size={16} />
          </div>
          <div className="ww-radar-seq-node">
            <span style={{ color: 'var(--ww-emerald)' }}>Gate 3</span>
            <strong>Guardian Sovereign Seal</strong>
          </div>
          <div className="ww-radar-seq-arrow">
            <ArrowRight size={16} />
          </div>
          <div className="ww-radar-seq-node">
            <span style={{ color: 'var(--ww-emerald)' }}>Final State</span>
            <strong>Active Epoch Canon</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
