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
