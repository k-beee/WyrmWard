# 🧪 DracoPact Verification & Test Manifest

## 1. Automated Verification Pipeline

DracoPact enforces four rigorous verification layers:

| Layer | Execution Command | Result |
|---|---|---|
| **GenVM Linter** | `python3 -X utf8 -m genvm_linter.cli contracts/draco_pact.py` | `✓ Lint passed (3 checks, 0 errors)` |
| **Intelligent Contract Tests** | `python3 -m pytest tests -q` | `21 passed in 0.03s` |
| **Frontend Lifecycle Tests** | `npm test` (inside `frontend/`) | `3 passed in 0.14s` |
| **Production Web Build** | `npm run build` (inside `frontend/`) | `✓ Clean TypeScript/Vite bundle in <600ms` |

---

## 2. Behavioral Test Coverage Matrix

- [x] **Permissionless Covenant Sealing**: Any DAO member or guild can seal an independent mandate.
- [x] **Schema Validation**: Bounds enforcement on names (min 4), prose (min 60), changelog (min 20), domains, and addresses.
- [x] **Deterministic Manifest Diffing**: Machine-level divergence flags for actions, targets, selectors, recipients, amounts, and allowances.
- [x] **Zero Address Alert**: Flags recipient `0x000...000`.
- [x] **Unlimited Allowance Alert**: Flags token transfers/allowances `>= 10^30`.
- [x] **Cryptographic Lineage Anchoring**: Parent prose SHA-256 and manifest SHA-256 bindings.
- [x] **Optimistic Concurrency**: Rejection of stale epoch proposals with `STALE_COVENANT_EPOCH`.
- [x] **Council Certification (Disclosed Shifts)**: Honest disclosure of budget/action changes earns `COUNCIL_CERTIFIED`.
- [x] **Council Certification (Editorial Polish)**: Harmless wording clarifications earn `EDITORIAL_APPROVED` ➔ `COUNCIL_CERTIFIED`.
- [x] **Council Veto (Concealed Scope Creep)**: Deceptive changelogs with calldata changes are vetoed (`COUNCIL_VETOED`).
- [x] **Deterministic Override Protection**: AI hallucinations cannot certify proposals with undisclosed calldata deltas.
- [x] **Fail-Closed Consensus Handling**: Malformed or non-JSON validator outputs safely map to `CONSENSUS_STALEMATE`.
- [x] **Sovereign Guardian Enactment**: Non-guardians are rejected with `ONLY_COVENANT_GUARDIAN`.
- [x] **Atomic Epoch Supersession**: Transition atomically marks parent as `SUPERSEDED_HISTORIC` and child as `COVENANT_ACTIVE`.
