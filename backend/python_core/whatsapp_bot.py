from neonize.client import NewClient
from neonize.events import PairStatusEv, MessageEv, ConnectedEv, DisconnectedEv, LoggedOutEv
from neonize.utils.message import extract_text
import requests
import os
from pathlib import Path
from dotenv import load_dotenv, find_dotenv
from redis_cache import adicionar_mensagem, pegar_mensagens, limpar_mensagens, consumir_envio
from whatsapp_state import (
    set_qr, clear_qr, set_status, set_pair_code, clear_pair_code,
    STATUS_CONNECTED, STATUS_DISCONNECTED, STATUS_PAIRING,
)
import threading

PAIR_REQUEST_FILE = Path(__file__).resolve().parent / "pair_request.txt"

load_dotenv(find_dotenv())

API_URL = os.getenv("API_URL", "http://localhost:8000/webhook")
TEMPO_ESPERA = int(os.getenv("MESSAGE_BUFFER_SECONDS", "20"))

# ID do chat/grupo permitido. Se vazio (""), aceita tudo (modo dev).
# Em produção: coloque o ID do grupo dedicado no .env.
GRUPO_MANDACA = os.getenv("GRUPO_WHATSAPP", "").strip() or None

timers = {}

client = NewClient("Mandaca")

set_status(STATUS_DISCONNECTED)

def enviar_para_api(telefone: str, chat_id: str):
    """Envia mensagens acumuladas para a API"""
    from redis_cache import redis_client
    chave = f"chat:{telefone}"
    ttl_now = redis_client.ttl(chave)
    mensagens = pegar_mensagens(telefone)
    print(f"[Timer] Disparou para {telefone}: buffer_existe={mensagens is not None} ttl_now={ttl_now}", flush=True)

    if not mensagens:
        print(f"[Timer] AVISO: buffer de {telefone} estava vazio (TTL expirou antes?)", flush=True)
        return

    print(f"[Timer] Enviando mensagens de {telefone}: {mensagens}", flush=True)
    try:
        response = requests.post(API_URL, json={
            "telefone": telefone,
            "texto": mensagens,
            "chat_id": chat_id
        }, timeout=10)
        print(f"[API] Response ({response.status_code}): {response.text[:200]}", flush=True)
        limpar_mensagens(telefone)
    except Exception as e:
        print(f"[Erro] Ao enviar para API: {e!r}", flush=True)

def agendar_envio(telefone: str, chat_id: str):
    """Agenda o envio das mensagens após o tempo de espera"""
    if telefone in timers:
        timers[telefone].cancel()

    timer = threading.Timer(TEMPO_ESPERA, enviar_para_api, args=[telefone, chat_id])
    timer.start()
    timers[telefone] = timer
    print(f"[Timer] Agendado envio de {telefone} em {TEMPO_ESPERA}s")

_pending_pair_phone: str | None = None


@client.qr
def on_qr(_client, qr_bytes: bytes):
    """Callback chamado quando o neonize gera um QR para pareamento.
    Se houver telefone pendente (vindo de pair_request.txt), gera pair code
    em vez de exibir QR — único momento em que o cliente Go já existe e o
    modo de pareamento ainda não foi fechado."""
    global _pending_pair_phone
    if _pending_pair_phone:
        phone = _pending_pair_phone
        _pending_pair_phone = None
        print(f"[Pair] Solicitando código para {phone} no callback on_qr...", flush=True)
        try:
            code = _client.PairPhone(phone, show_push_notification=True)
            print(f"[Pair] Código gerado: {code}", flush=True)
            set_pair_code(code, phone)
        except Exception as e:
            print(f"[Pair] Erro ao gerar código: {e!r}", flush=True)
        return

    qr_string = qr_bytes.decode("utf-8", errors="ignore").strip()
    print(f"[QR] Novo QR code recebido (len={len(qr_string)})", flush=True)
    set_qr(qr_string)

@client.event(PairStatusEv)
def on_pair(client, event):
    print("="*50)
    print("STATUS DE PAREAMENTO")
    print(f"ID: {event.ID}")
    print("="*50)
    set_status(STATUS_PAIRING)

@client.event(ConnectedEv)
def on_connected(client, event):
    print("="*50)
    print("WHATSAPP CONECTADO COM SUCESSO!")
    print("="*50)
    clear_qr()
    clear_pair_code()
    set_status(STATUS_CONNECTED)
    threading.Thread(target=_outbox_worker, args=(client,), daemon=True).start()


def _outbox_worker(client):
    """Consome a fila Redis 'whatsapp:outbox' e envia via Neonize."""
    from neonize.utils.jid import build_jid
    print("[Outbox] Worker iniciado", flush=True)
    while True:
        try:
            item = consumir_envio(timeout=10)
            if not item:
                continue
            telefone = "".join(c for c in str(item.get("telefone", "")) if c.isdigit())
            texto = item.get("texto", "")
            if not telefone or not texto:
                continue
            try:
                jid = build_jid(telefone)
                client.send_message(jid, texto)
                print(f"[Outbox] Enviado para {telefone}", flush=True)
            except Exception as e:
                print(f"[Outbox] Erro ao enviar para {telefone}: {e!r}", flush=True)
        except Exception as e:
            print(f"[Outbox] Erro no loop: {e!r}", flush=True)

@client.event(DisconnectedEv)
def on_disconnected(client, event):
    print("[WhatsApp] Desconectado")
    set_status(STATUS_DISCONNECTED)

@client.event(LoggedOutEv)
def on_logged_out(client, event):
    print("[WhatsApp] Logged out — precisa parear novamente")
    clear_qr()
    set_status(STATUS_DISCONNECTED)

@client.event(MessageEv)
def on_message(client, event):
    if event.Info.MessageSource.IsFromMe:
        return

    chat = str(event.Info.MessageSource.Chat)
    telefone = event.Info.MessageSource.Sender.User
    texto = extract_text(event.Message)

    print(f"Chat: {chat}")
    print(f"De: {telefone}")
    print(f"Texto: {texto}")
    print("-"*30)

    if GRUPO_MANDACA is not None and GRUPO_MANDACA not in chat and GRUPO_MANDACA not in telefone:
        print(f"[Filtro] Ignorando chat={chat[:40]!r}: fora do grupo {GRUPO_MANDACA}", flush=True)
        return

    if texto:
        adicionar_mensagem(telefone, texto)
        agendar_envio(telefone, chat)

def _consume_pair_request() -> str | None:
    """Lê e remove o arquivo de solicitação de pair code, se existir."""
    if not PAIR_REQUEST_FILE.exists():
        return None
    try:
        phone = PAIR_REQUEST_FILE.read_text(encoding="utf-8").strip()
    except Exception as e:
        print(f"[Pair] Erro lendo {PAIR_REQUEST_FILE}: {e!r}", flush=True)
        return None
    finally:
        try:
            PAIR_REQUEST_FILE.unlink(missing_ok=True)
        except Exception:
            pass
    return phone or None


if __name__ == "__main__":
    print("Manda Cá - WhatsApp Bot")
    print("Iniciando...")
    print(f"Tempo de espera entre mensagens: {TEMPO_ESPERA}s")
    print(f"Filtro de grupo: {GRUPO_MANDACA or '(DESLIGADO — aceita tudo)'}")

    _pending_pair_phone = _consume_pair_request()
    if _pending_pair_phone:
        print(f"[Pair] Pair code pendente para {_pending_pair_phone} — será gerado no callback on_qr", flush=True)

    client.connect()
