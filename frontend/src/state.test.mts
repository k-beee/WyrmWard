import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCodicilStatusTone,
  isCodicilAdjudicable,
  isCodicilCommittable,
  calculateRiskCategory,
} from './helpers.ts';

describe('DracoPact state and lifecycle rules', () => {
  it('correctly maps actionable codicil states', () => {
    assert.equal(isCodicilAdjudicable('CODICIL_PENDING'), true);
    assert.equal(isCodicilAdjudicable('CONSENSUS_STALEMATE'), true);
    assert.equal(isCodicilAdjudicable('COUNCIL_CERTIFIED'), false);
    assert.equal(isCodicilAdjudicable('COVENANT_ACTIVE'), false);

    assert.equal(isCodicilCommittable('COUNCIL_CERTIFIED'), true);
    assert.equal(isCodicilCommittable('CODICIL_PENDING'), false);
    assert.equal(isCodicilCommittable('COUNCIL_VETOED'), false);
  });

  it('correctly assigns visual tones for protocol verdicts', () => {
    assert.equal(getCodicilStatusTone('COVENANT_ACTIVE').tone, 'emerald');
    assert.equal(getCodicilStatusTone('COUNCIL_CERTIFIED').tone, 'amber');
    assert.equal(getCodicilStatusTone('COUNCIL_VETOED').tone, 'rose');
    assert.equal(getCodicilStatusTone('CODICIL_PENDING').tone, 'blue');
  });

  it('classifies risk thermometer thresholds accurately', () => {
    assert.equal(calculateRiskCategory(10).label, 'LOW THREAT');
    assert.equal(calculateRiskCategory(45).label, 'ELEVATED RISK');
    assert.equal(calculateRiskCategory(85).label, 'CRITICAL BREACH');
  });
});
