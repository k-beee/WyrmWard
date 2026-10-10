import React from 'react';
import { ActionItem } from '../types';
import { AlertTriangle, CheckCircle, ArrowRight, Layers } from 'lucide-react';

interface Props {
  baselineActions: ActionItem[];
  revisedActions: ActionItem[];
  divergenceFlags?: string[];
}

export const CodelensDiffViewer: React.FC<Props> = ({
  baselineActions,
  revisedActions,
  divergenceFlags = [],
}) => {
  const maxRows = Math.max(baselineActions.length, revisedActions.length);

  return (
    <div className="bg-[#0e1118] border border-white/5 rounded-xl overflow-hidden text-xs font-mono">
      {/* Header Bar */}
      <div className="bg-[#141722] px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300 font-sans font-medium text-xs">
          <Layers className="w-3.5 h-3.5 text-orange-400" />
          <span>Executable Calldata Manifest Comparison</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {divergenceFlags.length === 0 ? (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Zero Calldata Drift
            </span>
          ) : (
            divergenceFlags.map((flag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] flex items-center gap-1 font-semibold"
              >
                <AlertTriangle className="w-2.5 h-2.5" /> {flag}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Action Table */}
      <div className="overflow-x-auto p-4 space-y-3">
        {Array.from({ length: maxRows }).map((_, idx) => {
          const base = baselineActions[idx];
          const rev = revisedActions[idx];

          const isTargetMutated = base && rev && base.target !== rev.target;
          const isSelectorMutated = base && rev && base.selector !== rev.selector;
          const isRecipientMutated = base && rev && base.recipient !== rev.recipient;
          const isAmountMutated = base && rev && (base.value !== rev.value || base.amount !== rev.amount);

          return (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-[#12151f] border border-white/5"
            >
              {/* Baseline Side */}
              <div className="space-y-1">
                <div className="text-[10px] font-sans text-slate-400 uppercase tracking-wider font-semibold">
                  Epoch Active Canon (Action #{idx + 1})
                </div>
                {base ? (
                  <div className="space-y-1 text-slate-300">
                    <div className="truncate">
                      <span className="text-slate-500">Target:</span> {base.target}
                    </div>
                    <div>
                      <span className="text-slate-500">Selector:</span> {base.selector}
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500">Recipient:</span> {base.recipient}
                    </div>
                    <div>
                      <span className="text-slate-500">Amount / Value:</span>{' '}
                      <span className="text-amber-400">{base.amount.toLocaleString()} units</span>{' '}
                      ({base.value} wei)
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 italic">None (Action added in revision)</div>
                )}
              </div>

              {/* Revised Side */}
              <div className="space-y-1 border-t md:border-t-0 md:border-l md:pl-3 border-white/5 pt-2 md:pt-0">
                <div className="text-[10px] font-sans text-orange-400 uppercase tracking-wider font-semibold">
                  Proposed Codicil (Action #{idx + 1})
                </div>
                {rev ? (
                  <div className="space-y-1 text-slate-300">
                    <div className={`truncate ${isTargetMutated ? 'text-rose-400 font-bold bg-rose-950/20 px-1 rounded' : ''}`}>
                      <span className="text-slate-500">Target:</span> {rev.target}
                    </div>
                    <div className={isSelectorMutated ? 'text-rose-400 font-bold bg-rose-950/20 px-1 rounded' : ''}>
                      <span className="text-slate-500">Selector:</span> {rev.selector}
                    </div>
                    <div className={`truncate ${isRecipientMutated ? 'text-rose-400 font-bold bg-rose-950/20 px-1 rounded' : ''}`}>
                      <span className="text-slate-500">Recipient:</span> {rev.recipient}
                    </div>
                    <div className={isAmountMutated ? 'text-rose-400 font-bold bg-rose-950/20 px-1 rounded' : ''}>
                      <span className="text-slate-500">Amount / Value:</span>{' '}
                      <span className={isAmountMutated ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                        {rev.amount.toLocaleString()} units
                      </span>{' '}
                      ({rev.value} wei)
                    </div>
                  </div>
                ) : (
                  <div className="text-rose-400 italic">Action removed in revision</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
