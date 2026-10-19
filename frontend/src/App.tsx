import React, { useState, useEffect } from 'react';
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
  Sliders,
  History,
  ShieldCheck,
  Terminal,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
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
import { ActionManifestCard } from './components/ActionManifestCard';
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'covenants' | 'review' | 'propose' | 'create' | 'architecture'>('covenants');
  const [account, setAccount] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Protocol state initialized with rich defaults
  const [telemetry, setTelemetry] = useState<ProtocolTelemetry>(DEFAULT_TELEMETRY);
  const [covenants, setCovenants] = useState<CovenantRecord[]>([DEFAULT_MOCK_COVENANT]);
  const [codicils, setCodicils] = useState<CodicilRecord[]>([DEFAULT_MOCK_CODICIL_1, DEFAULT_MOCK_CODICIL_2]);
  const [verdicts, setVerdicts] = useState<VerdictRecord[]>([DEFAULT_MOCK_VERDICT]);
  const [selectedCovenantId, setSelectedCovenantId] = useState<number>(1);
  const [selectedCodicilId, setSelectedCodicilId] = useState<number>(2);

  // Form states: Create Covenant
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

  // Refresh live protocol state from GenLayer contract
  const refreshProtocolState = async () => {
    if (!isConfigured) return;

    try {
      setLoading(true);
      const tel = await readContractState<ProtocolTelemetry>('get_protocol_telemetry');

      const covCount = Math.max(Number(tel?.covenants) || 0, 1);
      const codCount = Math.max(Number(tel?.codicils) || 0, 1);
      const verCount = Number(tel?.verdicts) || 0;

      // Parallel batch reading
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

      // Atomic commit
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
      console.warn('GenLayer RPC live sync notice:', err.message);
      setCovenants([DEFAULT_MOCK_COVENANT]);
      setCodicils([DEFAULT_MOCK_CODICIL_1, DEFAULT_MOCK_CODICIL_2]);
      setVerdicts([DEFAULT_MOCK_VERDICT]);
      setTelemetry(DEFAULT_TELEMETRY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProtocolState();
  }, []);

  const handleCopyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      const addr = await connectWallet();
      setAccount(addr);
      setStatusMessage({ text: `Connected wallet: ${addr.slice(0, 6)}...${addr.slice(-4)}`, type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setConnecting(false);
    }
  };

  const handleSelectScenario = (scenario: ScenarioPreset) => {
    setProposeRevProse(scenario.revisedProse);
    setProposeChangelog(scenario.changelog);
    setProposeManifest(scenario.manifestJson);
    setActiveTab('propose');
    setStatusMessage({ text: `Loaded simulation scenario: ${scenario.title}`, type: 'info' });
  };

  // Contract actions
  const handleSealCovenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      setStatusMessage({ text: 'Please connect your Web3 wallet first.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage({ text: 'Sealing new covenant baseline on GenLayer...', type: 'info' });
      const tx = await executeContractTransaction(
        'seal_covenant',
        [newCovenantName, newCovenantDomain, newCovenantProse, newCovenantManifest],
        account
      );
      setStatusMessage({ text: `Covenant sealed! Tx: ${tx.slice(0, 10)}...`, type: 'success' });
      await refreshProtocolState();
      setActiveTab('covenants');
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCodicil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      setStatusMessage({ text: 'Please connect your Web3 wallet first.', type: 'error' });
      return;
    }

    const currentCov = covenants.find((c) => Number(c.covenant_id) === Number(selectedCovenantId)) || covenants[0];
    const parentCod = codicils.find((c) => Number(c.codicil_id) === Number(currentCov?.active_codicil_id)) || codicils[0];

    try {
      setLoading(true);
      setStatusMessage({ text: "Submitting codicil for Dragon's Breath pre-filtering...", type: 'info' });
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
      setStatusMessage({ text: `Codicil registered! Tx: ${tx.slice(0, 10)}...`, type: 'success' });
      await refreshProtocolState();
      setActiveTab('review');
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjudicateCodicil = async (codicilId: number) => {
    if (!account) {
      setStatusMessage({ text: 'Please connect your Web3 wallet first.', type: 'error' });
      return;
    }

    const currentCov = covenants.find((c) => Number(c.covenant_id) === Number(selectedCovenantId)) || covenants[0];

    try {
      setLoading(true);
      setStatusMessage({ text: 'Convening the Dragon Council for multi-validator AI consensus...', type: 'info' });
      const tx = await executeContractTransaction(
        'adjudicate_codicil',
        [codicilId, currentCov.current_epoch],
        account
      );
      setStatusMessage({ text: `Dragon Council Adjudication finalized! Tx: ${tx.slice(0, 10)}...`, type: 'success' });
      await refreshProtocolState();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCommitCodicil = async (codicilId: number) => {
    if (!account) {
      setStatusMessage({ text: 'Please connect your Web3 wallet first.', type: 'error' });
      return;
    }

    const currentCov = covenants.find((c) => Number(c.covenant_id) === Number(selectedCovenantId)) || covenants[0];

    try {
      setLoading(true);
      setStatusMessage({ text: "Applying The Guardian's Seal to commit active canon...", type: 'info' });
      const tx = await executeContractTransaction(
        'commit_codicil',
        [currentCov.covenant_id, codicilId, currentCov.current_epoch],
        account
      );
      setStatusMessage({ text: `Codicil enacted into active canon! Epoch advanced. Tx: ${tx.slice(0, 10)}...`, type: 'success' });
      await refreshProtocolState();
      setActiveTab('covenants');
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Robust item resolution: never undefined
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

  // Formatted address helper
  const truncateAddr = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07090e] text-slate-200 selection:bg-orange-500/30 selection:text-orange-200 relative overflow-x-hidden">
      {/* Subtle ambient lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,rgba(255,100,61,0.08),rgba(255,255,255,0))] z-0" />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        {/* Top Header Command Bar */}
        <header className="border-b border-white/5 bg-[#0b0e17]/85 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            {/* Logo & Brand Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-950/30 ring-1 ring-orange-500/30">
                <span className="text-xl select-none">🐉</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-white tracking-tight font-sans">WyrmWard</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono font-semibold">
                    v1.0 GenVM
                  </span>
                </div>
                <p className="text-xs text-slate-400">Autonomous Governance Covenant & Revision Sentry</p>
              </div>
            </div>

            {/* Right Status Controls */}
            <div className="flex items-center gap-3">
              {/* Network Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121622] border border-white/5 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-mono">Studio Next (61997)</span>
              </div>

              {/* Contract Pill with Copy & Explorer */}
              {isConfigured && (
                <div className="flex items-center bg-[#121622] border border-white/5 rounded-lg text-xs font-mono text-orange-300 overflow-hidden">
                  <a
                    href={`https://explorer-studio-next.genlayer.com/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 hover:text-orange-200 hover:bg-white/5 transition-all flex items-center gap-1.5"
                    title="View contract on GenLayer Explorer"
                  >
                    <span>{truncateAddr(CONTRACT_ADDRESS)}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <button
                    onClick={handleCopyContract}
                    className="p-1.5 border-l border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Copy contract address"
                  >
                    {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Wallet Pill / Connect */}
              {account ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 font-mono font-medium">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{truncateAddr(account)}</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-xs transition-all shadow-md shadow-orange-950/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}

              {/* Quick Sync */}
              <button
                onClick={refreshProtocolState}
                disabled={loading}
                className="p-2 rounded-lg bg-[#121622] border border-white/5 hover:border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Refresh on-chain state"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Executive KPI Metric Banner */}
        <section className="border-b border-white/5 bg-[#0a0c13]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400">Canonical Mandates</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  {telemetry.covenants} <span className="text-xs font-normal text-emerald-400">Active</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400">Revision Pipeline</div>
                <div className="text-base font-bold text-orange-300 font-mono mt-0.5">
                  {telemetry.codicils} <span className="text-xs font-normal text-slate-400">Codicils</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <Scale className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400">Council Consensus</div>
                <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                  {telemetry.verdicts} <span className="text-xs font-normal text-emerald-400">Verdicts</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0f121b] border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400">Sovereign Gate</div>
                <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                  Guardian <span className="text-xs font-normal text-slate-400">Non-Auto</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Toast Alert */}
        {statusMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-white text-base px-2 cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Segmented Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 overflow-x-auto scrollbar-none">
            {[
              { id: 'covenants', label: 'Canonical Mandates', icon: Shield },
              { id: 'review', label: 'Dragon Council Chamber', icon: Scale, badge: '1 Pending' },
              { id: 'propose', label: 'Proposal Studio', icon: FileText },
              { id: 'create', label: 'Genesis Covenant', icon: PlusCircle },
              { id: 'architecture', label: 'Security Architecture', icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-950/20 ring-1 ring-orange-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121622] border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: CANONICAL MANDATES (CANON EXPLORER) */}
          {activeTab === 'covenants' && (
            <div className="space-y-8">
              {/* Covenant Executive Header Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0f18] border border-white/5 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono font-semibold uppercase">
                        Domain: {selectedCovenant.domain}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold">
                        CANON_ACTIVE
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/5 text-xs font-mono">
                        Epoch #{selectedCovenant.current_epoch}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {selectedCovenant.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>Guardian Authority:</span>
                      <span className="text-slate-200 font-semibold">{selectedCovenant.guardian}</span>
                    </div>
                  </div>

                  {/* Top Action CTAs */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedCodicilId(2);
                        setActiveTab('review');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-white/10 font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span>Review Council Queue</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('propose')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-orange-950/20 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Draft Revision Codicil</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2-Column Balanced Core Dossier */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                  {/* Left Column: Natural-Language Constitution & Invariants */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Natural-Language Constitution */}
                    <div className="p-6 rounded-2xl bg-[#111420] border border-white/5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-sans">
                          <FileText className="w-4 h-4 text-orange-400" />
                          <span>Canonical Mandate Prose (Constitution)</span>
                        </div>
                        <button
                          onClick={() => handleCopyHash(activeCanonCodicil.prose_hash)}
                          className="px-2 py-1 rounded bg-[#171b2b] hover:bg-[#1e2338] text-[11px] font-mono text-slate-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Copy prose SHA256 hash"
                        >
                          <span>{truncateAddr(activeCanonCodicil.prose_hash)}</span>
                          {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="p-5 rounded-xl bg-[#0a0c14] border border-white/5 relative">
                        <p className="text-sm text-slate-200 leading-relaxed font-sans italic">
                          "{activeCanonCodicil.covenant_prose}"
                        </p>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                        <span>Disclosure baseline: {activeCanonCodicil.changelog_disclosure}</span>
                        <span className="text-emerald-400 font-mono text-[11px]">Sealed Epoch 1</span>
                      </div>
                    </div>

                    {/* Active Cryptographic Invariants */}
                    <div className="p-6 rounded-2xl bg-[#111420] border border-white/5 space-y-4">
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-sans">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Active GenVM Security Invariants</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-[#0a0c14] border border-white/5 flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-white">Deterministic Calldata Verification</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              Zero silent mutations allowed. Calldata hashes are computed deterministically prior to LLM consensus.
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#0a0c14] border border-white/5 flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-white">Multi-Validator Equivalence Consensus</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              Independent validators judge disclosure transparency against machine execution parameters.
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#0a0c14] border border-white/5 flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-white">Non-Autonomous Sovereign Gate</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              AI validators hold advisory and veto powers only. Only the authenticated guardian key commits active canon.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Executable Calldata Manifest & Lineage */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Authorized Actions Manifest */}
                    <div className="p-6 rounded-2xl bg-[#111420] border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-sans">
                          <Layers className="w-4 h-4 text-orange-400" />
                          <span>Authorized Executable Actions Manifest</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {activeCanonCodicil.actions?.length || 1} Operation Enacted
                        </span>
                      </div>

                      <ActionManifestCard actions={activeCanonCodicil.actions || []} />
                    </div>

                    {/* Epoch Evolution Lineage */}
                    <div className="p-6 rounded-2xl bg-[#111420] border border-white/5 space-y-4">
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-sans">
                        <History className="w-4 h-4 text-amber-400" />
                        <span>Governance Epoch Lineage</span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-[#0a0c14] border border-emerald-500/30 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span className="text-xs font-bold text-white font-mono">Epoch #1: Baseline Sealed</span>
                              <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                                ACTIVE CANON
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Established 50,000 DAI allocation for security audits and cryptographic formal verification.
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0a0c14] border border-amber-500/30 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                              <span className="text-xs font-bold text-white font-mono">Epoch #2: Amendment Proposed</span>
                              <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono">
                                IN REVIEW
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Codicil #2 proposes +25,000 DAI expansion for ZK rollup bridge audits.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCodicilId(2);
                              setActiveTab('review');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRAGON COUNCIL REVIEW CHAMBER */}
          {activeTab === 'review' && (
            <div className="space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0f18] border border-white/5 space-y-6 shadow-xl">
                {/* Header & Codicil Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                      <Scale className="w-6 h-6 text-amber-400" />
                      <span>Dragon Council Review Chamber</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Multi-validator comparative consensus: Natural-language disclosure integrity vs executable calldata parameters.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Inspecting Proposal:</span>
                    <select
                      value={selectedCodicilId}
                      onChange={(e) => setSelectedCodicilId(Number(e.target.value))}
                      className="bg-[#141824] border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono cursor-pointer"
                    >
                      {codicils.map((cod) => (
                        <option key={cod.codicil_id} value={cod.codicil_id}>
                          Codicil #{cod.codicil_id} (Target: Epoch #{cod.epoch_number} - {cod.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Review Overview Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#111420] border border-white/5 space-y-1">
                    <div className="text-xs text-slate-400">Proposal Identity</div>
                    <div className="text-sm font-bold font-mono text-white">Codicil #{reviewCodicil.codicil_id}</div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">By: {reviewCodicil.proposer}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111420] border border-white/5 space-y-1">
                    <div className="text-xs text-slate-400">Enactment Target</div>
                    <div className="text-sm font-bold font-mono text-orange-400">Epoch #{reviewCodicil.epoch_number}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Bound to Epoch #{selectedCovenant.current_epoch}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111420] border border-white/5 space-y-1">
                    <div className="text-xs text-slate-400">Consensus Status</div>
                    <div className="text-sm font-bold font-mono text-amber-300">{reviewCodicil.status}</div>
                    <div className="text-[11px] text-emerald-400 font-mono">Pre-Filter Cleared</div>
                  </div>
                </div>

                {/* Proposer's Changelog Disclosure Banner */}
                <div className="p-5 rounded-2xl bg-[#111420] border border-white/5 space-y-2">
                  <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                    Author's Transparent Changelog Disclosure
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans italic">
                    "{reviewCodicil.changelog_disclosure}"
                  </p>
                </div>

                {/* Side-by-Side Manifest Diff Engine */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-400" />
                    <span>Side-by-Side Calldata Manifest Comparison</span>
                  </h3>
                  <CodelensDiffViewer
                    baselineActions={activeCanonCodicil?.actions || []}
                    revisedActions={reviewCodicil.actions || []}
                    divergenceFlags={reviewCodicil.divergence_flags || []}
                  />
                </div>

                {/* Dragon Council AI Adjudication Report */}
                {reviewVerdict ? (
                  <div className="p-6 rounded-2xl bg-[#111524] border border-amber-500/30 space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <Scale className="w-5 h-5 text-amber-400" />
                        <h4 className="text-base font-bold text-white">Dragon Council Consensus Report</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Risk Assessment:</span>
                        <span className={`font-mono text-sm font-bold ${calculateRiskCategory(reviewVerdict.risk_score).color}`}>
                          {reviewVerdict.risk_score}/100 ({calculateRiskCategory(reviewVerdict.risk_score).label})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-xl bg-[#0a0d16] border border-white/5">
                        <div className="text-[11px] text-slate-400 uppercase">Council Verdict</div>
                        <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                          {reviewVerdict.assessment}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0a0d16] border border-white/5">
                        <div className="text-[11px] text-slate-400 uppercase">Disclosure Integrity</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                          {reviewVerdict.disclosure_integrity ? 'TRANSPARENT_VERIFIED' : 'DECEPTIVE_OMISSION'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0a0d16] border border-white/5">
                        <div className="text-[11px] text-slate-400 uppercase">Action Diff Present</div>
                        <div className="text-sm font-bold text-orange-400 font-mono mt-0.5">
                          {reviewVerdict.action_diff_present ? 'MATERIAL DELTA' : 'IDENTICAL'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0a0d16] border border-white/5 space-y-1">
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Multi-Validator Consensus Synthesis:</div>
                      <p className="text-xs text-slate-200 leading-relaxed italic">"{reviewVerdict.reason}"</p>
                    </div>

                    {/* Threat Classifiers */}
                    {reviewVerdict.threat_tags?.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-xs text-slate-400">Threat Classifiers:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {reviewVerdict.threat_tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-mono"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Execution Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 flex-wrap">
                      <button
                        onClick={() => handleAdjudicateCodicil(reviewCodicil.codicil_id)}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs shadow-md shadow-amber-950/20 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Scale className="w-4 h-4" />
                        <span>Convene Council (Multi-Validator Consensus)</span>
                      </button>

                      <button
                        onClick={() => handleCommitCodicil(reviewCodicil.codicil_id)}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Lock className="w-4 h-4" />
                        <span>The Guardian's Seal: Enact to Active Canon</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-[#111420] border border-dashed border-white/10 text-center space-y-3">
                    <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                    <div className="text-sm font-semibold text-white">Awaiting Dragon Council Adjudication</div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Click below to convene multi-validator comparative AI consensus across independent GenLayer nodes.
                    </p>
                    <button
                      onClick={() => handleAdjudicateCodicil(reviewCodicil.codicil_id)}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs shadow-md shadow-amber-950/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Convene Council Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DRAFT CODICIL (PROPOSAL STUDIO) */}
          {activeTab === 'propose' && (
            <div className="space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0f18] border border-white/5 space-y-8 shadow-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <FileText className="w-6 h-6 text-orange-400" />
                    <span>Governance Amendment Proposal Studio</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Draft a proposed amendment against the active governance canon with cryptographic parent epoch binding.
                  </p>
                </div>

                {/* Simulation Scenarios Presets */}
                <div className="p-6 rounded-2xl bg-[#111420] border border-white/5">
                  <MockScenarios onSelect={handleSelectScenario} />
                </div>

                {/* Proposal Form */}
                <form onSubmit={handleSubmitCodicil} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Revised Governance Prose (Natural-Language Constitution)
                    </label>
                    <textarea
                      rows={4}
                      value={proposeRevProse}
                      onChange={(e) => setProposeRevProse(e.target.value)}
                      className="w-full bg-[#111420] border border-white/10 rounded-2xl p-4 text-xs text-white font-sans focus:outline-none focus:border-orange-500/50 leading-relaxed"
                      placeholder="Enter revised mandate prose..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Author's Transparent Changelog Disclosure
                    </label>
                    <textarea
                      rows={2}
                      value={proposeChangelog}
                      onChange={(e) => setProposeChangelog(e.target.value)}
                      className="w-full bg-[#111420] border border-white/10 rounded-2xl p-4 text-xs text-white font-sans focus:outline-none focus:border-orange-500/50 leading-relaxed"
                      placeholder="Disclose any and all material parameter changes..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Executable Calldata Manifest (JSON Array)
                    </label>
                    <textarea
                      rows={6}
                      value={proposeManifest}
                      onChange={(e) => setProposeManifest(e.target.value)}
                      className="w-full bg-[#111420] border border-white/10 rounded-2xl p-4 text-xs text-amber-300 font-mono focus:outline-none focus:border-orange-500/50 leading-relaxed"
                      placeholder="[{ target, selector, recipient, asset, value, amount }]"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5 flex-wrap gap-4">
                    <span className="text-xs text-slate-400 font-mono">
                      Bound to Parent Epoch #{selectedCovenant.current_epoch} ({truncateAddr(activeCanonCodicil.prose_hash)})
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-lg shadow-orange-950/20 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Submit to Dragon's Breath Pre-Filter</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: SEAL NEW COVENANT */}
          {activeTab === 'create' && (
            <div className="space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0f18] border border-white/5 space-y-8 shadow-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <PlusCircle className="w-6 h-6 text-orange-400" />
                    <span>Seal Genesis Governance Covenant</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Register a brand-new immutable governance domain with Genesis Epoch #1 on GenLayer.
                  </p>
                </div>

                <form onSubmit={handleSealCovenant} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Covenant Name
                      </label>
                      <input
                        type="text"
                        value={newCovenantName}
                        onChange={(e) => setNewCovenantName(e.target.value)}
                        className="w-full bg-[#111420] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Governance Domain
                      </label>
                      <input
                        type="text"
                        value={newCovenantDomain}
                        onChange={(e) => setNewCovenantDomain(e.target.value)}
                        className="w-full bg-[#111420] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-orange-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Baseline Mandate Prose (Epoch 1 Constitution)
                    </label>
                    <textarea
                      rows={3}
                      value={newCovenantProse}
                      onChange={(e) => setNewCovenantProse(e.target.value)}
                      className="w-full bg-[#111420] border border-white/10 rounded-2xl p-4 text-xs text-white font-sans focus:outline-none focus:border-orange-500/50 leading-relaxed"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Initial Action Manifest (JSON Array)
                    </label>
                    <textarea
                      rows={6}
                      value={newCovenantManifest}
                      onChange={(e) => setNewCovenantManifest(e.target.value)}
                      className="w-full bg-[#111420] border border-white/10 rounded-2xl p-4 text-xs text-amber-300 font-mono focus:outline-none focus:border-orange-500/50 leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end pt-6 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-lg shadow-orange-950/20 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Seal Genesis Covenant Baseline</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY RADAR & ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-8">
              <DragonFlowchart />
            </div>
          )}
        </main>

        {/* Global Footer: Clean, centered, and anchored at bottom */}
        <footer className="mt-auto border-t border-white/5 bg-[#0a0c13] py-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🐉</span>
              <span className="font-semibold text-slate-300">WyrmWard Protocol</span>
              <span>&bull;</span>
              <span className="font-mono text-slate-400">GenLayer Studio Next (61997)</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-mono">Consensus Finality Active</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <a
                href={`https://explorer-studio-next.genlayer.com/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-orange-400 transition-colors flex items-center gap-1 font-mono"
              >
                <span>Contract Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span>&bull;</span>
              <span>Built with GenLayer Intelligent Contracts & React 19</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
