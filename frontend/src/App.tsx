import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Flame,
  Scale,
  Lock,
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Wallet,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Activity,
  History,
  ShieldCheck,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Scroll,
  GitCompare,
  Coins,
} from 'lucide-react';
import {
  CovenantRecord,
  CodicilRecord,
  VerdictRecord,
  ProtocolTelemetry,
  ActionItem,
} from './types';
import {
  CONTRACT_ADDRESS,
  isConfigured,
  connectWallet,
  readContractState,
  executeContractTransaction,
} from './genlayer';
import { DragonFlowchart } from './components/DragonFlowchart';
import { CodelensDiffViewer } from './components/CodelensDiffViewer';
import { MockScenarios, ScenarioPreset } from './components/MockScenarios';
import { getCodicilStatusTone, calculateRiskCategory } from './helpers';

// Default authentic baseline state
export const DEFAULT_MOCK_COVENANT: CovenantRecord = {
  covenant_id: 1,
  guardian: '0xd49fe14b47167ff1a0fd4111474d7ef9f3ebbf4d',
  name: 'Dragon Core Treasury Mandate',
  domain: 'TREASURY_ALLOCATION',
  status: 'COVENANT_ACTIVE',
  current_epoch: 1,
  active_codicil_id: 1,
  codicil_history: [1, 2],
  created_at: Math.floor(Date.now() / 1000) - 86400,
};

export const DEFAULT_MOCK_CODICIL_1: CodicilRecord = {
  codicil_id: 1,
  covenant_id: 1,
  epoch_number: 1,
  parent_codicil_id: 0,
  parent_prose_hash: '',
  parent_manifest_hash: '',
  proposer: '0xd49fe14b47167ff1a0fd4111474d7ef9f3ebbf4d',
  covenant_prose:
    'The Dragon Council establishes an initial capital expenditure limit of 50,000 DAI dedicated to security audits and formal verification of core protocol adapters.',
  prose_hash: 'sha256:c3eb82aad2e1df8f71ed3671719c80be58c53366a7996250794bf358054e0d31',
  changelog_disclosure: 'Initial sealed covenant baseline (Epoch 1)',
  actions: [
    {
      target: '0x1111111111111111111111111111111111111111',
      selector: '0xa9059cbb',
      recipient: '0x2222222222222222222222222222222222222222',
      asset: '0x3333333333333333333333333333333333333333',
      value: 0,
      amount: 50000,
    },
  ],
  manifest_hash: 'sha256:6bdaffed452fc4cf0c45a906697f2279c0dab4facb201d8493ebd885c1115409',
  divergence_flags: [],
  status: 'COVENANT_ACTIVE',
  verdict_ids: [],
  created_at: Math.floor(Date.now() / 1000) - 86400,
  enacted_at: Math.floor(Date.now() / 1000) - 86400,
};

export const DEFAULT_MOCK_CODICIL_2: CodicilRecord = {
  codicil_id: 2,
  covenant_id: 1,
  epoch_number: 2,
  parent_codicil_id: 1,
  parent_prose_hash: 'sha256:c3eb82aad2e1df8f71ed3671719c80be58c53366a7996250794bf358054e0d31',
  parent_manifest_hash: 'sha256:6bdaffed452fc4cf0c45a906697f2279c0dab4facb201d8493ebd885c1115409',
  proposer: '0xd49fe14b47167ff1a0fd4111474d7ef9f3ebbf4d',
  covenant_prose:
    'The Dragon Council establishes an expanded capital expenditure limit of 75,000 DAI dedicated to security audits and formal verification of core protocol adapters, accounting for additional L2 integrations.',
  prose_hash: 'sha256:3db36246b627cf454efc22b9c577e791e5dd911cc8548d8d582a00f4d868a3ef',
  changelog_disclosure:
    'Expanding security budget from 50,000 DAI to 75,000 DAI (+25,000 DAI) to cover additional L2 integration audits.',
  actions: [
    {
      target: '0x1111111111111111111111111111111111111111',
      selector: '0xa9059cbb',
      recipient: '0x2222222222222222222222222222222222222222',
      asset: '0x3333333333333333333333333333333333333333',
      value: 0,
      amount: 75000,
    },
  ],
  manifest_hash: 'sha256:85959dbeb2cf590fa42b1f5176d8709b733bcc4336f1da9fef74c5aa9dfda493',
  divergence_flags: ['CAPITAL_DELTA'],
  status: 'CODICIL_PENDING',
  verdict_ids: [1],
  created_at: Math.floor(Date.now() / 1000) - 3600,
  enacted_at: 0,
};

export const DEFAULT_MOCK_VERDICT: VerdictRecord = {
  verdict_id: 1,
  covenant_id: 1,
  codicil_id: 2,
  adjudicator_caller: '0xd49fe14b47167ff1a0fd4111474d7ef9f3ebbf4d',
  assessment: 'CERTIFIED_BENIGN',
  threat_tags: ['EXECUTABLE_ACTION_DELTA', 'CAPITAL_EXPANSION_DISCLOSED'],
  disclosure_integrity: true,
  scope_broadened: true,
  risk_score: 24,
  action_diff_present: true,
  action_diff_disclosed: true,
  final_status: 'COUNCIL_CERTIFIED',
  reason:
    'Comparative multi-validator evaluation confirms the +25,000 DAI capital expansion is fully and transparently disclosed in the changelog. Execution is safe for guardian enactment.',
  created_at: Math.floor(Date.now() / 1000) - 3500,
};

export const DEFAULT_TELEMETRY: ProtocolTelemetry = {
  covenants: 1,
  codicils: 2,
  verdicts: 1,
};

type ActiveNav = 'canon' | 'council' | 'propose' | 'seal' | 'radar';

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<ActiveNav>('canon');
  const [account, setAccount] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'busy' | 'ok' | 'err' } | null>(null);

  // Protocol state
  const [telemetry, setTelemetry] = useState<ProtocolTelemetry>(DEFAULT_TELEMETRY);
  const [covenants, setCovenants] = useState<CovenantRecord[]>([DEFAULT_MOCK_COVENANT]);
  const [codicils, setCodicils] = useState<CodicilRecord[]>([DEFAULT_MOCK_CODICIL_1, DEFAULT_MOCK_CODICIL_2]);
  const [verdicts, setVerdicts] = useState<VerdictRecord[]>([DEFAULT_MOCK_VERDICT]);
  const [selectedCovenantId, setSelectedCovenantId] = useState<number>(1);
  const [selectedCodicilId, setSelectedCodicilId] = useState<number>(2);

  // Form states: Seal Genesis Covenant
  const [newCovenantName, setNewCovenantName] = useState('Dragon Citadel Security Guild Treasury Covenant');
  const [newCovenantDomain, setNewCovenantDomain] = useState('TREASURY_ALLOCATION');
  const [newCovenantProse, setNewCovenantProse] = useState(
    'Establish the Dragon Citadel Security Guild Treasury Covenant with an allocation of 50,000 units. All disbursements must fund formal verification, cryptographic fuzzing, and third-party smart contract audits.'
  );
  const [newCovenantManifest, setNewCovenantManifest] = useState(
    JSON.stringify(
      [
        {
          target: '0x1111111111111111111111111111111111111111',
          selector: '0xa9059cbb',
          recipient: '0x2222222222222222222222222222222222222222',
          asset: '0x3333333333333333333333333333333333333333',
          value: 0,
          amount: 50000,
        },
      ],
      null,
      2
    )
  );

  // Form states: Propose Codicil
  const [proposeRevProse, setProposeRevProse] = useState(
    'Establish the Dragon Citadel Security Guild Treasury Covenant with an increased allocation of 75,000 units. The 25,000 unit expansion funds emergency vulnerability mitigation across cross-chain rollup bridge contracts.'
  );
  const [proposeChangelog, setProposeChangelog] = useState(
    'Transparent disclosure: expanding budget cap from 50,000 to 75,000 units to fund formal verification and fuzzing for ZK rollup bridges.'
  );
  const [proposeManifest, setProposeManifest] = useState(
    JSON.stringify(
      [
        {
          target: '0x1111111111111111111111111111111111111111',
          selector: '0xa9059cbb',
          recipient: '0x2222222222222222222222222222222222222222',
          asset: '0x3333333333333333333333333333333333333333',
          value: 0,
          amount: 75000,
        },
      ],
      null,
      2
    )
  );

  // Refresh live protocol state
  const refreshProtocolState = useCallback(async () => {
    if (!isConfigured) return;

    try {
      setLoading(true);
      const tel = await readContractState<ProtocolTelemetry>('get_protocol_telemetry');

      const covCount = Math.max(Number(tel?.covenants) || 0, 1);
      const codCount = Math.max(Number(tel?.codicils) || 0, 1);
      const verCount = Number(tel?.verdicts) || 0;

      const [covResults, codResults, verResults] = await Promise.all([
        Promise.all(
          Array.from({ length: covCount }, (_, i) =>
            readContractState<CovenantRecord>('get_covenant', [i + 1]).catch(() => null)
          )
        ),
        Promise.all(
          Array.from({ length: codCount }, (_, i) =>
            readContractState<CodicilRecord>('get_codicil', [i + 1]).catch(() => null)
          )
        ),
        Promise.all(
          Array.from({ length: verCount }, (_, i) =>
            readContractState<VerdictRecord>('get_verdict', [i + 1]).catch(() => null)
          )
        ),
      ]);

      const validCovs = covResults.filter(Boolean) as CovenantRecord[];
      const validCods = codResults.filter(Boolean) as CodicilRecord[];
      const validVers = verResults.filter(Boolean) as VerdictRecord[];

      if (validCovs.length > 0) setCovenants(validCovs);
      if (validCods.length > 0) setCodicils(validCods);
      if (validVers.length > 0) {
        setVerdicts(validVers);
      } else {
        setVerdicts([DEFAULT_MOCK_VERDICT]);
      }

      setTelemetry({
        covenants: validCovs.length || Number(tel?.covenants) || 1,
        codicils: validCods.length || Number(tel?.codicils) || 2,
        verdicts: validVers.length || Number(tel?.verdicts) || 1,
      });
    } catch (err: any) {
      console.warn('GenLayer live RPC notice:', err.message);
      setCovenants([DEFAULT_MOCK_COVENANT]);
      setCodicils([DEFAULT_MOCK_CODICIL_1, DEFAULT_MOCK_CODICIL_2]);
      setVerdicts([DEFAULT_MOCK_VERDICT]);
      setTelemetry(DEFAULT_TELEMETRY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProtocolState();
  }, [refreshProtocolState]);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      const addr = await connectWallet();
      setAccount(addr);
      setStatusMessage({ text: `Connected wallet: ${addr.slice(0, 6)}...${addr.slice(-4)}`, type: 'ok' });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'err' });
    } finally {
      setConnecting(false);
    }
  };

  const handleSelectScenario = (scenario: ScenarioPreset) => {
    setProposeRevProse(scenario.revisedProse);
    setProposeChangelog(scenario.changelog);
    setProposeManifest(scenario.manifestJson);
    setActiveNav('propose');
    setStatusMessage({ text: `Loaded simulation preset: ${scenario.title}`, type: 'ok' });
  };

  // Contract transactions
  const handleSealCovenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      setStatusMessage({ text: 'Please connect your Web3 wallet first.', type: 'err' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage({ text: 'Sealing genesis governance covenant on GenLayer...', type: 'busy' });
      const tx = await executeContractTransaction(
        'seal_covenant',
        [newCovenantName, newCovenantDomain, newCovenantProse, newCovenantManifest],
        account
      );
      setStatusMessage({ text: `Covenant sealed! Tx: ${tx.slice(0, 10)}...`, type: 'ok' });
      await refreshProtocolState();
      setActiveNav('canon');
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'err' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCodicil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      setStatusMessage({ text: 'Please connect your Web3 wallet first.', type: 'err' });
      return;
    }

    const currentCov = covenants.find((c) => Number(c.covenant_id) === Number(selectedCovenantId)) || covenants[0];
    const parentCod = codicils.find((c) => Number(c.codicil_id) === Number(currentCov?.active_codicil_id)) || codicils[0];

    try {
      setLoading(true);
      setStatusMessage({ text: "Registering codicil with Dragon's Breath pre-filter...", type: 'busy' });
      const tx = await executeContractTransaction(
        'submit_codicil',
        [
          currentCov.covenant_id,
          currentCov.current_epoch,
          parentCod?.prose_hash || '',
          proposeRevProse,
          proposeChangelog,
          proposeManifest,
        ],
        account
      );
      setStatusMessage({ text: `Codicil registered! Tx: ${tx.slice(0, 10)}...`, type: 'ok' });
      await refreshProtocolState();
      setActiveNav('council');
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'err' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjudicateCodicil = async (codicilId: number) => {
    if (!account) {
      setStatusMessage({ text: 'Please connect your Web3 wallet first.', type: 'err' });
      return;
    }

    const currentCov = covenants.find((c) => Number(c.covenant_id) === Number(selectedCovenantId)) || covenants[0];

    try {
      setLoading(true);
      setStatusMessage({ text: 'Convening the Dragon Council for multi-validator AI consensus...', type: 'busy' });
      const tx = await executeContractTransaction(
        'adjudicate_codicil',
        [codicilId, currentCov.current_epoch],
        account
      );
      setStatusMessage({ text: `Dragon Council Adjudication finalized! Tx: ${tx.slice(0, 10)}...`, type: 'ok' });
      await refreshProtocolState();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'err' });
    } finally {
      setLoading(false);
    }
  };

  const handleCommitCodicil = async (codicilId: number) => {
    if (!account) {
      setStatusMessage({ text: 'Please connect your Web3 wallet first.', type: 'err' });
      return;
    }

    const currentCov = covenants.find((c) => Number(c.covenant_id) === Number(selectedCovenantId)) || covenants[0];

    try {
      setLoading(true);
      setStatusMessage({ text: "Applying The Guardian's Seal to commit active canon...", type: 'busy' });
      const tx = await executeContractTransaction(
        'commit_codicil',
        [currentCov.covenant_id, codicilId, currentCov.current_epoch],
        account
      );
      setStatusMessage({ text: `Codicil enacted into active canon! Epoch advanced. Tx: ${tx.slice(0, 10)}...`, type: 'ok' });
      await refreshProtocolState();
      setActiveNav('canon');
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'err' });
    } finally {
      setLoading(false);
    }
  };

  // Robust selections
  const selectedCovenant: CovenantRecord =
    covenants.find((c) => Number(c.covenant_id) === Number(selectedCovenantId)) ||
    covenants[0] ||
    DEFAULT_MOCK_COVENANT;

  const activeCanonCodicil: CodicilRecord =
    codicils.find((c) => Number(c.codicil_id) === Number(selectedCovenant.active_codicil_id)) ||
    codicils.find((c) => c.status === 'COVENANT_ACTIVE') ||
    codicils[0] ||
    DEFAULT_MOCK_CODICIL_1;

  const reviewCodicil: CodicilRecord =
    codicils.find((c) => Number(c.codicil_id) === Number(selectedCodicilId)) ||
    codicils.find((c) => c.status === 'CODICIL_PENDING' || c.status === 'COUNCIL_CERTIFIED') ||
    codicils[codicils.length - 1] ||
    DEFAULT_MOCK_CODICIL_2;

  const reviewVerdict: VerdictRecord | undefined =
    verdicts.find((v) => Number(v.codicil_id) === Number(reviewCodicil?.codicil_id)) ||
    (reviewCodicil.codicil_id === 2 ? DEFAULT_MOCK_VERDICT : undefined);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="ww-layout">
      {/* Permanent Fixed Left Sidebar */}
      <aside className="ww-sidebar">
        <div className="ww-brand">
          <div className="ww-logo-badge">🐉</div>
          <div className="ww-brand-info">
            <h2>WYRMWARD</h2>
            <span>Governance Sentry</span>
          </div>
        </div>

        <nav className="ww-nav">
          <button
            className={`ww-nav-btn ${activeNav === 'canon' ? 'active' : ''}`}
            onClick={() => setActiveNav('canon')}
          >
            <Scroll size={18} />
            <span>Covenant Canon</span>
          </button>

          <button
            className={`ww-nav-btn ${activeNav === 'council' ? 'active' : ''}`}
            onClick={() => setActiveNav('council')}
          >
            <Scale size={18} />
            <span>Dragon Council</span>
            <span className="ww-nav-badge">1 PENDING</span>
          </button>

          <button
            className={`ww-nav-btn ${activeNav === 'propose' ? 'active' : ''}`}
            onClick={() => setActiveNav('propose')}
          >
            <FileText size={18} />
            <span>Propose Codicil</span>
          </button>

          <button
            className={`ww-nav-btn ${activeNav === 'seal' ? 'active' : ''}`}
            onClick={() => setActiveNav('seal')}
          >
            <PlusCircle size={18} />
            <span>Seal Covenant</span>
          </button>

          <button
            className={`ww-nav-btn ${activeNav === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveNav('radar')}
          >
            <Flame size={18} />
            <span>3-Gate Sentry Flow</span>
          </button>
        </nav>

        <div className="ww-sidebar-footer">
          <div className="ww-network-tag">
            <span className="ww-network-beacon"></span>
            <span>Studio Next (61997)</span>
          </div>

          <a
            href={`https://explorer-studio-next.genlayer.com/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="ww-contract-link"
            title="Inspect contract on GenLayer Explorer"
          >
            <span>{formatAddress(CONTRACT_ADDRESS)}</span>
            <ExternalLink size={12} />
          </a>

          <div style={{ fontSize: '11px', color: 'var(--ww-text-dim)', textAlign: 'center', paddingTop: '4px' }}>
            Guardian Sovereign Gate Active
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="ww-main">
        {/* Sticky Top Header */}
        <header className="ww-header">
          <div className="ww-header-title">
            <span>GenVM Autonomous Governance Sentry</span>
            <h1>
              {activeNav === 'canon' && 'Active Canonical Mandates'}
              {activeNav === 'council' && 'Dragon Council Review Chamber'}
              {activeNav === 'propose' && 'Governance Amendment Proposal Studio'}
              {activeNav === 'seal' && 'Seal Genesis Governance Covenant'}
              {activeNav === 'radar' && '3-Gate Cryptographic Sentry Architecture'}
            </h1>
          </div>

          <div className="ww-header-actions">
            <button className="ww-wallet-btn" onClick={handleConnectWallet} disabled={connecting}>
              <Wallet size={16} />
              <span>{account ? formatAddress(account) : 'Connect Wallet'}</span>
            </button>

            <button
              className="ww-sync-btn"
              onClick={refreshProtocolState}
              disabled={loading}
              title="Sync on-chain state"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* View Content Container */}
        <div className="ww-view-container">
          {/* Status Toast Alert */}
          {statusMessage && (
            <div className={`ww-banner ${statusMessage.type}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {statusMessage.type === 'ok' && <CheckCircle2 size={16} />}
                {statusMessage.type === 'err' && <AlertCircle size={16} />}
                {statusMessage.type === 'busy' && <Sparkles size={16} />}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Hero Section */}
          <section className="ww-hero">
            <div className="ww-hero-content">
              <div className="ww-hero-badge">
                <span>🐉</span> GenVM Intelligent Governance Covenant
              </div>
              <h2>Autonomous Covenant & Revision Sentry</h2>
              <p>
                WyrmWard cryptographically binds natural-language governance mandates to executable transaction manifests.
                Amendments pass through deterministic calldata inspection and multi-validator AI equivalence consensus,
                with final commitment reserved exclusively for the sovereign human guardian.
              </p>
            </div>

            <div className="ww-hero-seal">
              <span>Human Sentry Invariant</span>
              <strong>Guardian Sovereign</strong>
              <div style={{ fontSize: '11px', color: 'var(--ww-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Non-Autonomous AI
              </div>
            </div>
          </section>

          {/* Metric KPI Cards */}
          <div className="ww-metrics-grid">
            <div className="ww-metric-card">
              <div className="ww-metric-top">
                <span className="ww-metric-val">{telemetry.covenants}</span>
                <div className="ww-metric-icon" style={{ background: 'rgba(255, 100, 61, 0.1)', color: 'var(--ww-ember)' }}>
                  <Shield size={18} />
                </div>
              </div>
              <span className="ww-metric-lbl">Sealed Covenants</span>
            </div>

            <div className="ww-metric-card">
              <div className="ww-metric-top">
                <span className="ww-metric-val">{telemetry.codicils}</span>
                <div className="ww-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--ww-gold)' }}>
                  <FileText size={18} />
                </div>
              </div>
              <span className="ww-metric-lbl">Revision Pipeline</span>
            </div>

            <div className="ww-metric-card">
              <div className="ww-metric-top">
                <span className="ww-metric-val">{telemetry.verdicts}</span>
                <div className="ww-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--ww-crimson)' }}>
                  <Scale size={18} />
                </div>
              </div>
              <span className="ww-metric-lbl">Council Consensus</span>
            </div>

            <div className="ww-metric-card">
              <div className="ww-metric-top">
                <span className="ww-metric-val" style={{ fontSize: '20px', color: 'var(--ww-emerald)', marginTop: '4px' }}>
                  Enforced
                </span>
                <div className="ww-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--ww-emerald)' }}>
                  <Lock size={18} />
                </div>
              </div>
              <span className="ww-metric-lbl">Sovereign Gate</span>
            </div>
          </div>

          {/* PAGE 1: COVENANT CANON */}
          {activeNav === 'canon' && (
            <div className="ww-dossier-layout">
              {/* Left Panel: Natural-Language Constitution & Invariants */}
              <div className="ww-panel">
                <div className="ww-panel-header">
                  <div className="ww-panel-title">
                    <Scroll size={18} color="var(--ww-ember)" />
                    <h3>Mandate Constitution</h3>
                  </div>
                  <span className="ww-badge emerald">CANON_ACTIVE · EPOCH #{selectedCovenant.current_epoch}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--ww-text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Covenant Name
                  </span>
                  <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{selectedCovenant.name}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--ww-text-muted)', fontFamily: 'var(--ww-font-mono)' }}>
                    Domain: <span className="ww-badge ember">{selectedCovenant.domain}</span>
                  </div>
                </div>

                <div className="ww-prose-quote">
                  "{activeCanonCodicil.covenant_prose}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--ww-text-dim)' }}>
                  <span>Prose Hash:</span>
                  <button
                    onClick={() => handleCopy('prose', activeCanonCodicil.prose_hash)}
                    style={{ background: 'var(--ww-bg-surface)', border: '1px solid var(--ww-border-subtle)', borderRadius: '6px', padding: '4px 8px', color: 'inherit', fontFamily: 'var(--ww-font-mono)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{formatAddress(activeCanonCodicil.prose_hash)}</span>
                    {copiedKey === 'prose' ? <Check size={12} color="var(--ww-emerald)" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="ww-invariants-list">
                  <div className="ww-invariant-item">
                    <CheckCircle2 size={16} color="var(--ww-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Deterministic Diff Enforcement</strong>
                      <p>All calldata actions and parameters are strictly matched against on-chain SHA256 hashes.</p>
                    </div>
                  </div>

                  <div className="ww-invariant-item">
                    <CheckCircle2 size={16} color="var(--ww-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Independent LLM Consensus</strong>
                      <p>Multi-validator nodes judge natural-language disclosure truthfulness before any codicil certification.</p>
                    </div>
                  </div>

                  <div className="ww-invariant-item">
                    <CheckCircle2 size={16} color="var(--ww-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Guardian Sovereign Gate</strong>
                      <p>AI validators hold veto and advisory powers only; only the human guardian key can enact canon.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Executable Calldata Manifest & Lineage */}
              <div className="ww-panel">
                <div className="ww-panel-header">
                  <div className="ww-panel-title">
                    <Layers size={18} color="var(--ww-gold)" />
                    <h3>Executable Calldata Manifest</h3>
                  </div>
                  <span className="ww-badge amber">{activeCanonCodicil.actions?.length || 1} Operation Enacted</span>
                </div>

                {/* Structured Action Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(activeCanonCodicil.actions || []).map((action, idx) => (
                    <div key={idx} className="ww-action-card">
                      <div className="ww-action-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255, 100, 61, 0.1)', color: 'var(--ww-ember)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                            #{idx + 1}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#fff' }}>Treasury Asset Disbursement</strong>
                        </div>
                        <span className="ww-badge purple">selector: {action.selector}</span>
                      </div>

                      <div className="ww-action-meta">
                        <div className="ww-meta-box">
                          <span>Authorized Spending Cap</span>
                          <strong style={{ fontSize: '18px', color: 'var(--ww-gold)' }}>
                            {action.amount.toLocaleString()} DAI
                          </strong>
                        </div>

                        <div className="ww-meta-box">
                          <span>Target Contract</span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong>{formatAddress(action.target)}</strong>
                            <button
                              onClick={() => handleCopy(`tgt-${idx}`, action.target)}
                              style={{ background: 'none', border: 'none', color: 'var(--ww-text-dim)', cursor: 'pointer' }}
                            >
                              {copiedKey === `tgt-${idx}` ? <Check size={12} color="var(--ww-emerald)" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--ww-bg-void)', border: '1px solid var(--ww-border-subtle)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--ww-text-dim)' }}>Beneficiary: </span>
                          <span style={{ fontFamily: 'var(--ww-font-mono)', color: 'var(--ww-text-main)' }}>{action.recipient}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(`recp-${idx}`, action.recipient)}
                          style={{ background: 'var(--ww-bg-surface)', border: '1px solid var(--ww-border-subtle)', borderRadius: '6px', padding: '3px 8px', color: 'var(--ww-text-main)', fontSize: '11px', cursor: 'pointer' }}
                        >
                          {copiedKey === `recp-${idx}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Epoch Evolution Lineage */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ww-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Epoch Lineage
                  </div>

                  <div className="ww-lineage-step active">
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>●</span> Epoch #1: Baseline Sealed
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ww-text-dim)', marginTop: '2px' }}>
                        Active canon · 50,000 DAI allocation for cryptographic security reviews
                      </div>
                    </div>
                    <span className="ww-badge emerald">ACTIVE</span>
                  </div>

                  <div className="ww-lineage-step review">
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ww-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>●</span> Epoch #2: Revision in Review
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ww-text-dim)', marginTop: '2px' }}>
                        Codicil #2 proposes +25,000 DAI expansion for ZK rollup bridge audits
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCodicilId(2);
                        setActiveNav('council');
                      }}
                      className="ww-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      <span>Inspect</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
                  <button onClick={() => setActiveNav('propose')} className="ww-btn-primary">
                    <FileText size={15} />
                    <span>Draft Revision Codicil</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 2: DRAGON COUNCIL REVIEW CHAMBER */}
          {activeNav === 'council' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="ww-panel">
                <div className="ww-panel-header">
                  <div className="ww-panel-title">
                    <Scale size={20} color="var(--ww-gold)" />
                    <h3>Dragon Council Adjudication Workbench</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--ww-text-muted)' }}>Codicil Under Review:</span>
                    <select
                      value={selectedCodicilId}
                      onChange={(e) => setSelectedCodicilId(Number(e.target.value))}
                      className="ww-select"
                      style={{ width: 'auto', fontFamily: 'var(--ww-font-mono)' }}
                    >
                      {codicils.map((cod) => (
                        <option key={cod.codicil_id} value={cod.codicil_id}>
                          Codicil #{cod.codicil_id} (Epoch {cod.epoch_number} Target - {cod.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Author's Changelog Disclosure Banner */}
                <div style={{ background: 'var(--ww-bg-surface)', border: '1px solid var(--ww-border-subtle)', borderRadius: '10px', padding: '18px 22px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ww-ember)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Author's Transparent Changelog Disclosure
                  </div>
                  <p style={{ fontSize: '14px', color: '#fff', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{reviewCodicil.changelog_disclosure}"
                  </p>
                </div>

                {/* Side-by-Side Calldata Manifest Diff Engine */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ww-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={14} color="var(--ww-ember)" />
                    Side-by-Side Manifest Equivalence Diff Engine
                  </div>
                  <CodelensDiffViewer
                    baselineActions={activeCanonCodicil?.actions || []}
                    revisedActions={reviewCodicil.actions || []}
                    divergenceFlags={reviewCodicil.divergence_flags || []}
                  />
                </div>

                {/* Dragon Council AI Consensus Dossier */}
                {reviewVerdict ? (
                  <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Scale size={18} color="var(--ww-gold)" />
                        <strong style={{ fontSize: '16px', color: '#fff' }}>Dragon Council Consensus Adjudication</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--ww-text-muted)' }}>Risk Assessment:</span>
                        <span style={{ fontFamily: 'var(--ww-font-mono)', fontWeight: 800, color: calculateRiskCategory(reviewVerdict.risk_score).color, fontSize: '14px' }}>
                          {reviewVerdict.risk_score} / 100 ({calculateRiskCategory(reviewVerdict.risk_score).label})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="ww-meta-box">
                        <span>Council Verdict</span>
                        <strong style={{ color: 'var(--ww-gold)' }}>{reviewVerdict.assessment}</strong>
                      </div>

                      <div className="ww-meta-box">
                        <span>Disclosure Integrity</span>
                        <strong style={{ color: 'var(--ww-emerald)' }}>
                          {reviewVerdict.disclosure_integrity ? 'TRANSPARENT_VERIFIED' : 'DECEPTIVE_OMISSION'}
                        </strong>
                      </div>

                      <div className="ww-meta-box">
                        <span>Calldata Action Delta</span>
                        <strong style={{ color: 'var(--ww-ember)' }}>
                          {reviewVerdict.action_diff_present ? 'MATERIAL DELTA' : 'IDENTICAL'}
                        </strong>
                      </div>
                    </div>

                    <div style={{ background: 'var(--ww-bg-void)', border: '1px solid var(--ww-border-subtle)', borderRadius: '8px', padding: '14px 18px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--ww-text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Consensus Synthesis
                      </span>
                      <p style={{ fontSize: '13px', color: 'var(--ww-text-main)', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{reviewVerdict.reason}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', paddingTop: '8px' }}>
                      <button
                        onClick={() => handleAdjudicateCodicil(reviewCodicil.codicil_id)}
                        disabled={loading}
                        className="ww-btn-secondary"
                      >
                        <Scale size={16} />
                        <span>Convene Council (AI Consensus)</span>
                      </button>

                      <button
                        onClick={() => handleCommitCodicil(reviewCodicil.codicil_id)}
                        disabled={loading}
                        className="ww-btn-primary"
                      >
                        <Lock size={16} />
                        <span>The Guardian's Seal: Enact to Canon</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', background: 'var(--ww-bg-surface)', border: '1px dashed var(--ww-border-subtle)', borderRadius: '12px' }}>
                    <Clock size={28} color="var(--ww-text-dim)" style={{ margin: '0 auto 10px' }} />
                    <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '4px' }}>Awaiting Dragon Council Adjudication</h4>
                    <p style={{ fontSize: '13px', color: 'var(--ww-text-dim)', marginBottom: '16px' }}>
                      Click below to convene multi-validator comparative AI consensus on GenLayer Studio Next.
                    </p>
                    <button
                      onClick={() => handleAdjudicateCodicil(reviewCodicil.codicil_id)}
                      disabled={loading}
                      className="ww-btn-primary"
                    >
                      <Scale size={16} />
                      <span>Convene Council Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAGE 3: PROPOSE CODICIL */}
          {activeNav === 'propose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="ww-panel">
                <div className="ww-panel-header">
                  <div className="ww-panel-title">
                    <FileText size={20} color="var(--ww-ember)" />
                    <h3>Draft Prospective Governance Codicil</h3>
                  </div>
                </div>

                {/* Scenario Presets Bar */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ww-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                    Simulation Scenario Presets
                  </div>
                  <MockScenarios onSelect={handleSelectScenario} />
                </div>

                {/* Proposal Form */}
                <form onSubmit={handleSubmitCodicil} className="ww-form" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                  <div className="ww-field">
                    <label>Revised Governance Prose (Natural-Language Constitution)</label>
                    <textarea
                      rows={4}
                      value={proposeRevProse}
                      onChange={(e) => setProposeRevProse(e.target.value)}
                      className="ww-textarea"
                      placeholder="Specify the amended governance constitution..."
                      required
                    />
                  </div>

                  <div className="ww-field">
                    <label>Author's Transparent Changelog Disclosure</label>
                    <textarea
                      rows={2}
                      value={proposeChangelog}
                      onChange={(e) => setProposeChangelog(e.target.value)}
                      className="ww-textarea"
                      placeholder="Disclose any and all material parameter changes..."
                      required
                    />
                  </div>

                  <div className="ww-field">
                    <label>Executable Calldata Manifest (JSON Array)</label>
                    <textarea
                      rows={6}
                      value={proposeManifest}
                      onChange={(e) => setProposeManifest(e.target.value)}
                      className="ww-textarea mono"
                      placeholder="[{ target, selector, recipient, asset, value, amount }]"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--ww-border-subtle)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--ww-text-dim)', fontFamily: 'var(--ww-font-mono)' }}>
                      Bound to Parent Epoch #{selectedCovenant.current_epoch}
                    </div>

                    <button type="submit" disabled={loading} className="ww-btn-primary">
                      <Flame size={16} />
                      <span>Submit to Dragon's Breath Pre-Filter</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PAGE 4: SEAL COVENANT */}
          {activeNav === 'seal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="ww-panel">
                <div className="ww-panel-header">
                  <div className="ww-panel-title">
                    <PlusCircle size={20} color="var(--ww-ember)" />
                    <h3>Seal Genesis Governance Covenant Baseline</h3>
                  </div>
                </div>

                <form onSubmit={handleSealCovenant} className="ww-form" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="ww-field">
                      <label>Covenant Name</label>
                      <input
                        type="text"
                        value={newCovenantName}
                        onChange={(e) => setNewCovenantName(e.target.value)}
                        className="ww-input"
                        required
                      />
                    </div>

                    <div className="ww-field">
                      <label>Governance Domain</label>
                      <input
                        type="text"
                        value={newCovenantDomain}
                        onChange={(e) => setNewCovenantDomain(e.target.value)}
                        className="ww-input"
                        style={{ fontFamily: 'var(--ww-font-mono)' }}
                        required
                      />
                    </div>
                  </div>

                  <div className="ww-field">
                    <label>Baseline Mandate Prose (Epoch 1 Constitution)</label>
                    <textarea
                      rows={3}
                      value={newCovenantProse}
                      onChange={(e) => setNewCovenantProse(e.target.value)}
                      className="ww-textarea"
                      required
                    />
                  </div>

                  <div className="ww-field">
                    <label>Initial Executable Manifest (JSON Array)</label>
                    <textarea
                      rows={6}
                      value={newCovenantManifest}
                      onChange={(e) => setNewCovenantManifest(e.target.value)}
                      className="ww-textarea mono"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--ww-border-subtle)' }}>
                    <button type="submit" disabled={loading} className="ww-btn-primary">
                      <Shield size={16} />
                      <span>Seal Genesis Covenant on GenLayer</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PAGE 5: 3-GATE SENTRY FLOW */}
          {activeNav === 'radar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <DragonFlowchart />
            </div>
          )}
        </div>

        {/* Global Anchored Footer */}
        <footer className="ww-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🐉</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>WyrmWard Protocol</span>
            <span>&bull;</span>
            <span style={{ fontFamily: 'var(--ww-font-mono)' }}>GenLayer Studio Next (61997)</span>
            <span>&bull;</span>
            <span style={{ color: 'var(--ww-emerald)', fontFamily: 'var(--ww-font-mono)' }}>Consensus Active</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href={`https://explorer-studio-next.genlayer.com/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              Contract Explorer
            </a>
            <span>&bull;</span>
            <span>Python GenVM & React 19</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
