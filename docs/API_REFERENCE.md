# 📖 DracoPact Contract API Reference

Comprehensive reference for the `DracoPact` GenVM Intelligent Contract (`contracts/draco_pact.py`).

---

## Public Write Methods

### 1. `seal_covenant`
```python
@gl.public.write
def seal_covenant(
    self,
    name: str,
    domain: str,
    covenant_prose: str,
    action_manifest_json: str
) -> u256
```
Establishes a new root governance covenant and seals Epoch 1 as active canon.
- **Parameters:**
  - `name`: Human-readable covenant title (4-120 chars).
  - `domain`: Recognized category (`TREASURY_ALLOCATION`, `GRANT_COVENANT`, `SECURITY_DIRECTIVE`, `CORE_CONSTITUTION`, `OPERATIONAL_MANDATE`).
  - `covenant_prose`: Full text mandate prose (min 60 chars, max 4000 chars).
  - `action_manifest_json`: JSON string containing an array of executable calldata action objects.
- **Returns:** Assigned `covenant_id` (`u256`).
- **Reverts:** `COVENANT_NAME_TOO_SHORT`, `INVALID_COVENANT_DOMAIN`, `COVENANT_PROSE_TOO_SHORT`, `INVALID_ACTION_MANIFEST`.

---

### 2. `submit_codicil`
```python
@gl.public.write
def submit_codicil(
    self,
    covenant_id: u256,
    expected_epoch: u256,
    parent_prose_hash: str,
    revised_prose: str,
    changelog_disclosure: str,
    revised_manifest_json: str
) -> u256
```
Drafts a prospective revision (codicil) against the currently active covenant canon epoch.
- **Parameters:**
  - `covenant_id`: Identifier of the target covenant.
  - `expected_epoch`: Active epoch sequence number for optimistic concurrency.
  - `parent_prose_hash`: Expected parent SHA-256 prose digest.
  - `revised_prose`: Updated covenant prose (min 60 chars).
  - `changelog_disclosure`: Proposer's natural language disclosure (min 20 chars).
  - `revised_manifest_json`: Proposed executable calldata actions JSON.
- **Returns:** Assigned `codicil_id` (`u256`).
- **Reverts:** `COVENANT_NOT_FOUND`, `STALE_COVENANT_EPOCH`, `PARENT_EPOCH_INACTIVE`, `PARENT_PROSE_HASH_MISMATCH`, `REVISED_PROSE_TOO_SHORT`, `CHANGELOG_DISCLOSURE_TOO_SHORT`, `INVALID_ACTION_MANIFEST`.

---

### 3. `adjudicate_codicil`
```python
@gl.public.write
def adjudicate_codicil(
    self,
    codicil_id: u256,
    expected_epoch: u256
) -> u256
```
Executes multi-validator semantic consensus via `gl.eq_principle.prompt_comparative`.
- **Returns:** Assigned `verdict_id` (`u256`).
- **Status Updates:** Transitions codicil to `COUNCIL_CERTIFIED`, `COUNCIL_VETOED`, or `CONSENSUS_STALEMATE`.

---

### 4. `commit_codicil`
```python
@gl.public.write
def commit_codicil(
    self,
    covenant_id: u256,
    codicil_id: u256,
    expected_epoch: u256
) -> str
```
Commits a certified codicil into active canon. Strictly restricted to the original covenant guardian.
- **Returns:** `"COVENANT_ACTIVE"`.
- **Reverts:** `ONLY_COVENANT_GUARDIAN`, `STALE_COVENANT_EPOCH`, `CODICIL_NOT_CERTIFIED`, `PARENT_EPOCH_MISMATCH`.

---

## Public View Methods

- `get_covenant(covenant_id: u256) -> dict`
- `get_codicil(codicil_id: u256) -> dict`
- `get_verdict(verdict_id: u256) -> dict`
- `get_protocol_telemetry() -> dict`
- `get_protocol_metadata() -> dict`
