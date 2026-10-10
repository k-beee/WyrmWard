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
  ArrowRight
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'covenants' | 'review' | 'propose' | 'create' | 'architecture'>('covenants');
  const [account, setAccount] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Protocol state
  const [telemetry, setTelemetry] = useState<ProtocolTelemetry>({ covenants: 1, codicils: 2, verdicts: 1 });
  const [covenants, setCovenants] = useState<CovenantRecord[]>([]);
  const [codicils, setCodicils] = useState<CodicilRecord[]>([]);
  const [verdicts, setVerdicts] = useState<VerdictRecord[]>([]);
  const [selectedCovenantId, setSelectedCovenantId] = useState<number>(1);
  const [selectedCodicilId, setSelectedCodicilId] = useState<number>(2);

  // Form states: Create Covenant
  const [newCovenantName, setNewCovenantName] = useState('Dragon Citadel Security Guild Treasury Covenant');
  const [newCovenantDomain, setNewCovenantDomain] = useState('TREASURY_ALLOCATION');
  const [newCovenantProse, setNewCovenantProse] = useState(
    'Establish the Dragon Citadel Security Guild Treasury Covenant with an allocation of 50000 units. All disbursements must fund formal verification, cryptographic fuzzing, and third-party smart contract audits.'
  );
  const [newCovenantManifest, setNewCovenantManifest] = useState(
    JSON.stringify([
      {
        target: '0x1111111111111111111111111111111111111111',
        selector: '0xa9059cbb',
        recipient: '0x2222222222222222222222222222222222222222',
        asset: '0x0000000000000000000000000000000000000000',
        value: 0,
        amount: 50000,
      }
    ], null, 2)
  );

  // Form states: Propose Codicil
  const [proposeRevProse, setProposeRevProse] = useState(
    'Establish the Dragon Citadel Security Guild Treasury Covenant with an increased allocation of 75000 units. The 25000 unit expansion funds emergency vulnerability mitigation across cross-chain rollup bridge contracts.'
  );
  const [proposeChangelog, setProposeChangelog] = useState(
    'Transparent disclosure: expanding budget cap from 50,000 to 75,000 units to fund formal verification and fuzzing for ZK rollup bridges.'
  );
  const [proposeManifest, setProposeManifest] = useState(
    JSON.stringify([
      {
        target: '0x1111111111111111111111111111111111111111',
        selector: '0xa9059cbb',
        recipient: '0x2222222222222222222222222222222222222222',
        asset: '0x0000000000000000000000000000000000000000',
        value: 0,
        amount: 75000,
      }
    ], null, 2)
  );

  // Fallback realistic mock data (used when contract address is pending deployment)
  const defaultMockCovenant: CovenantRecord = {
    covenant_id: 1,
    guardian: '0x0935155Ecae9a29Cda23f5fD6A0E596C4178571A',
    name: 'Dragon Citadel Security Guild Treasury Covenant',
    domain: 'TREASURY_ALLOCATION',
    status: 'COVENANT_ACTIVE',
    current_epoch: 1,
    active_codicil_id: 1,
    codicil_history: [1, 2],
    created_at: Math.floor(Date.now() / 1000) - 86400,
  };

  const defaultMockCodicil1: CodicilRecord = {
    codicil_id: 1,
    covenant_id: 1,
    epoch_number: 1,
    parent_codicil_id: 0,
    parent_prose_hash: '',
    parent_manifest_hash: '',
    proposer: '0x0935155Ecae9a29Cda23f5fD6A0E596C4178571A',
    covenant_prose:
      'Establish the Dragon Citadel Security Guild Treasury Covenant with an allocation of 50000 units. All disbursements must fund formal verification, cryptographic fuzzing, and third-party smart contract audits.',
    prose_hash: 'sha256:d97101298c926eb63d786e069c51f39de7d51e51f1f55ab1cca19583ef6b6e1d',
    changelog_disclosure: 'Initial sealed covenant baseline (Epoch 1)',
    actions: [
      {
        target: '0x1111111111111111111111111111111111111111',
        selector: '0xa9059cbb',
        recipient: '0x2222222222222222222222222222222222222222',
        asset: '0x0000000000000000000000000000000000000000',
        value: 0,
        amount: 50000,
      },
    ],
    manifest_hash: 'sha256:282df754daf0fc9f918211a7a18c562ae359f6c881a5321c8186c11d5e86d9a4',
    divergence_flags: [],
    status: 'COVENANT_ACTIVE',
    verdict_ids: [],
    created_at: Math.floor(Date.now() / 1000) - 86400,
    enacted_at: Math.floor(Date.now() / 1000) - 86400,
  };

  const defaultMockCodicil2: CodicilRecord = {
    codicil_id: 2,
    covenant_id: 1,
    epoch_number: 2,
    parent_codicil_id: 1,
    parent_prose_hash: 'sha256:d97101298c926eb63d786e069c51f39de7d51e51f1f55ab1cca19583ef6b6e1d',
    parent_manifest_hash: 'sha256:282df754daf0fc9f918211a7a18c562ae359f6c881a5321c8186c11d5e86d9a4',
    proposer: '0x2222222222222222222222222222222222222222',
    covenant_prose:
      'Establish the Dragon Citadel Security Guild Treasury Covenant with an increased allocation of 75000 units. The 25000 unit expansion funds emergency vulnerability mitigation across cross-chain rollup bridge contracts.',
    prose_hash: 'sha256:3b561b7ed27e7e2f954769e60b8567324369e6cef5588022e1b4e62c970ecf39',
    changelog_disclosure:
      'Transparent disclosure: expanding budget cap from 50,000 to 75,000 units to fund formal verification and fuzzing for ZK rollup bridges.',
    actions: [
      {
        target: '0x1111111111111111111111111111111111111111',
        selector: '0xa9059cbb',
        recipient: '0x2222222222222222222222222222222222222222',
        asset: '0x0000000000000000000000000000000000000000',
        value: 0,
        amount: 75000,
      },
    ],
    manifest_hash: 'sha256:50be195b5ea8890c7e8efc13d5f4b159700286208385014ab8fddf50f510a3bc',
    divergence_flags: ['CAPITAL_DELTA'],
    status: 'COUNCIL_CERTIFIED',
    verdict_ids: [1],
    created_at: Math.floor(Date.now() / 1000) - 3600,
    enacted_at: 0,
  };

  const defaultMockVerdict1: VerdictRecord = {
    verdict_id: 1,
    covenant_id: 1,
    codicil_id: 2,
    adjudicator_caller: '0x0935155Ecae9a29Cda23f5fD6A0E596C4178571A',
    assessment: 'CERTIFIED_BENIGN',
    threat_tags: ['EXECUTABLE_ACTION_DELTA', 'AUTHORITY_EXPANSION'],
    disclosure_integrity: true,
    scope_broadened: true,
    risk_score: 28,
    action_diff_present: true,
    action_diff_disclosed: true,
    final_status: 'COUNCIL_CERTIFIED',
    reason: 'All material spending expansions are explicitly disclosed in the changelog.',
    created_at: Math.floor(Date.now() / 1000) - 3500,
  };

  // Load protocol state
  const refreshProtocolState = async () => {
    if (!isConfigured) {
      setCovenants([defaultMockCovenant]);
      setCodicils([defaultMockCodicil1, defaultMockCodicil2]);
      setVerdicts([defaultMockVerdict1]);
      setTelemetry({ covenants: 1, codicils: 2, verdicts: 1 });
      return;
    }

    try {
      setLoading(true);
      const tel = await readContractState<ProtocolTelemetry>('get_protocol_telemetry');
      setTelemetry(tel);

      const covList: CovenantRecord[] = [];
      for (let i = 1; i <= Number(tel.covenants); i++) {
        const c = await readContractState<CovenantRecord>('get_covenant', [i]);
        covList.push(c);
      }
      setCovenants(covList);

      const codList: CodicilRecord[] = [];
      for (let i = 1; i <= Number(tel.codicils); i++) {
        const cod = await readContractState<CodicilRecord>('get_codicil', [i]);
        codList.push(cod);
      }
      setCodicils(codList);

      const verList: VerdictRecord[] = [];
      for (let i = 1; i <= Number(tel.verdicts); i++) {
        const v = await readContractState<VerdictRecord>('get_verdict', [i]);
        verList.push(v);
      }
      setVerdicts(verList);
    } catch (err: any) {
      console.warn('Live RPC fetch notice:', err.message);
      // Graceful fallback to default mock state
      setCovenants([defaultMockCovenant]);
      setCodicils([defaultMockCodicil1, defaultMockCodicil2]);
      setVerdicts([defaultMockVerdict1]);
      setTelemetry({ covenants: 1, codicils: 2, verdicts: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProtocolState();
  }, []);

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
    setStatusMessage({ text: `Loaded preset scenario: ${scenario.title}`, type: 'info' });
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

    const currentCov = covenants.find((c) => c.covenant_id === selectedCovenantId) || covenants[0];
    const parentCod = codicils.find((c) => c.codicil_id === currentCov?.active_codicil_id) || codicils[0];

    try {
      setLoading(true);
      setStatusMessage({ text: "Submitting codicil for Dragon's Breath pre-filtering...", type: 'info' });
      const tx = await executeContractTransaction(
        'submit_codicil',
        [
          currentCov.covenant_id,
          currentCov.current_epoch,
          parentCod.prose_hash,
          proposeRevProse,
          proposeChangelog,
          proposeManifest,
        ],
        account
      );
      setStatusMessage({ text: `Codicil submitted! Tx: ${tx.slice(0, 10)}...`, type: 'success' });
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

    const currentCov = covenants.find((c) => c.covenant_id === selectedCovenantId) || covenants[0];

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

    const currentCov = covenants.find((c) => c.covenant_id === selectedCovenantId) || covenants[0];

    try {
      setLoading(true);
      setStatusMessage({ text: "Applying The Guardian's Seal to commit new active canon...", type: 'info' });
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

  const selectedCovenant = covenants.find((c) => c.covenant_id === selectedCovenantId) || covenants[0];
  const activeCanonCodicil = codicils.find((c) => c.codicil_id === selectedCovenant?.active_codicil_id) || codicils[0];
  const reviewCodicil = codicils.find((c) => c.codicil_id === selectedCodicilId) || codicils[codicils.length - 1] || defaultMockCodicil2;
  const reviewVerdict = verdicts.find((v) => v.codicil_id === reviewCodicil?.codicil_id);

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-200">
      {/* Top Banner Navigation */}
      <header className="border-b border-white/5 bg-[#0e1118]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-950/30 ring-1 ring-orange-500/30">
              <span className="text-xl">🐉</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-wide font-sans">WyrmWard</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
                  v1.0 GenVM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Governance Covenant & Revision Sentry</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Network Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141722] border border-white/5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-mono">GenLayer Studio Next (61997)</span>
            </div>

            {/* Contract Badge */}
            {isConfigured && (
              <a
                href={`https://explorer-studio-next.genlayer.com/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141722] border border-white/5 text-xs text-orange-300 hover:text-orange-200 hover:border-orange-500/30 transition-all font-mono"
              >
                <span>{CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Wallet Connect */}
            {account ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 font-mono">
                <Wallet className="w-3.5 h-3.5" />
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={connecting}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-xs transition-all shadow-md shadow-orange-950/20 flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            <button
              onClick={refreshProtocolState}
              disabled={loading}
              className="p-2 rounded-lg bg-[#141722] border border-white/5 hover:border-white/10 text-slate-400 hover:text-white transition-all"
              title="Refresh on-chain state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Protocol Telemetry Banner */}
      <section className="border-b border-white/5 bg-[#0a0c12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Covenants Sealed:</span>
              <span className="font-mono font-semibold text-white">{telemetry.covenants}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Codicils Proposed:</span>
              <span className="font-mono font-semibold text-orange-400">{telemetry.codicils}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Dragon Adjudications:</span>
              <span className="font-mono font-semibold text-amber-400">{telemetry.verdicts}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Enactment Invariant:</span>
            <span className="text-slate-300 font-mono text-[11px] bg-[#141722] px-2 py-0.5 rounded border border-white/5">
              Guardian Sovereign Gate (Non-Autonomous AI)
            </span>
          </div>
        </div>
      </section>

      {/* Status Toast Notification */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs px-2"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Controls */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3 overflow-x-auto">
          {[
            { id: 'covenants', label: 'Active Covenants', icon: Shield },
            { id: 'review', label: 'Dragon Council Chamber', icon: Scale },
            { id: 'propose', label: 'Draft Codicil', icon: FileText },
            { id: 'create', label: 'Seal New Covenant', icon: PlusCircle },
            { id: 'architecture', label: 'Dragon Sentry Radar', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141722]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ACTIVE COVENANTS */}
        {activeTab === 'covenants' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Covenant Selector Column */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-400" />
                  Canonical Mandates
                </h2>

                <div className="space-y-3">
                  {covenants.map((cov) => {
                    const isSelected = cov.covenant_id === selectedCovenantId;
                    return (
                      <div
                        key={cov.covenant_id}
                        onClick={() => setSelectedCovenantId(cov.covenant_id)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-[#141722] border-orange-500/40 shadow-lg shadow-orange-950/20 ring-1 ring-orange-500/30'
                            : 'bg-[#10131a] border-white/5 hover:border-white/10 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                            COVENANT #{cov.covenant_id}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Epoch {cov.current_epoch}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-slate-100 mb-1">{cov.name}</h3>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          Guardian: {cov.guardian}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Covenant Deep View */}
              {selectedCovenant && (
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#10131a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-orange-400 uppercase tracking-wider">
                            Domain: {selectedCovenant.domain}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            CANON_ACTIVE
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white mt-1">{selectedCovenant.name}</h2>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Current Active Canon</div>
                        <div className="text-sm font-mono font-bold text-orange-400">
                          Epoch #{selectedCovenant.current_epoch}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#141722] rounded-xl p-4 border border-white/5 mb-5">
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Canonical Mandate Prose</span>
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                          {activeCanonCodicil?.prose_hash}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {activeCanonCodicil?.covenant_prose}
                      </p>
                    </div>

                    {/* Calldata Manifest of Active Canon */}
                    {activeCanonCodicil && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Active Executable Actions Manifest
                        </div>
                        <CodelensDiffViewer
                          baselineActions={activeCanonCodicil.actions}
                          revisedActions={activeCanonCodicil.actions}
                          divergenceFlags={[]}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
                      <div>
                        Guardian Authority:{' '}
                        <span className="font-mono text-slate-300">{selectedCovenant.guardian}</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('propose')}
                        className="px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 font-medium text-xs flex items-center gap-1"
                      >
                        <span>Draft Revision Codicil</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DRAGON COUNCIL REVIEW CHAMBER */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
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
                  className="bg-[#141722] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                >
                  {codicils.map((cod) => (
                    <option key={cod.codicil_id} value={cod.codicil_id}>
                      Codicil #{cod.codicil_id} (Epoch {cod.epoch_number} Draft - {cod.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {reviewCodicil && (
              <div className="space-y-6">
                {/* Status Hero Card */}
                <div className="bg-[#10131a] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
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
                      <h3 className="text-base font-bold text-white mt-1">
                        Revision Target: Epoch #{reviewCodicil.epoch_number}
                      </h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Proposer: {reviewCodicil.proposer}
                      </div>
                    </div>

                    {/* Action Execution Trigger Buttons */}
                    <div className="flex items-center gap-3">
                      {reviewCodicil.status === 'CODICIL_PENDING' && (
                        <button
                          onClick={() => handleAdjudicateCodicil(reviewCodicil.codicil_id)}
                          disabled={loading}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-950/20 flex items-center gap-2"
                        >
                          <Scale className="w-4 h-4" />
                          <span>Adjudicate with Council (AI Consensus)</span>
                        </button>
                      )}

                      {reviewCodicil.status === 'COUNCIL_CERTIFIED' && (
                        <button
                          onClick={() => handleCommitCodicil(reviewCodicil.codicil_id)}
                          disabled={loading}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/20 flex items-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Commit Codicil (Guardian Enactment)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Proposer's Changelog Disclosure Banner */}
                  <div className="bg-[#141722] rounded-xl p-4 border border-white/5 mb-6">
                    <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
                      Author's Changelog Disclosure
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      "{reviewCodicil.changelog_disclosure}"
                    </p>
                  </div>

                  {/* Dragon Council AI Verdict Card */}
                  {reviewVerdict ? (
                    <div className="bg-[#121622] rounded-xl p-5 border border-amber-500/30 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-amber-400" />
                          <h4 className="text-sm font-bold text-white">Dragon Council Adjudication Report</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Risk Score:</span>
                          <span className={`font-mono text-sm font-bold ${calculateRiskCategory(reviewVerdict.risk_score).color}`}>
                            {reviewVerdict.risk_score}/100 ({calculateRiskCategory(reviewVerdict.risk_score).label})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-[#0e111a] p-3 rounded-lg border border-white/5">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Council Decision</div>
                          <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                            {reviewVerdict.assessment}
                          </div>
                        </div>
                        <div className="bg-[#0e111a] p-3 rounded-lg border border-white/5">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Disclosure Complete</div>
                          <div className={`text-xs font-mono font-bold mt-0.5 ${reviewVerdict.disclosure_integrity ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {reviewVerdict.disclosure_integrity ? 'YES (FULLY EXPLAINED)' : 'NO (CONCEALED)'}
                          </div>
                        </div>
                        <div className="bg-[#0e111a] p-3 rounded-lg border border-white/5">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Scope Expansion</div>
                          <div className={`text-xs font-mono font-bold mt-0.5 ${reviewVerdict.scope_broadened ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {reviewVerdict.scope_broadened ? 'EXPANDED' : 'UNCHANGED'}
                          </div>
                        </div>
                      </div>

                      {reviewVerdict.threat_tags.length > 0 && (
                        <div>
                          <div className="text-[11px] text-slate-400 mb-1.5">Identified Threat Tags:</div>
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
                    <div className="bg-[#141722]/60 rounded-xl p-4 border border-dashed border-white/10 text-center mb-6">
                      <Clock className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                      <div className="text-xs text-slate-300 font-semibold">Awaiting Dragon Council Adjudication</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click "Adjudicate with Council" to run multi-validator AI consensus across GenLayer.
                      </p>
                    </div>
                  )}

                  {/* Side by Side Calldata Manifest Comparison */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Deterministic Manifest Diff Engine
                    </h4>
                    <CodelensDiffViewer
                      baselineActions={activeCanonCodicil?.actions || []}
                      revisedActions={reviewCodicil.actions}
                      divergenceFlags={reviewCodicil.divergence_flags}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DRAFT CODICIL */}
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

            {/* Quick-Start Scenario Selector */}
            <MockScenarios onSelect={handleSelectScenario} />

            <form onSubmit={handleSubmitCodicil} className="bg-[#10131a] border border-white/5 rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Covenant
                </label>
                <div className="text-xs font-mono text-orange-400 bg-[#141722] p-2.5 rounded-lg border border-white/5 truncate">
                  Covenant #{selectedCovenant?.covenant_id}: {selectedCovenant?.name} (Parent Epoch: #{selectedCovenant?.current_epoch})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Changelog Disclosure (Human Summary)
                </label>
                <textarea
                  value={proposeChangelog}
                  onChange={(e) => setProposeChangelog(e.target.value)}
                  rows={2}
                  className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  placeholder="Explain exactly what you changed and why..."
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Mandatory: Must transparently disclose all material financial and policy shifts to pass council consensus.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Revised Covenant Prose
                </label>
                <textarea
                  value={proposeRevProse}
                  onChange={(e) => setProposeRevProse(e.target.value)}
                  rows={4}
                  className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Revised Executable Actions (JSON Manifest)
                </label>
                <textarea
                  value={proposeManifest}
                  onChange={(e) => setProposeManifest(e.target.value)}
                  rows={6}
                  className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-white/5">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-950/20 flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  <span>Submit Codicil for Dragon Sentry Audit</span>
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
                Permissionlessly establish a new governance mandate and seal Epoch 1 into active canon.
              </p>
            </div>

            <form onSubmit={handleSealCovenant} className="bg-[#10131a] border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Covenant Name
                  </label>
                  <input
                    type="text"
                    value={newCovenantName}
                    onChange={(e) => setNewCovenantName(e.target.value)}
                    className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                    placeholder="e.g. Treasury Allocation Mandate"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Governance Domain
                  </label>
                  <select
                    value={newCovenantDomain}
                    onChange={(e) => setNewCovenantDomain(e.target.value)}
                    className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="TREASURY_ALLOCATION">TREASURY_ALLOCATION</option>
                    <option value="GRANT_COVENANT">GRANT_COVENANT</option>
                    <option value="SECURITY_DIRECTIVE">SECURITY_DIRECTIVE</option>
                    <option value="CORE_CONSTITUTION">CORE_CONSTITUTION</option>
                    <option value="OPERATIONAL_MANDATE">OPERATIONAL_MANDATE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Baseline Covenant Prose
                </label>
                <textarea
                  value={newCovenantProse}
                  onChange={(e) => setNewCovenantProse(e.target.value)}
                  rows={4}
                  className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Executable Action Manifest (JSON)
                </label>
                <textarea
                  value={newCovenantManifest}
                  onChange={(e) => setNewCovenantManifest(e.target.value)}
                  rows={6}
                  className="w-full bg-[#141722] border border-white/10 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-white/5">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-950/20 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Seal Covenant Baseline (Epoch 1)</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: ARCHITECTURE RADAR */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <DragonFlowchart />

            {/* Invariant Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#10131a] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3">
                  <Flame className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Pure Code Diffing</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Machine isolation flags budget deltas and recipient deviations before the LLM pass, eliminating prompt manipulation vectors.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#10131a] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                  <Scale className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Comparative AI Consensus</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Multi-validator equivalence principles judge natural-language disclosure integrity against machine reality.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#10131a] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Guardian Enactment Sentry</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI validators hold advisory and veto powers only. Only the human covenant guardian can commit certified changes into active canon.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0c12] py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span>🐉</span>
            <span className="font-semibold text-slate-400">WyrmWard Protocol</span>
            <span>&bull;</span>
            <span>GenLayer Studio Next (61997)</span>
          </div>
          <div>
            Built with GenLayer Intelligent Contracts, Python GenVM & React 19
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
