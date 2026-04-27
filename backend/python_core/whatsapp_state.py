import json
import os
import time
from pathlib import Path

STATE_FILE = Path(__file__).parent / ".whatsapp_state.json"
QR_TTL_SECONDS = 60

STATUS_DISCONNECTED = "disconnected"
STATUS_PAIRING = "pairing"
STATUS_CONNECTED = "connected"

def _read() -> dict:
    if not STATE_FILE.exists():
        return {"status": STATUS_DISCONNECTED, "qr": None, "qr_expires_at": None, "updated_at": None}
    try:
        with STATE_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {"status": STATUS_DISCONNECTED, "qr": None, "qr_expires_at": None, "updated_at": None}

def _write(state: dict) -> None:
    state["updated_at"] = int(time.time())
    tmp = STATE_FILE.with_suffix(STATE_FILE.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(state, f)
    os.replace(tmp, STATE_FILE)

def set_status(status: str) -> None:
    state = _read()
    state["status"] = status
    _write(state)

def get_status() -> str:
    return _read().get("status") or STATUS_DISCONNECTED

def set_qr(qr: str) -> None:
    state = _read()
    state["qr"] = qr
    state["qr_expires_at"] = int(time.time()) + QR_TTL_SECONDS
    state["status"] = STATUS_PAIRING
    _write(state)

def get_qr() -> str | None:
    state = _read()
    qr = state.get("qr")
    expires = state.get("qr_expires_at") or 0
    if not qr or time.time() >= expires:
        return None
    return qr

def clear_qr() -> None:
    state = _read()
    state["qr"] = None
    state["qr_expires_at"] = None
    _write(state)

PAIR_CODE_TTL_SECONDS = 90  # WhatsApp pair codes expiram em ~60-90s

def set_pair_code(code: str, phone: str | None = None) -> None:
    state = _read()
    state["pair_code"] = code
    state["pair_code_phone"] = phone
    state["pair_code_expires_at"] = int(time.time()) + PAIR_CODE_TTL_SECONDS
    state["status"] = STATUS_PAIRING
    _write(state)

def clear_pair_code() -> None:
    state = _read()
    state["pair_code"] = None
    state["pair_code_phone"] = None
    state["pair_code_expires_at"] = None
    _write(state)

def get_updated_at() -> int | None:
    return _read().get("updated_at")

def snapshot() -> dict:
    state = _read()
    now = time.time()

    qr = state.get("qr")
    qr_expires = state.get("qr_expires_at") or 0
    if qr and now >= qr_expires:
        qr = None

    pair_code = state.get("pair_code")
    pair_expires = state.get("pair_code_expires_at") or 0
    if pair_code and now >= pair_expires:
        pair_code = None

    return {
        "status": state.get("status") or STATUS_DISCONNECTED,
        "qr": qr,
        "pair_code": pair_code,
        "pair_code_phone": state.get("pair_code_phone") if pair_code else None,
        "updated_at": state.get("updated_at"),
    }
