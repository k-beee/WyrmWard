# 🛡️ WyrmWard Security Policy & Vulnerability Disclosure

## 1. Security Philosophy

WyrmWard is architected on the premise that natural language governance covenants and deterministic calldata actions must be independently audited with zero trust placed in centralized bots or single AI models.

### Key Security Axioms
1. **Machine Isolation**: Calldata differences are computed by pure deterministic code, not by AI models.
2. **Adversarial Invariant**: If a calldata difference exists, but the proposer's changelog omits it, the contract will **never certify the proposal**, regardless of model outputs.
3. **Execution Separation**: AI validators hold no execution authority; only the covenant guardian can commit an epoch.

---

## 2. Reporting a Vulnerability

If you discover a potential vulnerability in the WyrmWard contract or client interfaces, please report it privately:

- **Security Point of Contact:** `k-beee` via GitHub Security Advisories
- **PGP Encryption:** Available upon request
- **Response SLA:** Within 24 hours of disclosure

---

## 3. Scope & Critical Invariants

- State transitions must only be triggered via authenticated guardian calls (`get_caller_address() == covenant.guardian`).
- No codicil may be committed unless its status is strictly `COUNCIL_CERTIFIED`.
- Covenants must reject non-deterministic or unparseable JSON manifests.
