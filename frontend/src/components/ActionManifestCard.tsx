import React, { useState } from 'react';
import { ActionItem } from '../types';
import { Copy, Check, Shield, Coins } from 'lucide-react';

interface Props {
  actions: ActionItem[];
  title?: string;
}

export const ActionManifestCard: React.FC<Props> = ({ actions }) => {
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
      <div
        style={{
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--ww-bg-surface)',
          border: '1px solid var(--ww-border-subtle)',
          textAlign: 'center',
          color: 'var(--ww-text-dim)',
          fontSize: '13px',
        }}
      >
        No executable actions defined for this covenant.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {actions.map((action, idx) => {
        const isTransfer = action.selector === '0xa9059cbb';
        return (
          <div
            key={idx}
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'var(--ww-bg-surface)',
              border: '1px solid var(--ww-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Action Top Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--ww-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 100, 61, 0.1)',
                    color: 'var(--ww-ember)',
                    fontFamily: 'var(--ww-font-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  #{idx + 1}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  {isTransfer ? 'Treasury Asset Disbursement' : 'Smart Contract Invocation'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--ww-cyan)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: '11px',
                    fontFamily: 'var(--ww-font-mono)',
                  }}
                >
                  {isTransfer ? 'transfer(address, uint256)' : `selector: ${action.selector}`}
                </span>
                <span className="ww-badge emerald" style={{ fontSize: '10px' }}>
                  Active Invariant
                </span>
              </div>
            </div>

            {/* Key Value Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {/* Authorized Amount */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#090c14',
                  border: '1px solid var(--ww-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ww-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coins size={14} color="var(--ww-gold)" />
                  <span>Authorized Spending Cap</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--ww-font-mono)', color: 'var(--ww-gold)' }}>
                  {action.amount.toLocaleString()} <span style={{ fontSize: '12px', color: 'var(--ww-text-dim)', fontWeight: 400 }}>DAI / Units</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ww-text-dim)', fontFamily: 'var(--ww-font-mono)' }}>
                  Native Value: {action.value} wei
                </div>
              </div>

              {/* Target Contract */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#090c14',
                  border: '1px solid var(--ww-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ww-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="var(--ww-cyan)" />
                  <span>Target Contract</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--ww-font-mono)', fontSize: '12px', color: '#fff' }} title={action.target}>
                    {formatAddress(action.target)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`target-${idx}`, action.target)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--ww-text-dim)', cursor: 'pointer', padding: '4px' }}
                    title="Copy full address"
                  >
                    {copiedKey === `target-${idx}` ? <Check size={14} color="var(--ww-emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ww-text-dim)', fontFamily: 'var(--ww-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Asset: {formatAddress(action.asset)}
                </div>
              </div>
            </div>

            {/* Beneficiary Recipient Bar */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: '#090c14',
                border: '1px solid var(--ww-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--ww-text-dim)', fontWeight: 600 }}>Designated Beneficiary:</span>
                <span style={{ fontFamily: 'var(--ww-font-mono)', color: '#fff' }} title={action.recipient}>
                  {action.recipient}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`recp-${idx}`, action.recipient)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'var(--ww-bg-surface)',
                  border: '1px solid var(--ww-border-subtle)',
                  color: 'var(--ww-text-muted)',
                  fontSize: '11px',
                  fontFamily: 'var(--ww-font-mono)',
                  cursor: 'pointer',
                }}
              >
                {copiedKey === `recp-${idx}` ? (
                  <>
                    <Check size={12} color="var(--ww-emerald)" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
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
