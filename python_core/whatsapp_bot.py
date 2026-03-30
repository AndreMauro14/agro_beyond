from neonize.client import NewClient
from neonize.events import PairStatusEv, MessageEv, ConnectedEv
from neonize.utils.message import extract_text
import requests
import os
from dotenv import load_dotenv
from redis_cache import adicionar_mensagem, pegar_mensagens, limpar_mensagens
import threading
import time

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000/webhook")
TEMPO_ESPERA = 120  # 2 minutos

GRUPO_AGROFLOW = None

# Dicionário pra controlar os timers por usuário
timers = {}

client = NewClient("AgroFlow")

def enviar_para_api(telefone: str, chat_id: str):
    """Envia mensagens acumuladas para a API"""
    mensagens = pegar_mensagens(telefone)
    
    if mensagens:
        print(f"[Timer] Enviando mensagens de {telefone}: {mensagens}")
        try:
            response = requests.post(API_URL, json={
                "telefone": telefone,
                "texto": mensagens,
                "chat_id": chat_id
            })
            print(f"[API] Response: {response.json()}")
            limpar_mensagens(telefone)
        except Exception as e:
            print(f"[Erro] Ao enviar para API: {e}")

def agendar_envio(telefone: str, chat_id: str):
    """Agenda o envio das mensagens após o tempo de espera"""
    # Cancela timer anterior se existir
    if telefone in timers:
        timers[telefone].cancel()
    
    # Cria novo timer
    timer = threading.Timer(TEMPO_ESPERA, enviar_para_api, args=[telefone, chat_id])
    timer.start()
    timers[telefone] = timer
    print(f"[Timer] Agendado envio de {telefone} em {TEMPO_ESPERA}s")

@client.event(PairStatusEv)
def on_pair(client, event):
    print("="*50)
    print("STATUS DE PAREAMENTO")
    print(f"ID: {event.ID}")
    print("="*50)

@client.event(ConnectedEv)
def on_connected(client, event):
    print("="*50)
    print("WHATSAPP CONECTADO COM SUCESSO!")
    print("="*50)

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
            # Adiciona ao buffer do Redis
            adicionar_mensagem(telefone, texto)
            # Agenda envio (reseta timer se já existir)
            agendar_envio(telefone, chat)

if __name__ == "__main__":
    print("AgroFlow WhatsApp Bot")
    print("Iniciando...")
    print(f"Tempo de espera entre mensagens: {TEMPO_ESPERA}s")
    client.connect()