import React from 'react';
import { Sparkles, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export interface ScenarioPreset {
  id: string;
  title: string;
  type: 'honest_expansion' | 'covert_hijack' | 'editorial_note';
  badge: string;
  badgeColor: string;
  description: string;
  revisedProse: string;
  changelog: string;
  manifestJson: string;
}

interface Props {
  onSelect: (scenario: ScenarioPreset) => void;
}

export const MOCK_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'honest_grant',
    title: 'Disclosed Infrastructure Grant Expansion',
    type: 'honest_expansion',
    badge: 'BENIGN EXPANSION',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Expands security review allocation from 50k to 75k for zero-knowledge bridge formal audits. Full disclosure included.',
    revisedProse:
      'Official Security Guild Treasury Covenant v1.1. Expanding our security reviews to include multi-validator consensus testing, automated fuzzing pipelines, and zero-knowledge bridge audits. All actions require multi-validator consensus before disbursement.',
    changelog:
      'Transparent disclosure: expanding budget cap from 50,000 to 75,000 units to fund formal verification and fuzzing for ZK rollup bridges.',
    manifestJson: JSON.stringify(
      [
        {
          target: '0x1111111111111111111111111111111111111111',
          selector: '0xa9059cbb',
          recipient: '0x2222222222222222222222222222222222222222',
          asset: '0x0000000000000000000000000000000000000000',
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
    badge: 'COVERT ATTACK',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    description: 'Proposer claims "minor formatting cleanups", but quietly switches recipient to an offshore multisig and doubles budget to 100k.',
    revisedProse:
      'Official Security Guild Treasury Covenant v1.0. All expenditures must be allocated toward independent smart contract reviews. Disbursements may be routed to auxiliary councils at discretion.',
    changelog:
      'Minor grammatical formatting cleanup and punctuation fixes for clarity.',
    manifestJson: JSON.stringify(
      [
        {
          target: '0x1111111111111111111111111111111111111111',
          selector: '0xa9059cbb',
          recipient: '0x9999999999999999999999999999999999999999',
          asset: '0x0000000000000000000000000000000000000000',
          value: 0,
          amount: 100000,
        },
      ],
      null,
      2
    ),
  },
  {
    id: 'editorial_polish',
    title: 'Harmless Editorial Documentation Polish',
    type: 'editorial_note',
    badge: 'EDITORIAL ONLY',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Clarifies IPFS publication guidelines with zero calldata changes and zero budget modifications.',
    revisedProse:
      'Official Security Guild Treasury Covenant v1.0. All expenditures must be allocated toward independent smart contract security reviews, formal verification, and emergency incident mitigation. All actions require multi-validator consensus before disbursement. Note: Guild security leads coordinate reviews.',
    changelog:
      'Editorial only: Added informational note specifying that guild security leads coordinate reviews. Zero changes to budget, recipients, or governance authority.',
    manifestJson: JSON.stringify(
      [
        {
          target: '0x1111111111111111111111111111111111111111',
          selector: '0xa9059cbb',
          recipient: '0x2222222222222222222222222222222222222222',
          asset: '0x0000000000000000000000000000000000000000',
          value: 0,
          amount: 50000,
        },
      ],
      null,
      2
    ),
  },
];

export const MockScenarios: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="bg-[#10131a] border border-white/5 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">One-Click Realistic Governance Presets</h3>
        </div>
        <span className="text-[11px] text-slate-400">Click any preset to auto-populate the codicil draft form</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MOCK_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            className="p-3.5 rounded-xl text-left bg-[#141722] hover:bg-[#181d2c] border border-white/5 hover:border-orange-500/30 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${scenario.badgeColor}`}>
                  {scenario.badge}
                </span>
                <span className="text-[10px] text-orange-400 group-hover:translate-x-0.5 transition-transform font-medium">
                  Load &rarr;
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors mb-1">
                {scenario.title}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {scenario.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
