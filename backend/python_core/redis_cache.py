import redis
import os
from dotenv import load_dotenv

load_dotenv()

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

# ============ OUTBOX (mensagens que a API quer que o bot envie) ============

OUTBOX_KEY = "whatsapp:outbox"

def enfileirar_envio(telefone: str, texto: str) -> None:
    """API enfileira uma mensagem pro bot enviar via WhatsApp."""
    import json as _json
    payload = _json.dumps({"telefone": telefone, "texto": texto})
    redis_client.lpush(OUTBOX_KEY, payload)

def consumir_envio(timeout: int = 5):
    """Bot consome a próxima mensagem da fila (bloqueante). Retorna dict ou None."""
    import json as _json
    item = redis_client.brpop(OUTBOX_KEY, timeout=timeout)
    if not item:
        return None
    _, raw = item
    try:
        return _json.loads(raw)
    except Exception:
        return None

# ============ CODIGOS DE VERIFICACAO WHATSAPP ============

def salvar_codigo_verificacao(usuario_id: int, telefone: str, codigo: str, ttl: int = 600) -> None:
    """Salva código de verificação por (telefone, usuario_id). TTL em segundos."""
    chave = f"verify:{telefone}"
    redis_client.setex(chave, ttl, f"{usuario_id}:{codigo}")

def validar_codigo_verificacao(telefone: str, codigo: str):
    """Retorna usuario_id se o código bate, senão None. Consome em caso de sucesso."""
    chave = f"verify:{telefone}"
    armazenado = redis_client.get(chave)
    if not armazenado:
        return None
    try:
        uid_str, code = armazenado.split(":", 1)
    except ValueError:
        return None
    if code != codigo.strip():
        return None
    redis_client.delete(chave)
    return int(uid_str)