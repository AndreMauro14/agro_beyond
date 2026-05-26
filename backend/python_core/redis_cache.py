import redis
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

if REDIS_URL:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
else:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        decode_responses=True
    )

TEMPO_ESPERA = int(os.getenv("MESSAGE_BUFFER_SECONDS", "20"))
# TTL do Redis precisa ser maior que o timer pra evitar que o buffer expire
# antes do timer do bot disparar
BUFFER_TTL = TEMPO_ESPERA + 60

def adicionar_mensagem(telefone: str, texto: str):
    """Adiciona mensagem ao buffer do usuário"""
    chave = f"chat:{telefone}"
    
    # Pega mensagens anteriores
    mensagens = redis_client.get(chave)
    
    if mensagens:
        mensagens = mensagens + " | " + texto
    else:
        mensagens = texto
    
    # Salva e reseta o timer
    redis_client.setex(chave, BUFFER_TTL, mensagens)
    print(f"[Redis] Buffer de {telefone} (TTL={redis_client.ttl(chave)}s): {mensagens}", flush=True)

def pegar_mensagens(telefone: str):
    """Pega todas as mensagens acumuladas"""
    chave = f"chat:{telefone}"
    return redis_client.get(chave)

def limpar_mensagens(telefone: str):
    """Limpa o buffer do usuário"""
    chave = f"chat:{telefone}"
    redis_client.delete(chave)

def tem_mensagens_pendentes(telefone: str):
    """Verifica se tem mensagens no buffer"""
    chave = f"chat:{telefone}"
    return redis_client.exists(chave)

def tempo_restante(telefone: str):
    """Retorna quantos segundos faltam pra expirar"""
    chave = f"chat:{telefone}"
    return redis_client.ttl(chave)