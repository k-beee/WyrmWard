import React from 'react';
import { ActionItem } from '../types';
import { AlertTriangle, CheckCircle, Layers } from 'lucide-react';

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
    <div className="ww-diff-viewer">
      {/* Header Bar */}
      <div className="ww-diff-header">
        <div className="ww-diff-header-title">
          <Layers size={16} color="var(--ww-ember)" />
          <span>Deterministic Manifest Equivalence Engine</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {divergenceFlags.length === 0 ? (
            <span className="ww-badge emerald">
              <CheckCircle size={13} /> Zero Calldata Drift
            </span>
          ) : (
            divergenceFlags.map((flag, idx) => (
              <span key={idx} className="ww-badge amber">
                <AlertTriangle size={13} /> {flag}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Comparison Rows */}
      <div className="ww-diff-body">
        {Array.from({ length: maxRows }).map((_, idx) => {
          const base = baselineActions[idx];
          const rev = revisedActions[idx];

          const isTargetMutated = Boolean(base && rev && base.target !== rev.target);
          const isSelectorMutated = Boolean(base && rev && base.selector !== rev.selector);
          const isRecipientMutated = Boolean(base && rev && base.recipient !== rev.recipient);
          const isAmountMutated = Boolean(base && rev && (base.value !== rev.value || base.amount !== rev.amount));

          return (
            <div key={idx} className="ww-diff-row">
              {/* Baseline Side */}
              <div className="ww-diff-col">
                <div className="ww-diff-col-header">
                  <span>Current Active Canon (Action #{idx + 1})</span>
                  <span className="ww-badge emerald" style={{ fontSize: '10px' }}>
                    Baseline
                  </span>
                </div>

                {base ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="ww-diff-field">
                      <div className="ww-diff-field-label">Target Contract</div>
                      <div style={{ wordBreak: 'break-all', color: '#fff' }} title={base.target}>
                        {base.target}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="ww-diff-field">
                        <div className="ww-diff-field-label">Selector</div>
                        <div style={{ color: '#fff' }}>{base.selector}</div>
                      </div>
                      <div className="ww-diff-field">
                        <div className="ww-diff-field-label">Spending Limit</div>
                        <div style={{ color: 'var(--ww-emerald)', fontWeight: 700 }}>
                          {base.amount.toLocaleString()} DAI
                        </div>
                      </div>
                    </div>

                    <div className="ww-diff-field">
                      <div className="ww-diff-field-label">Beneficiary Recipient</div>
                      <div style={{ wordBreak: 'break-all', color: '#fff' }} title={base.recipient}>
                        {base.recipient}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ww-diff-empty-slot">Operation added in proposed amendment</div>
                )}
              </div>

              {/* Revised Side */}
              <div className="ww-diff-col">
                <div className="ww-diff-col-header">
                  <span style={{ color: 'var(--ww-ember)' }}>Proposed Amendment (Action #{idx + 1})</span>
                  <span className="ww-badge amber" style={{ fontSize: '10px' }}>
                    Revision
                  </span>
                </div>

                {rev ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className={`ww-diff-field ${isTargetMutated ? 'mutated' : ''}`}>
                      <div className="ww-diff-field-label">
                        <span>Target Contract</span>
                        {isTargetMutated && (
                          <span className="ww-badge ember" style={{ fontSize: '9px', padding: '1px 5px' }}>
                            MUTATED
                          </span>
                        )}
                      </div>
                      <div style={{ wordBreak: 'break-all' }} title={rev.target}>
                        {rev.target}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className={`ww-diff-field ${isSelectorMutated ? 'mutated' : ''}`}>
                        <div className="ww-diff-field-label">
                          <span>Selector</span>
                          {isSelectorMutated && (
                            <span className="ww-badge ember" style={{ fontSize: '9px', padding: '1px 5px' }}>
                              CHANGED
                            </span>
                          )}
                        </div>
                        <div>{rev.selector}</div>
                      </div>

                      <div className={`ww-diff-field ${isAmountMutated ? 'amount-mutated' : ''}`}>
                        <div className="ww-diff-field-label">
                          <span>Spending Limit</span>
                          {isAmountMutated && (
                            <span className="ww-badge amber" style={{ fontSize: '9px', padding: '1px 5px' }}>
                              DELTA
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, color: isAmountMutated ? 'var(--ww-gold)' : 'var(--ww-emerald)' }}>
                          {rev.amount.toLocaleString()} DAI
                        </div>
                      </div>
                    </div>

                    <div className={`ww-diff-field ${isRecipientMutated ? 'mutated' : ''}`}>
                      <div className="ww-diff-field-label">
                        <span>Beneficiary Recipient</span>
                        {isRecipientMutated && (
                          <span className="ww-badge ember" style={{ fontSize: '9px', padding: '1px 5px' }}>
                            MUTATED
                          </span>
                        )}
                      </div>
                      <div style={{ wordBreak: 'break-all' }} title={rev.recipient}>
                        {rev.recipient}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ww-diff-empty-slot" style={{ color: 'var(--ww-crimson)' }}>
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
