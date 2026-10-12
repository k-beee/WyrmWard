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
  HelpCircle,
  Zap,
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

// Default realistic fallback records (always populated from first render)
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

  // Load live protocol state from GenLayer
  const refreshProtocolState = async () => {
    if (!isConfigured) return;

    try {
      setLoading(true);
      const tel = await readContractState<ProtocolTelemetry>('get_protocol_telemetry');
      
      const covCount = Math.max(Number(tel?.covenants) || 0, 1);
      const codCount = Math.max(Number(tel?.codicils) || 0, 1);
      const verCount = Number(tel?.verdicts) || 0;

      // Parallel batch reading to prevent waterfall latency
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

      // Atomic state update: never leaves UI in half-loaded state
      if (validCovs.length > 0) setCovenants(validCovs);
      if (validCods.length > 0) setCodicils(validCods);
      if (validVers.length > 0) {
        setVerdicts(validVers);
      } else {
        // Keep default mock verdict if no verdicts finalized on chain yet
        setVerdicts([DEFAULT_MOCK_VERDICT]);
      }

      setTelemetry({
        covenants: validCovs.length || Number(tel?.covenants) || 1,
        codicils: validCods.length || Number(tel?.codicils) || 2,
        verdicts: validVers.length || Number(tel?.verdicts) || 1,
      });
    } catch (err: any) {
      console.warn('GenLayer RPC live sync notice:', err.message);
      // Fallback seamlessly to rich mock baseline
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

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07080c] text-slate-200 selection:bg-orange-500/30 selection:text-orange-200 relative overflow-x-hidden">
      {/* Ambient background atmosphere */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,100,61,0.07),rgba(255,255,255,0))] z-0" />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        {/* Top Header Command Bar */}
        <header className="border-b border-white/5 bg-[#0e1118]/85 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo & Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-950/30 ring-1 ring-orange-500/30">
                <span className="text-xl select-none">🐉</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-white tracking-wide font-sans">WyrmWard</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono font-semibold">
                    v1.0 GenVM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Autonomous Governance Covenant & Revision Sentry</p>
              </div>
            </div>

            {/* Right Status Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Network Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141722] border border-white/5 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-mono">Studio Next (61997)</span>
              </div>

              {/* Contract Pill with Copy & Explorer */}
              {isConfigured && (
                <div className="flex items-center bg-[#141722] border border-white/5 rounded-lg text-xs font-mono text-orange-300 overflow-hidden">
                  <a
                    href={`https://explorer-studio-next.genlayer.com/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 hover:text-orange-200 hover:bg-white/5 transition-all flex items-center gap-1.5"
                    title="View contract on GenLayer Explorer"
                  >
                    <span>{CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <button
                    onClick={handleCopyContract}
                    className="p-1.5 border-l border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                    title="Copy contract address"
                  >
                    {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {/* Wallet Pill / Connect */}
              {account ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 font-mono">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
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
                className="p-2 rounded-lg bg-[#141722] border border-white/5 hover:border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Refresh on-chain state"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Executive KPI Metric Banner */}
        <section className="border-b border-white/5 bg-[#0a0c12]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium">Sealed Covenants</div>
                <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                  <span>{telemetry.covenants}</span>
                  <span className="text-[10px] font-normal text-emerald-400">· Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium">Revision Queue</div>
                <div className="text-sm font-bold text-orange-300 font-mono flex items-center gap-1.5">
                  <span>{telemetry.codicils} Codicils</span>
                  <span className="text-[10px] font-normal text-slate-400">· Logged</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium">Council Consensus</div>
                <div className="text-sm font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <span>{telemetry.verdicts} Verdicts</span>
                  <span className="text-[10px] font-normal text-emerald-400">· Multi-AI</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium">Enactment Gate</div>
                <div className="text-sm font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                  <span>Guardian Sovereign</span>
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
              <div className="flex items-center gap-2">
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

        {/* Main Content Area: fills entire vertical view */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 overflow-x-auto scrollbar-none">
            {[
              { id: 'covenants', label: 'Active Covenants (Canon Explorer)', icon: Shield },
              { id: 'review', label: 'Dragon Council Chamber (Consensus)', icon: Scale },
              { id: 'propose', label: 'Draft Codicil (Propose)', icon: FileText },
              { id: 'create', label: 'Seal New Covenant', icon: PlusCircle },
              { id: 'architecture', label: 'Security Radar & Architecture', icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-950/20 ring-1 ring-orange-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#141722] border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: ACTIVE COVENANTS (CANON EXPLORER) */}
          {activeTab === 'covenants' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Sidebar: Covenant Roster & Governance History */}
                <div className="space-y-6">
                  {/* Canonical Mandates List */}
                  <div className="bg-[#10131a] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-400" />
                        Canonical Mandates
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                        {covenants.length} REGISTERED
                      </span>
                    </div>

                    <div className="space-y-3">
                      {covenants.map((cov) => {
                        const isSelected = Number(cov.covenant_id) === Number(selectedCovenant.covenant_id);
                        return (
                          <div
                            key={cov.covenant_id}
                            onClick={() => setSelectedCovenantId(Number(cov.covenant_id))}
                            className={`p-4 rounded-xl cursor-pointer border transition-all ${
                              isSelected
                                ? 'bg-[#151926] border-orange-500/40 shadow-lg shadow-orange-950/20 ring-1 ring-orange-500/30'
                                : 'bg-[#12151e] border-white/5 hover:border-white/10 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                                COVENANT #{cov.covenant_id}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                Epoch {cov.current_epoch}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-100 mb-1.5">{cov.name}</h3>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              Guardian: {cov.guardian}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Epoch Evolution Timeline */}
                  <div className="bg-[#10131a] border border-white/5 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      Epoch Lineage History
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#141722] border border-emerald-500/30 relative pl-4">
                        <div className="absolute left-1.5 top-3.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20"></div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-emerald-400">Epoch #1 (Active Canon)</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">SEALED</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Initial sealed baseline with 50,000 DAI allocation limit for formal verification audits.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#141722] border border-amber-500/30 relative pl-4">
                        <div className="absolute left-1.5 top-3.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-4 ring-amber-500/20 animate-pulse"></div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-amber-400">Epoch #2 (Pending Revision)</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">IN REVIEW</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Codicil #2 proposes +25,000 DAI capital expansion for cross-chain L2 integration security.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedCodicilId(2);
                            setActiveTab('review');
                          }}
                          className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect in Council Chamber</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Governance Navigation */}
                  <div className="bg-[#10131a] border border-white/5 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-400" />
                      Quick Sentry Actions
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab('propose')}
                        className="w-full p-2.5 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-white/5 text-left text-xs text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="font-medium">Draft Amendment Codicil</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setActiveTab('review')}
                        className="w-full p-2.5 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-white/5 text-left text-xs text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="font-medium">Open Dragon Council Chamber</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setActiveTab('architecture')}
                        className="w-full p-2.5 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-white/5 text-left text-xs text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                      >
                        <span className="font-medium">Inspect 3-Gate Sentry Flow</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Area: Deep Canonical Mandate Dossier */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#10131a] border border-white/5 rounded-2xl p-6 relative overflow-hidden space-y-6">
                    {/* Header Banner */}
                    <div className="flex items-start justify-between flex-wrap gap-4 border-b border-white/5 pb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono text-orange-400 uppercase tracking-wider font-semibold">
                            DOMAIN: {selectedCovenant.domain}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                            CANON_ACTIVE
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{selectedCovenant.name}</h2>
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          Covenant UID: #{selectedCovenant.covenant_id} · Sealed on GenLayer Studio Next
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Current Enacted Canon</div>
                        <div className="text-lg font-mono font-bold text-orange-400">
                          Epoch #{selectedCovenant.current_epoch}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Active Codicil #{selectedCovenant.active_codicil_id}
                        </span>
                      </div>
                    </div>

                    {/* Canonical Mandate Prose */}
                    <div className="bg-[#141824] rounded-2xl p-5 border border-white/5 shadow-inner space-y-3">
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between flex-wrap gap-2">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-400" />
                          Canonical Mandate Natural-Language Constitution
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 truncate max-w-xs">
                          {activeCanonCodicil.prose_hash || 'sha256:c3eb82aa...'}
                        </span>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-[#0d1017] border border-white/5">
                        <p className="text-sm text-slate-100 leading-relaxed font-sans italic">
                          "{activeCanonCodicil.covenant_prose}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Disclosure baseline: {activeCanonCodicil.changelog_disclosure}</span>
                        <span className="font-mono text-emerald-400">Deterministic Invariant Enforced</span>
                      </div>
                    </div>

                    {/* Active Calldata Actions Manifest */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-orange-400" />
                          Active Executable Actions Manifest (GenVM)
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {activeCanonCodicil.actions?.length || 1} Operation Enacted
                        </span>
                      </div>

                      <CodelensDiffViewer
                        baselineActions={activeCanonCodicil.actions || []}
                        revisedActions={activeCanonCodicil.actions || []}
                        divergenceFlags={[]}
                      />
                    </div>

                    {/* Cryptographic Security Invariants */}
                    <div className="p-5 rounded-xl bg-gradient-to-r from-orange-950/20 via-[#141722] to-amber-950/20 border border-orange-500/20 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-400" />
                        GenVM Mathematical Invariants Active
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-[#0e1118] border border-white/5">
                          <div className="font-semibold text-slate-200 mb-1">Deterministic Diff</div>
                          <p className="text-[11px] text-slate-400">
                            Zero silent parameters allowed. All targets and spending limits are hashed via sha256.
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#0e1118] border border-white/5">
                          <div className="font-semibold text-slate-200 mb-1">Equivalence Consensus</div>
                          <p className="text-[11px] text-slate-400">
                            Independent validators cross-examine natural language against calldata operations.
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#0e1118] border border-white/5">
                          <div className="font-semibold text-slate-200 mb-1">Guardian Gate</div>
                          <p className="text-[11px] text-slate-400">
                            AI validators can never execute autonomous transfers. Human guardian signature mandatory.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-5 border-t border-white/5 text-xs text-slate-400 flex-wrap gap-4">
                      <div>
                        Guardian Authority:{' '}
                        <span className="font-mono text-slate-300 font-semibold">{selectedCovenant.guardian}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedCodicilId(2);
                            setActiveTab('review');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] text-slate-300 border border-white/10 font-medium text-xs transition-all cursor-pointer"
                        >
                          Review Pending Codicil
                        </button>
                        <button
                          onClick={() => setActiveTab('propose')}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950/20 transition-all cursor-pointer"
                        >
                          <span>Draft Revision Codicil</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRAGON COUNCIL REVIEW CHAMBER */}
          {activeTab === 'review' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-400" />
                    Dragon Council Review Chamber
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comparative multi-validator adjudication of prospective covenant codicils.
                  </p>
                </div>

                {/* Selector for Codicils */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Inspecting Codicil:</span>
                  <select
                    value={selectedCodicilId}
                    onChange={(e) => setSelectedCodicilId(Number(e.target.value))}
                    className="bg-[#141722] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono cursor-pointer"
                  >
                    {codicils.map((cod) => (
                      <option key={cod.codicil_id} value={cod.codicil_id}>
                        Codicil #{cod.codicil_id} (Epoch {cod.epoch_number} - {cod.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {reviewCodicil && (
                <div className="space-y-6">
                  {/* Status Hero Card */}
                  <div className="bg-[#10131a] border border-white/5 rounded-2xl p-6 space-y-6">
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-4 border-b border-white/5 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">CODICIL #{reviewCodicil.codicil_id}</span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                              getCodicilStatusTone(reviewCodicil.status).tone === 'emerald'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : getCodicilStatusTone(reviewCodicil.status).tone === 'amber'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : getCodicilStatusTone(reviewCodicil.status).tone === 'rose'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {reviewCodicil.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1">
                          Revision Target: Epoch #{reviewCodicil.epoch_number}
                        </h3>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Proposer: {reviewCodicil.proposer}
                        </div>
                      </div>

                      {/* Action Execution Trigger Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAdjudicateCodicil(reviewCodicil.codicil_id)}
                          disabled={loading}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-950/20 flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Scale className="w-4 h-4" />
                          <span>Adjudicate with Council (AI Consensus)</span>
                        </button>

                        <button
                          onClick={() => handleCommitCodicil(reviewCodicil.codicil_id)}
                          disabled={loading}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/20 flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Commit Codicil (Guardian Enactment)</span>
                        </button>
                      </div>
                    </div>

                    {/* Proposer's Changelog Disclosure Banner */}
                    <div className="bg-[#141722] rounded-xl p-4 border border-white/5">
                      <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
                        Author's Changelog Disclosure
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                        "{reviewCodicil.changelog_disclosure}"
                      </p>
                    </div>

                    {/* Dragon Council AI Verdict Card */}
                    {reviewVerdict ? (
                      <div className="bg-[#121622] rounded-xl p-5 border border-amber-500/30 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-amber-400" />
                            <h4 className="text-sm font-bold text-white">Dragon Council Consensus Report</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Risk Score:</span>
                            <span className={`font-mono text-sm font-bold ${calculateRiskCategory(reviewVerdict.risk_score).color}`}>
                              {reviewVerdict.risk_score}/100 ({calculateRiskCategory(reviewVerdict.risk_score).label})
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-[#0e111a] p-3 rounded-lg border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Council Decision</div>
                            <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                              {reviewVerdict.assessment}
                            </div>
                          </div>
                          <div className="bg-[#0e111a] p-3 rounded-lg border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Disclosure Integrity</div>
                            <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                              {reviewVerdict.disclosure_integrity ? 'VERIFIED_TRANSPARENT' : 'DECEPTIVE_OMISSION'}
                            </div>
                          </div>
                          <div className="bg-[#0e111a] p-3 rounded-lg border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Action Diff Present</div>
                            <div className="text-xs font-mono font-bold text-orange-400 mt-0.5">
                              {reviewVerdict.action_diff_present ? 'YES (MATERIAL DELTA)' : 'NO (IDENTICAL)'}
                            </div>
                          </div>
                        </div>

                        {/* Reasoning Quote */}
                        <div className="p-3.5 rounded-lg bg-[#0e111a] border border-white/5">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Consensus Synthesis:</div>
                          <p className="text-xs text-slate-300 italic leading-relaxed">"{reviewVerdict.reason}"</p>
                        </div>

                        {/* Threat Tags */}
                        {reviewVerdict.threat_tags?.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Threat Classifiers:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {reviewVerdict.threat_tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-mono"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#141722]/60 rounded-xl p-5 border border-dashed border-white/10 text-center">
                        <Clock className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                        <div className="text-xs text-slate-300 font-semibold">Awaiting Dragon Council Adjudication</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Click "Adjudicate with Council" to convene multi-validator AI consensus across GenLayer.
                        </p>
                      </div>
                    )}

                    {/* Calldata Manifest Diff Engine */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-400" />
                        Deterministic Manifest Diff Engine (Active Baseline vs Proposed Revision)
                      </h4>
                      <CodelensDiffViewer
                        baselineActions={activeCanonCodicil.actions || []}
                        revisedActions={reviewCodicil.actions || []}
                        divergenceFlags={reviewCodicil.divergence_flags || []}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DRAFT CODICIL (PROPOSE) */}
          {activeTab === 'propose' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-400" />
                    Draft Prospective Codicil
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Propose an amendment against the active governance canon with cryptographic parent binding.
                  </p>
                </div>
              </div>

              {/* Scenario Presets Bar */}
              <div className="bg-[#10131a] border border-white/5 rounded-2xl p-5">
                <MockScenarios onSelect={handleSelectScenario} />
              </div>

              {/* Proposal Form */}
              <form onSubmit={handleSubmitCodicil} className="bg-[#10131a] border border-white/5 rounded-2xl p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Revised Covenant Prose (Constitution)
                  </label>
                  <textarea
                    rows={4}
                    value={proposeRevProse}
                    onChange={(e) => setProposeRevProse(e.target.value)}
                    className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-orange-500/50"
                    placeholder="Enter revised natural-language mandate..."
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
                    className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-orange-500/50"
                    placeholder="Disclose any and all material parameter changes..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Executable Calldata Action Manifest (JSON Array)
                  </label>
                  <textarea
                    rows={6}
                    value={proposeManifest}
                    onChange={(e) => setProposeManifest(e.target.value)}
                    className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-amber-300 font-mono focus:outline-none focus:border-orange-500/50"
                    placeholder="[{ target, selector, recipient, asset, value, amount }]"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs text-slate-400">
                    Parent epoch bound to: Epoch #{selectedCovenant.current_epoch}
                  </span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-lg shadow-orange-950/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Submit to Dragon's Breath Pre-Filter</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SEAL NEW COVENANT */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-orange-400" />
                  Seal New Governance Covenant Baseline
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Register a brand new governance domain with Genesis Epoch #1 on GenLayer.
                </p>
              </div>

              <form onSubmit={handleSealCovenant} className="bg-[#10131a] border border-white/5 rounded-2xl p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Covenant Name
                    </label>
                    <input
                      type="text"
                      value={newCovenantName}
                      onChange={(e) => setNewCovenantName(e.target.value)}
                      className="w-full bg-[#141722] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
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
                      className="w-full bg-[#141722] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500/50"
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
                    className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-orange-500/50"
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
                    className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-amber-300 font-mono focus:outline-none focus:border-orange-500/50"
                    required
                  />
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-lg shadow-orange-950/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Seal Genesis Covenant Baseline</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: SECURITY RADAR & ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <DragonFlowchart />
            </div>
          )}
        </main>

        {/* Global Footer: Pinned cleanly at the bottom */}
        <footer className="mt-auto border-t border-white/5 bg-[#0a0c12] py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🐉</span>
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
                <ExternalLink className="w-3 h-3" />
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
