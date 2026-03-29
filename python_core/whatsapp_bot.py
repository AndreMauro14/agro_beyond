from neonize.client import NewClient
from neonize.events import PairStatusEv, MessageEv, ConnectedEv
from neonize.utils.message import extract_text
import requests

API_URL = "http://localhost:8000/webhook"

GRUPO_AGROFLOW = None  # Coloca o ID do grupo aqui

client = NewClient("AgroFlow")

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
            print(f">>> ENVIANDO PARA API...")
            try:
                response = requests.post(API_URL, json={
                    "telefone": telefone,
                    "texto": texto,
                    "chat_id": chat
                })
                print(f"API Response: {response.json()}")
            except Exception as e:
                print(f"Erro ao enviar para API: {e}")

if __name__ == "__main__":
    print("AgroFlow WhatsApp Bot")
    print("Iniciando...")
    client.connect()