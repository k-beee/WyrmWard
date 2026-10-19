import React from 'react';
import { Sparkles, ShieldAlert, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export interface ProposalPreset {
  id: string;
  title: string;
  type: 'honest_expansion' | 'covert_hijack' | 'editorial_note';
  badge: string;
  badgeClass: string;
  description: string;
  revisedProse: string;
  changelog: string;
  manifestJson: string;
}

interface Props {
  onSelect: (preset: ProposalPreset) => void;
}

export const PROPOSAL_PRESETS: ProposalPreset[] = [
  {
    id: 'honest_grant',
    title: 'Disclosed Infrastructure Grant Expansion',
    type: 'honest_expansion',
    badge: 'BENIGN EXPANSION',
    badgeClass: 'emerald',
    description: 'Expands security review allocation from 50k to 75k for zero-knowledge bridge formal audits. Full disclosure included in changelog.',
    revisedProse:
      'The Dragon Council establishes an expanded capital expenditure limit of 75,000 DAI dedicated to security audits and formal verification of core protocol adapters, accounting for additional L2 integrations.',
    changelog:
      'Transparent disclosure: expanding budget cap from 50,000 to 75,000 units to fund formal verification and fuzzing for ZK rollup bridges.',
    manifestJson: JSON.stringify(
      [
        {
          target: '0x1111111111111111111111111111111111111111',
          selector: '0xa9059cbb',
          recipient: '0x2222222222222222222222222222222222222222',
          asset: '0x3333333333333333333333333333333333333333',
          value: 0,
          amount: 75000,
        },
      ],
      null,
      2
    ),
  },
  {
    id: 'covert_hijack',
    title: 'Deceptive Scope Creep & Recipient Hijack',
    type: 'covert_hijack',
    badge: 'COVERT ATTACK TEST',
    badgeClass: 'ember',
    description: 'Proposer claims "minor formatting cleanups", but quietly switches recipient to an unapproved address and expands budget to 120k.',
    revisedProse:
      'The Dragon Council establishes an updated expenditure schedule of 120,000 units for auxiliary development partners, routable at committee discretion.',
    changelog:
      'Minor grammatical formatting cleanup and punctuation fixes for clarity across clauses.',
    manifestJson: JSON.stringify(
      [
        {
          target: '0x1111111111111111111111111111111111111111',
          selector: '0xa9059cbb',
          recipient: '0x9999999999999999999999999999999999999999',
          asset: '0x3333333333333333333333333333333333333333',
          value: 0,
          amount: 120000,
        },
      ],
      null,
      2
    ),
  },
  {
    id: 'editorial_clarification',
    title: 'Editorial Clarification (Zero Calldata Drift)',
    type: 'editorial_note',
    badge: 'EDITORIAL ZERO-DRIFT',
    badgeClass: 'amber',
    description: 'Refines phrasing and legal definitions without modifying executable transaction parameters or recipient allocations.',
    revisedProse:
      'The Dragon Council establishes an initial capital expenditure limit of 50,000 DAI dedicated exclusively to independent third-party smart contract audits, rigorous formal verification, and automated cryptographic fuzzing.',
    changelog:
      'Clarifying mandate definition to explicitly enumerate independent third-party audits and automated fuzzing pipelines. Zero financial delta.',
    manifestJson: JSON.stringify(
      [
        {
          target: '0x1111111111111111111111111111111111111111',
          selector: '0xa9059cbb',
          recipient: '0x2222222222222222222222222222222222222222',
          asset: '0x3333333333333333333333333333333333333333',
          value: 0,
          amount: 50000,
        },
      ],
      null,
      2
    ),
  },
];

export const ProposalPresets: React.FC<Props> = ({ onSelect }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      {PROPOSAL_PRESETS.map((preset) => (
        <div
          key={preset.id}
          onClick={() => onSelect(preset)}
          style={{
            background: 'var(--ww-bg-surface)',
            border: '1px solid var(--ww-border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            transition: 'all 0.2s',
          }}
          className="ww-card-hover"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`ww-badge ${preset.badgeClass}`}>
              {preset.badge}
            </span>
            <Sparkles size={14} color="var(--ww-ember)" />
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              {preset.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ww-text-muted)', lineHeight: 1.5 }}>
              {preset.description}
            </p>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--ww-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--ww-ember)', fontWeight: 600 }}>
            <span>Load Template</span>
            <ArrowRight size={13} />
          </div>
        </div>
      ))}
    </div>
  );
};
