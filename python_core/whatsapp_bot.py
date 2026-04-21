from neonize.client import NewClient
from neonize.events import PairStatusEv, MessageEv, ConnectedEv, DisconnectedEv, LoggedOutEv
from neonize.utils.message import extract_text
import requests
import os
from dotenv import load_dotenv
from redis_cache import adicionar_mensagem, pegar_mensagens, limpar_mensagens
from whatsapp_state import (
    set_qr, clear_qr, set_status,
    STATUS_CONNECTED, STATUS_DISCONNECTED, STATUS_PAIRING,
)
import threading

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000/webhook")
TEMPO_ESPERA = int(os.getenv("MESSAGE_BUFFER_SECONDS", "20"))

GRUPO_AGROFLOW = None

timers = {}

client = NewClient("AgroFlow")

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

@client.qr
def on_qr(_client, qr_bytes: bytes):
    """Callback chamado quando o neonize gera um QR para pareamento."""
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
    set_status(STATUS_CONNECTED)

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

    if GRUPO_AGROFLOW is None or GRUPO_AGROFLOW in chat:
        if texto:
            adicionar_mensagem(telefone, texto)
            agendar_envio(telefone, chat)

if __name__ == "__main__":
    print("Manda Cá - WhatsApp Bot")
    print("Iniciando...")
    print(f"Tempo de espera entre mensagens: {TEMPO_ESPERA}s")
    client.connect()
