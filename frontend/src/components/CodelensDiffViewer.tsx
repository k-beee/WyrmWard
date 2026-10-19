import React from 'react';
import { ActionItem } from '../types';
import { AlertTriangle, CheckCircle, ArrowRight, Layers, ArrowUpRight } from 'lucide-react';

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
    <div className="bg-[#0b0d14] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
      {/* Header Bar */}
      <div className="bg-[#10131d] px-5 py-3.5 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5 text-white font-medium text-xs">
          <Layers className="w-4 h-4 text-orange-400" />
          <span>Deterministic Manifest Equivalence Engine</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {divergenceFlags.length === 0 ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Zero Calldata Drift
            </span>
          ) : (
            divergenceFlags.map((flag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {flag}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Comparison Rows */}
      <div className="p-5 space-y-4">
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0f121c] border border-white/5"
            >
              {/* Baseline Side */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
                    Current Active Canon (Action #{idx + 1})
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    Baseline
                  </span>
                </div>

                {base ? (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-[#141724] border border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase font-sans">Target Contract</div>
                      <div className="text-slate-200 truncate mt-0.5" title={base.target}>{base.target}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-[#141724] border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-sans">Selector</div>
                        <div className="text-slate-200 mt-0.5">{base.selector}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#141724] border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-sans">Spending Limit</div>
                        <div className="text-emerald-400 font-bold mt-0.5">
                          {base.amount.toLocaleString()} DAI
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141724] border border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase font-sans">Beneficiary Recipient</div>
                      <div className="text-slate-200 truncate mt-0.5" title={base.recipient}>{base.recipient}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-lg bg-[#141724]/50 border border-dashed border-white/10 text-slate-500 text-center italic text-xs">
                    Operation added in proposed amendment
                  </div>
                )}
              </div>

              {/* Revised Side */}
              <div className="space-y-2.5 border-t md:border-t-0 md:border-l md:pl-4 border-white/5 pt-3 md:pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider font-sans">
                    Proposed Amendment (Action #{idx + 1})
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono">
                    Revision
                  </span>
                </div>

                {rev ? (
                  <div className="space-y-2 text-xs font-mono">
                    <div className={`p-2.5 rounded-lg border transition-all ${
                      isTargetMutated
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                        : 'bg-[#141724] border-white/5 text-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-sans">Target Contract</span>
                        {isTargetMutated && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                            MUTATED
                          </span>
                        )}
                      </div>
                      <div className="truncate mt-0.5" title={rev.target}>{rev.target}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2.5 rounded-lg border transition-all ${
                        isSelectorMutated
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                          : 'bg-[#141724] border-white/5 text-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-sans">Selector</span>
                          {isSelectorMutated && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                              CHANGED
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5">{rev.selector}</div>
                      </div>

                      <div className={`p-2.5 rounded-lg border transition-all ${
                        isAmountMutated
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                          : 'bg-[#141724] border-white/5 text-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-sans">Spending Limit</span>
                          {isAmountMutated && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                              DELTA
                            </span>
                          )}
                        </div>
                        <div className={`font-bold mt-0.5 ${isAmountMutated ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {rev.amount.toLocaleString()} DAI
                        </div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-lg border transition-all ${
                      isRecipientMutated
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                        : 'bg-[#141724] border-white/5 text-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-sans">Beneficiary Recipient</span>
                        {isRecipientMutated && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                            MUTATED
                          </span>
                        )}
                      </div>
                      <div className="truncate mt-0.5" title={rev.recipient}>{rev.recipient}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-lg bg-rose-950/10 border border-dashed border-rose-500/20 text-rose-400 text-center italic text-xs">
                    Operation removed in proposed amendment
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
