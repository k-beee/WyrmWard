# 🐉 WyrmWard Technical Architecture

## 1. System Overview

**WyrmWard** is an autonomous governance covenant and revision sentry built on GenLayer. It enforces strict cryptographic, deterministic, and semantic boundaries over DAO charters, treasury allocations, and grant covenants.

---

## 2. The Three Dragon Sentry Gates

```mermaid
flowchart TD
    subgraph Gate1["Gate 1: The Dragon's Breath (Deterministic Machine Diff)"]
        A["Active Covenant Canon<br/>(Epoch N Baseline)"] --> D["Deterministic Calldata Inspector"]
        B["Proposed Codicil Revision<br/>(Epoch N+1 Draft)"] --> D
        D --> E{"Machine Discrepancies?<br/>Target / Selector / Recipient / Value / Amount"}
        E -- Discrepancies Found --> F["Isolate Divergence Flags:<br/>ACTION_COUNT_DELTA, CAPITAL_DELTA,<br/>RECIPIENT_DIVERGENCE, SELECTOR_MUTATION,<br/>ZERO_ADDRESS_ALERT, UNLIMITED_ALLOWANCE_ALERT"]
        E -- No Discrepancies --> G["Divergence: [] (Zero Calldata Drift)"]
    end

    subgraph Gate2["Gate 2: The Dragon Council (Multi-Validator Comparative AI Consensus)"]
        F --> H["gl.eq_principle.prompt_comparative"]
        G --> H
        H --> I["Validator 1: Independent Prompt Execution"]
        H --> J["Validator 2: Independent Prompt Execution"]
        H --> K["Validator N: Independent Prompt Execution"]
        I & J & K --> L{"Consequential Protocol Equivalence<br/>Do changelog disclosures fully match<br/>all material semantic & executable shifts?"}
        L -- "Disclosed & Honest" --> M["COUNCIL_CERTIFIED"]
        L -- "Concealed or Divergent" --> N["COUNCIL_VETOED"]
        L -- "Inconclusive / Corrupted" --> O["CONSENSUS_STALEMATE (Retryable)"]
    end

    subgraph Gate3["Gate 3: The Guardian's Seal (Sovereign Enactment Gate)"]
        M --> P{"Authenticated Guardian Check<br/>get_caller_address() == covenant.guardian"}
        P -- Non-Guardian / Attacker --> Q["Revert: ONLY_COVENANT_GUARDIAN"]
        P -- Authenticated Guardian --> R["commit_codicil(covenant_id, codicil_id, epoch)"]
        R --> S["Atomic Canon Transition:<br/>Epoch N ➔ SUPERSEDED_HISTORIC<br/>Epoch N+1 ➔ COVENANT_ACTIVE"]
    end
```

---

## 3. Storage Architecture

WyrmWard utilizes GenVM's persistent storage primitives (`TreeMap[u256, str]`) with canonical JSON normalization to prevent state divergence and optimize validator memory:

- `covenants: TreeMap[u256, str]`: Maps covenant IDs to primary registry records.
- `codicils: TreeMap[u256, str]`: Maps revision/codicil IDs to immutable revision records.
- `verdicts: TreeMap[u256, str]`: Maps adjudication IDs to multi-validator council decision records.

---

## 4. State Machine & Lifecycle Vocabulary

| State | Scope | Description |
|---|---|---|
| `COVENANT_ACTIVE` | Covenants & Codicils | Currently sealed canonical authority for the DAO or guild. |
| `CODICIL_PENDING` | Codicils | Proposed draft awaiting Dragon Council adjudication. |
| `COUNCIL_CERTIFIED` | Codicils | Verified by validators as completely disclosed and eligible for enactment. |
| `COUNCIL_VETOED` | Codicils | Rejected by validators due to concealed scope creep or calldata mismatch. |
| `CONSENSUS_STALEMATE` | Codicils | Inconclusive validator agreement; safely retryable without state corruption. |
| `SUPERSEDED_HISTORIC` | Codicils | Former canon superseded by an enacted child epoch. |
