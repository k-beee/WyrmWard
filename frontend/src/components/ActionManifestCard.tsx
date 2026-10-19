import React, { useState } from 'react';
import { ActionItem } from '../types';
import { ArrowUpRight, Copy, Check, Shield, Layers, Coins } from 'lucide-react';

interface Props {
  actions: ActionItem[];
  title?: string;
}

export const ActionManifestCard: React.FC<Props> = ({ actions, title = 'Authorized Executable Actions' }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  if (!actions || actions.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#0f121a] border border-white/5 text-center text-slate-400 text-sm">
        No executable actions defined for this covenant.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action, idx) => {
        const isTransfer = action.selector === '0xa9059cbb';
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#0e111a] border border-white/5 hover:border-white/10 transition-all space-y-4 shadow-sm"
          >
            {/* Action Top Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 font-mono text-xs font-bold flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="text-sm font-semibold text-white">
                  {isTransfer ? 'Treasury Asset Disbursement' : 'Smart Contract Invocation'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono">
                  {isTransfer ? 'transfer(address, uint256)' : `selector: ${action.selector}`}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
                  Active Invariant
                </span>
              </div>
            </div>

            {/* Key Value Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Authorized Amount */}
              <div className="p-3.5 rounded-xl bg-[#141722] border border-white/5 space-y-1">
                <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Authorized Spending Cap</span>
                </div>
                <div className="text-xl font-bold font-mono text-amber-300">
                  {action.amount.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">DAI / Units</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Native Value: {action.value} wei</div>
              </div>

              {/* Target Contract */}
              <div className="p-3.5 rounded-xl bg-[#141722] border border-white/5 space-y-1">
                <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Target Contract</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-200" title={action.target}>
                    {formatAddress(action.target)}
                  </span>
                  <button
                    onClick={() => handleCopy(`target-${idx}`, action.target)}
                    className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy full address"
                  >
                    {copiedKey === `target-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  Asset: {formatAddress(action.asset)}
                </div>
              </div>
            </div>

            {/* Beneficiary Recipient Bar */}
            <div className="p-3 rounded-xl bg-[#12151f] border border-white/5 flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Designated Beneficiary:</span>
                <span className="font-mono text-slate-200" title={action.recipient}>
                  {action.recipient}
                </span>
              </div>
              <button
                onClick={() => handleCopy(`recp-${idx}`, action.recipient)}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 font-mono transition-all cursor-pointer"
              >
                {copiedKey === `recp-${idx}` ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
