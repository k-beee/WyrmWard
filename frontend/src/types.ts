export interface ActionItem {
  target: string;
  selector: string;
  recipient: string;
  asset: string;
  value: number;
  amount: number;
}

export type CovenantStatus = 'COVENANT_ACTIVE' | 'SUPERSEDED_HISTORIC';

export type CodicilStatus =
  | 'CODICIL_PENDING'
  | 'COUNCIL_CERTIFIED'
  | 'COUNCIL_VETOED'
  | 'CONSENSUS_STALEMATE'
  | 'COVENANT_ACTIVE'
  | 'SUPERSEDED_HISTORIC';

export interface CovenantRecord {
  covenant_id: number;
  guardian: string;
  name: string;
  domain: string;
  status: CovenantStatus;
  current_epoch: number;
  active_codicil_id: number;
  codicil_history: number[];
  created_at: number;
}

export interface CodicilRecord {
  codicil_id: number;
  covenant_id: number;
  epoch_number: number;
  parent_codicil_id: number;
  parent_prose_hash: string;
  parent_manifest_hash: string;
  proposer: string;
  covenant_prose: string;
  prose_hash: string;
  changelog_disclosure: string;
  actions: ActionItem[];
  manifest_hash: string;
  divergence_flags: string[];
  status: CodicilStatus;
  verdict_ids: number[];
  created_at: number;
  enacted_at: number;
}

export interface VerdictRecord {
  verdict_id: number;
  covenant_id: number;
  codicil_id: number;
  adjudicator_caller: string;
  assessment: 'CERTIFIED_BENIGN' | 'BREACH_VETOED' | 'EDITORIAL_APPROVED' | 'AMBIGUOUS_REJECTED' | 'CONSENSUS_STALEMATE';
  threat_tags: string[];
  disclosure_integrity: boolean;
  scope_broadened: boolean;
  risk_score: number;
  action_diff_present: boolean;
  action_diff_disclosed: boolean;
  final_status: CodicilStatus;
  reason: string;
  created_at: number;
}

export interface ProtocolTelemetry {
  covenants: number;
  codicils: number;
  verdicts: number;
}

export interface ProtocolMetadata {
  protocol_name: string;
  version: number;
  architecture: string;
  custodial_funds: boolean;
  constructor_privileges: boolean;
  enactment_guard: string;
  risk_scoring: string;
}
