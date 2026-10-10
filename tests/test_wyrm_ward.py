import json
import pytest
from conftest import (
    GUARDIAN_A,
    PROPOSER_B,
    OUTSIDER_C,
    COVENANT_BASELINE_PROSE,
    CODICIL_DISCLOSED_PROSE,
    CODICIL_CONCEALED_PROSE,
    DISCLOSURE_HONEST,
    DISCLOSURE_DECEPTIVE,
    BASELINE_ACTIONS,
    EXPANDED_ACTIONS,
    MUTATED_RECIPIENT_ACTIONS,
    UserError,
)


def create_covenant(contract, name="Security Guild Treasury Covenant", domain="TREASURY_ALLOCATION"):
    return contract.seal_covenant(
        name=name,
        domain=domain,
        covenant_prose=COVENANT_BASELINE_PROSE,
        action_manifest_json=json.dumps(BASELINE_ACTIONS),
    )


# -----------------------------------------------------------------------------
# 1. Covenant Sealing & Baseline Invariants
# -----------------------------------------------------------------------------

def test_seal_covenant_initializes_epoch_one(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()

    cid = create_covenant(contract)
    assert int(cid) == 1

    covenant = contract.get_covenant(cid)
    assert covenant["covenant_id"] == 1
    assert covenant["name"] == "Security Guild Treasury Covenant"
    assert covenant["guardian"] == GUARDIAN_A
    assert covenant["current_epoch"] == 1
    assert covenant["active_codicil_id"] == 1
    assert covenant["status"] == "COVENANT_ACTIVE"

    codicil = contract.get_codicil(covenant["active_codicil_id"])
    assert codicil["codicil_id"] == 1
    assert codicil["epoch_number"] == 1
    assert codicil["status"] == "COVENANT_ACTIVE"
    assert codicil["prose_hash"].startswith("sha256:")
    assert codicil["manifest_hash"].startswith("sha256:")
    assert codicil["divergence_flags"] == []


def test_seal_covenant_rejects_short_name(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    with pytest.raises(UserError, match="COVENANT_NAME_TOO_SHORT"):
        contract.seal_covenant("DAO", "TREASURY_ALLOCATION", COVENANT_BASELINE_PROSE, json.dumps(BASELINE_ACTIONS))


def test_seal_covenant_rejects_invalid_domain(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    with pytest.raises(UserError, match="INVALID_COVENANT_DOMAIN"):
        contract.seal_covenant("Treasury Guard", "RANDOM_DOMAIN", COVENANT_BASELINE_PROSE, json.dumps(BASELINE_ACTIONS))


def test_seal_covenant_rejects_short_prose(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    with pytest.raises(UserError, match="COVENANT_PROSE_TOO_SHORT"):
        contract.seal_covenant("Treasury Guard", "TREASURY_ALLOCATION", "Too brief text.", json.dumps(BASELINE_ACTIONS))


def test_seal_covenant_rejects_malformed_manifest_json(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    with pytest.raises(UserError, match="INVALID_ACTION_MANIFEST"):
        contract.seal_covenant("Treasury Guard", "TREASURY_ALLOCATION", COVENANT_BASELINE_PROSE, "invalid-json")


# -----------------------------------------------------------------------------
# 2. Codicil Submission & Optimistic Concurrency Controls
# -----------------------------------------------------------------------------

def test_submit_codicil_detects_capital_delta(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
    )

    codicil = contract.get_codicil(codid)
    assert codicil["codicil_id"] == 2
    assert codicil["status"] == "CODICIL_PENDING"
    assert "CAPITAL_DELTA" in codicil["divergence_flags"]


def test_submit_codicil_detects_recipient_divergence(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_CONCEALED_PROSE,
        changelog_disclosure=DISCLOSURE_DECEPTIVE,
        revised_manifest_json=json.dumps(MUTATED_RECIPIENT_ACTIONS),
    )

    codicil = contract.get_codicil(codid)
    assert "RECIPIENT_DIVERGENCE" in codicil["divergence_flags"]
    assert "CAPITAL_DELTA" in codicil["divergence_flags"]


def test_submit_codicil_rejects_stale_expected_epoch(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    with pytest.raises(UserError, match="STALE_COVENANT_EPOCH"):
        contract.submit_codicil(
            covenant_id=cid,
            expected_epoch=99,  # Wrong epoch
            parent_prose_hash=baseline["prose_hash"],
            revised_prose=CODICIL_DISCLOSED_PROSE,
            changelog_disclosure=DISCLOSURE_HONEST,
            revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
        )


def test_submit_codicil_rejects_parent_hash_mismatch(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)

    with pytest.raises(UserError, match="PARENT_PROSE_HASH_MISMATCH"):
        contract.submit_codicil(
            covenant_id=cid,
            expected_epoch=covenant["current_epoch"],
            parent_prose_hash="sha256:0000000000000000000000000000000000000000000000000000000000000000",
            revised_prose=CODICIL_DISCLOSED_PROSE,
            changelog_disclosure=DISCLOSURE_HONEST,
            revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
        )


# -----------------------------------------------------------------------------
# 3. The Dragon's Breath Pre-Filter Edge Cases
# -----------------------------------------------------------------------------

def test_detects_zero_address_recipient_alert(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    zero_actions = [
        {
            **BASELINE_ACTIONS[0],
            "recipient": "0x0000000000000000000000000000000000000000",
        }
    ]

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(zero_actions),
    )

    codicil = contract.get_codicil(codid)
    assert "ZERO_ADDRESS_ALERT" in codicil["divergence_flags"]


def test_detects_unlimited_allowance_alert(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    overflow_actions = [
        {
            **BASELINE_ACTIONS[0],
            "amount": 10**32,  # Astronomical amount
        }
    ]

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(overflow_actions),
    )

    codicil = contract.get_codicil(codid)
    assert "UNLIMITED_ALLOWANCE_ALERT" in codicil["divergence_flags"]


# -----------------------------------------------------------------------------
# 4. Dragon Council Semantic Adjudication
# -----------------------------------------------------------------------------

def test_adjudicate_certifies_disclosed_expansion(setup_mock_genlayer):
    gl_mock = setup_mock_genlayer["gl"]
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
    )

    gl_mock.nondet.output = {
        "assessment": "CERTIFIED_BENIGN",
        "threat_tags": ["EXECUTABLE_ACTION_DELTA", "AUTHORITY_EXPANSION"],
        "disclosure_integrity": True,
        "scope_broadened": True,
        "risk_score": 30,
    }

    vid = contract.adjudicate_codicil(codid, covenant["current_epoch"])
    verdict = contract.get_verdict(vid)
    assert verdict["final_status"] == "COUNCIL_CERTIFIED"
    assert verdict["disclosure_integrity"] is True
    assert verdict["risk_score"] == 30

    codicil = contract.get_codicil(codid)
    assert codicil["status"] == "COUNCIL_CERTIFIED"


def test_adjudicate_certifies_editorial_clarification(setup_mock_genlayer):
    gl_mock = setup_mock_genlayer["gl"]
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    editorial_prose = COVENANT_BASELINE_PROSE + " All reports must be documented on IPFS."
    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=editorial_prose,
        changelog_disclosure="Clarified IPFS archival requirement with zero financial or permission modifications.",
        revised_manifest_json=json.dumps(BASELINE_ACTIONS),  # Same actions
    )

    gl_mock.nondet.output = {
        "assessment": "EDITORIAL_APPROVED",
        "threat_tags": [],
        "disclosure_integrity": True,
        "scope_broadened": False,
        "risk_score": 5,
    }

    vid = contract.adjudicate_codicil(codid, covenant["current_epoch"])
    verdict = contract.get_verdict(vid)
    assert verdict["final_status"] == "COUNCIL_CERTIFIED"
    assert verdict["assessment"] == "EDITORIAL_APPROVED"


def test_adjudicate_vetoes_concealed_expansion(setup_mock_genlayer):
    gl_mock = setup_mock_genlayer["gl"]
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_CONCEALED_PROSE,
        changelog_disclosure=DISCLOSURE_DECEPTIVE,
        revised_manifest_json=json.dumps(MUTATED_RECIPIENT_ACTIONS),
    )

    gl_mock.nondet.output = {
        "assessment": "BREACH_VETOED",
        "threat_tags": ["BENEFICIARY_MUTATION", "EXECUTABLE_ACTION_DELTA", "PURPOSE_DRIFT"],
        "disclosure_integrity": False,
        "scope_broadened": True,
        "risk_score": 95,
    }

    vid = contract.adjudicate_codicil(codid, covenant["current_epoch"])
    verdict = contract.get_verdict(vid)
    assert verdict["final_status"] == "COUNCIL_VETOED"
    assert verdict["risk_score"] == 95

    codicil = contract.get_codicil(codid)
    assert codicil["status"] == "COUNCIL_VETOED"


def test_deterministic_override_blocks_hallucinating_model(setup_mock_genlayer):
    gl_mock = setup_mock_genlayer["gl"]
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    # Has actions diff (CAPITAL_DELTA)
    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_CONCEALED_PROSE,
        changelog_disclosure=DISCLOSURE_DECEPTIVE,
        revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
    )

    # Hallucinating LLM says harmless EDITORIAL_APPROVED despite action diff
    gl_mock.nondet.output = {
        "assessment": "EDITORIAL_APPROVED",
        "threat_tags": [],
        "disclosure_integrity": True,
        "scope_broadened": False,
        "risk_score": 10,
    }

    vid = contract.adjudicate_codicil(codid, covenant["current_epoch"])
    verdict = contract.get_verdict(vid)
    # The deterministic rule overrides the hallucination and vetoes it!
    assert verdict["final_status"] == "COUNCIL_VETOED"


def test_adjudicate_handles_consensus_stalemate(setup_mock_genlayer):
    gl_mock = setup_mock_genlayer["gl"]
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
    )

    # Corrupted / unparseable output
    gl_mock.nondet.output = "GARBAGE_NON_JSON"

    vid = contract.adjudicate_codicil(codid, covenant["current_epoch"])
    verdict = contract.get_verdict(vid)
    assert verdict["final_status"] == "CONSENSUS_STALEMATE"

    codicil = contract.get_codicil(codid)
    assert codicil["status"] == "CONSENSUS_STALEMATE"


# -----------------------------------------------------------------------------
# 5. The Guardian's Seal: Commit & Sovereign Enactment
# -----------------------------------------------------------------------------

def test_commit_codicil_atomically_advances_epoch(setup_mock_genlayer):
    gl_mock = setup_mock_genlayer["gl"]
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
    )

    gl_mock.nondet.output = {
        "assessment": "CERTIFIED_BENIGN",
        "threat_tags": ["EXECUTABLE_ACTION_DELTA"],
        "disclosure_integrity": True,
        "scope_broadened": True,
        "risk_score": 20,
    }
    contract.adjudicate_codicil(codid, covenant["current_epoch"])

    # Commit as author (GUARDIAN_A)
    res = contract.commit_codicil(cid, codid, covenant["current_epoch"])
    assert res == "COVENANT_ACTIVE"

    updated_covenant = contract.get_covenant(cid)
    assert updated_covenant["current_epoch"] == 2
    assert updated_covenant["active_codicil_id"] == 2

    old_epoch = contract.get_codicil(1)
    assert old_epoch["status"] == "SUPERSEDED_HISTORIC"

    new_epoch = contract.get_codicil(2)
    assert new_epoch["status"] == "COVENANT_ACTIVE"
    assert new_epoch["enacted_at"] > 0


def test_commit_codicil_rejects_unauthorized_outsider(setup_mock_genlayer):
    gl_mock = setup_mock_genlayer["gl"]
    module = setup_mock_genlayer["module"]
    caller_state = setup_mock_genlayer["caller_state"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
    )

    gl_mock.nondet.output = {
        "assessment": "CERTIFIED_BENIGN",
        "threat_tags": ["EXECUTABLE_ACTION_DELTA"],
        "disclosure_integrity": True,
        "scope_broadened": True,
        "risk_score": 20,
    }
    contract.adjudicate_codicil(codid, covenant["current_epoch"])

    # Switch caller to OUTSIDER_C
    caller_state["address"] = OUTSIDER_C
    with pytest.raises(UserError, match="ONLY_COVENANT_GUARDIAN"):
        contract.commit_codicil(cid, codid, covenant["current_epoch"])


def test_commit_codicil_rejects_uncertified_status(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    codid = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
    )

    # Still CODICIL_PENDING (never adjudicated)
    with pytest.raises(UserError, match="CODICIL_NOT_CERTIFIED"):
        contract.commit_codicil(cid, codid, covenant["current_epoch"])


def test_commit_codicil_rejects_parent_epoch_mismatch(setup_mock_genlayer):
    gl_mock = setup_mock_genlayer["gl"]
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    cid = create_covenant(contract)
    covenant = contract.get_covenant(cid)
    baseline = contract.get_codicil(covenant["active_codicil_id"])

    # Submit and certify codicil 2
    codid2 = contract.submit_codicil(
        covenant_id=cid,
        expected_epoch=covenant["current_epoch"],
        parent_prose_hash=baseline["prose_hash"],
        revised_prose=CODICIL_DISCLOSED_PROSE,
        changelog_disclosure=DISCLOSURE_HONEST,
        revised_manifest_json=json.dumps(EXPANDED_ACTIONS),
    )
    gl_mock.nondet.output = {
        "assessment": "CERTIFIED_BENIGN",
        "threat_tags": ["EXECUTABLE_ACTION_DELTA"],
        "disclosure_integrity": True,
        "scope_broadened": True,
        "risk_score": 15,
    }
    contract.adjudicate_codicil(codid2, 1)
    contract.commit_codicil(cid, codid2, 1)

    # Now covenant is at epoch 2. Submitting codicil 3 against epoch 1 parent must fail commit
    with pytest.raises(UserError, match="STALE_COVENANT_EPOCH"):
        contract.commit_codicil(cid, codid2, 1)


def test_protocol_telemetry_and_metadata(setup_mock_genlayer):
    module = setup_mock_genlayer["module"]
    contract = module.DracoPact()
    create_covenant(contract)

    telemetry = contract.get_protocol_telemetry()
    assert telemetry["covenants"] == 1
    assert telemetry["codicils"] == 1
    assert telemetry["verdicts"] == 0

    meta = contract.get_protocol_metadata()
    assert meta["protocol_name"] == "DracoPact"
    assert meta["architecture"] == "multi-validator-covenant-revision-sentry"
    assert meta["custodial_funds"] is False
