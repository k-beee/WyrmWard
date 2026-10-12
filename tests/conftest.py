import importlib.util
import json
import sys
import types
import typing
from pathlib import Path
import pytest

GUARDIAN_A = "0x1111111111111111111111111111111111111111"
PROPOSER_B = "0x2222222222222222222222222222222222222222"
OUTSIDER_C = "0x3333333333333333333333333333333333333333"

COVENANT_BASELINE_PROSE = (
    "Establish the Dragon Citadel Security Guild Treasury Covenant with an allocation of 50000 units. "
    "All disbursements must fund formal verification, cryptographic fuzzing, and third-party smart contract audits."
)

CODICIL_DISCLOSED_PROSE = (
    "Establish the Dragon Citadel Security Guild Treasury Covenant with an increased allocation of 75000 units. "
    "The 25000 unit expansion funds emergency vulnerability mitigation across cross-chain rollup bridge contracts."
)

CODICIL_CONCEALED_PROSE = (
    "Establish the Dragon Citadel Security Guild Treasury Covenant with an allocation of 90000 units redirected "
    "to an offshore multisig. The recipient leads may disburse funds at their sole private discretion."
)

DISCLOSURE_HONEST = (
    "Explicitly discloses budget cap expansion from 50000 to 75000 units for emergency bridge security audits."
)

DISCLOSURE_DECEPTIVE = (
    "Minor grammatical polish, formatting adjustments, and administrative text corrections."
)

BASELINE_ACTIONS = [
    {
        "target": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "selector": "0x12345678",
        "recipient": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "asset": "0x0000000000000000000000000000000000000000",
        "value": 0,
        "amount": 50000,
    }
]

EXPANDED_ACTIONS = [
    {
        **BASELINE_ACTIONS[0],
        "amount": 75000,
    }
]

MUTATED_RECIPIENT_ACTIONS = [
    {
        **BASELINE_ACTIONS[0],
        "recipient": "0xcccccccccccccccccccccccccccccccccccccccc",
        "amount": 90000,
    }
]


class TreeMap(dict):
    @classmethod
    def __class_getitem__(cls, _):
        return cls


class U256(int):
    pass


class UserError(Exception):
    pass


class Public:
    @staticmethod
    def write(fn):
        return fn

    @staticmethod
    def view(fn):
        return fn


class Nondet:
    def __init__(self):
        self.output = {
            "assessment": "CERTIFIED_BENIGN",
            "threat_tags": ["EXECUTABLE_ACTION_DELTA", "AUTHORITY_EXPANSION"],
            "disclosure_integrity": True,
            "scope_broadened": True,
            "risk_score": 25,
        }

    def exec_prompt(self, prompt: str, *args, **kwargs):
        if isinstance(self.output, (dict, list)):
            return json.dumps(self.output)
        return str(self.output)


class EqPrinciple:
    @staticmethod
    def prompt_comparative(fn, *args, **kwargs):
        return fn()


class MockGenLayer:
    Contract = object

    def __init__(self):
        self.vm = types.SimpleNamespace(UserError=UserError)
        self.public = Public()
        self.nondet = Nondet()
        self.eq_principle = EqPrinciple()

    @staticmethod
    def contract(cls):
        return cls


@pytest.fixture(autouse=True)
def setup_mock_genlayer(monkeypatch):
    gl_mock = MockGenLayer()
    monkeypatch.setitem(sys.modules, "genlayer", gl_mock)

    caller_state = {"address": GUARDIAN_A}
    block_state = {"timestamp": 1700000000}

    genlayer_mod = types.ModuleType("genlayer")
    genlayer_mod.gl = gl_mock
    genlayer_mod.u256 = U256
    genlayer_mod.TreeMap = TreeMap
    genlayer_mod.get_caller_address = lambda: caller_state["address"]
    genlayer_mod.get_block_timestamp = lambda: block_state["timestamp"]

    monkeypatch.setitem(sys.modules, "genlayer", genlayer_mod)

    # Load contracts/wyrm_ward.py
    contract_path = Path(__file__).parent.parent / "contracts" / "wyrm_ward.py"
    spec = importlib.util.spec_from_file_location("wyrm_ward_module", contract_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    yield {
        "module": module,
        "caller_state": caller_state,
        "block_state": block_state,
        "gl": gl_mock,
    }
