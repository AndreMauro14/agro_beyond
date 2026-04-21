import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_ENABLED = os.getenv("GEMINI_ENABLED", "false").strip().lower() in ("1", "true", "yes", "on")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY")) if GEMINI_ENABLED else None

def analisar_mensagem(texto: str):
    """Analisa a mensagem e retorna JSON estruturado"""

    if not GEMINI_ENABLED:
        print("[Gemini] desligado (GEMINI_ENABLED=false) — pulando análise")
        return None

    prompt = f"""
Você é um assistente agrícola. Analise a mensagem abaixo e retorne APENAS um JSON válido (sem markdown, sem ```).

Identifique se é uma OCORRENCIA (problema na plantação) ou GASTO (compra de produto/insumo) ou AMBOS.

Mensagem: "{texto}"

Retorne exatamente neste formato JSON:
{{
    "tipo": "ocorrencia" ou "gasto" ou "ambos" ou "indefinido",
    "descricao": "resumo claro do problema ou compra",
    "setor": "local mencionado ou null",
    "cultura": "tipo de plantação mencionada ou null",
    "urgencia": "alta", "media" ou "baixa",
    "produto": "nome do produto se for gasto ou null",
    "valor_unitario": numero ou null,
    "quantidade": numero ou 1,
    "valor_total": numero ou null
}}

Se não conseguir identificar informações agrícolas relevantes, retorne tipo "indefinido".
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        
        resultado = response.text.strip()
        
        # Remove possíveis ``` do início/fim
        if resultado.startswith("```"):
            resultado = resultado.split("\n", 1)[1]
        if resultado.endswith("```"):
            resultado = resultado.rsplit("```", 1)[0]
        
        print(f"[Gemini] Resposta: {resultado}")
        return resultado
        
    except Exception as e:
        print(f"[Gemini] Erro: {e}")
        return None
# reload
