import test from 'node:test';
import assert from 'node:assert/strict';

// Core lifecycle state helpers
export function getCodicilStatusTone(status: string): { label: string; tone: string } {
  switch (status) {
    case 'COVENANT_ACTIVE':
      return { label: 'Active Canon', tone: 'emerald' };
    case 'COUNCIL_CERTIFIED':
      return { label: 'Council Certified', tone: 'amber' };
    case 'COUNCIL_VETOED':
      return { label: 'Council Vetoed', tone: 'rose' };
    case 'CODICIL_PENDING':
      return { label: 'Awaiting Council', tone: 'blue' };
    case 'CONSENSUS_STALEMATE':
      return { label: 'Consensus Stalemate', tone: 'purple' };
    case 'SUPERSEDED_HISTORIC':
      return { label: 'Superseded', tone: 'slate' };
    default:
      return { label: status, tone: 'slate' };
  }
}

export function isCodicilAdjudicable(status: string): boolean {
  return status === 'CODICIL_PENDING' || status === 'CONSENSUS_STALEMATE';
}

export function isCodicilCommittable(status: string): boolean {
  return status === 'COUNCIL_CERTIFIED';
}

export function calculateRiskCategory(score: number): { label: string; color: string } {
  if (score <= 25) return { label: 'LOW THREAT', color: 'text-emerald-400' };
  if (score <= 65) return { label: 'ELEVATED RISK', color: 'text-amber-400' };
  return { label: 'CRITICAL BREACH', color: 'text-rose-400' };
}

test('DracoPact state and lifecycle rules', async (t) => {
  await t.test('correctly maps actionable codicil states', () => {
    assert.equal(isCodicilAdjudicable('CODICIL_PENDING'), true);
    assert.equal(isCodicilAdjudicable('CONSENSUS_STALEMATE'), true);
    assert.equal(isCodicilAdjudicable('COUNCIL_CERTIFIED'), false);
    assert.equal(isCodicilAdjudicable('COVENANT_ACTIVE'), false);

    assert.equal(isCodicilCommittable('COUNCIL_CERTIFIED'), true);
    assert.equal(isCodicilCommittable('CODICIL_PENDING'), false);
    assert.equal(isCodicilCommittable('COUNCIL_VETOED'), false);
  });

  await t.test('correctly assigns visual tones for protocol verdicts', () => {
    assert.equal(getCodicilStatusTone('COVENANT_ACTIVE').tone, 'emerald');
    assert.equal(getCodicilStatusTone('COUNCIL_CERTIFIED').tone, 'amber');
    assert.equal(getCodicilStatusTone('COUNCIL_VETOED').tone, 'rose');
    assert.equal(getCodicilStatusTone('CODICIL_PENDING').tone, 'blue');
  });

  await t.test('classifies risk thermometer thresholds accurately', () => {
    assert.equal(calculateRiskCategory(10).label, 'LOW THREAT');
    assert.equal(calculateRiskCategory(45).label, 'ELEVATED RISK');
    assert.equal(calculateRiskCategory(85).label, 'CRITICAL BREACH');
  });
});
