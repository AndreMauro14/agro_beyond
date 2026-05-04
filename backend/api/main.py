from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import subprocess
import sys
import os
from pathlib import Path
from python_core.database import (
    save_ocorrencia, get_ocorrencias, get_ocorrencia_by_id, update_ocorrencia_status,
    delete_ocorrencia,
    save_gasto, get_gastos, get_gastos_by_ocorrencia, update_gasto_status, delete_gasto, update_gasto,
    get_total_gastos, get_gastos_por_setor,
    get_gastos_por_produto, get_gastos_por_mes,
    save_ganho, get_ganhos, delete_ganho, get_ganhos_por_mes,
)
from python_core.gemini_service import analisar_mensagem, GEMINI_ENABLED
from python_core.parser import analisar_com_regex
from python_core.whatsapp_state import snapshot as whatsapp_snapshot

app = FastAPI(title="Mandaca API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "funcionando", "app": "Mandaca", "version": "1.0.0"}

# ============ WEBHOOK WHATSAPP ============

@app.post("/webhook")
async def receber_whatsapp(request: Request):
    payload = await request.json()

    print("========== NOVA MENSAGEM RECEBIDA ==========")
    print(payload)
    print("============================================")

    telefone = payload.get("telefone", "")
    texto = payload.get("texto", "")
    foto_url = payload.get("foto_url", None)

    if not (telefone and texto):
        return {"status": "recebido"}

    # 1) tenta parser regex (grátis, rápido)
    analise = analisar_com_regex(texto)
    fonte = "regex" if analise else None

    # 2) fallback Gemini se o regex não casou e a flag tá ligada
    if not analise and GEMINI_ENABLED:
        resultado_raw = analisar_mensagem(texto)
        try:
            analise = json.loads(resultado_raw) if resultado_raw else None
            fonte = "gemini" if analise else None
        except (json.JSONDecodeError, TypeError):
            analise = None

    if not analise or analise.get("tipo") == "indefinido":
        # nenhum parser identificou → salva como ocorrência bruta pendente
        id_oc = save_ocorrencia(telefone, texto, foto_url, setor=None, status="pendente")
        return {"status": "recebido", "tipo": "indefinido", "id_ocorrencia": id_oc}

    tipo = analise.get("tipo")
    descricao = analise.get("descricao", texto)
    setor = analise.get("setor")

    # quando identificou: ocorrência já entra como "concluida" pra agilizar
    id_oc = save_ocorrencia(telefone, descricao, foto_url, setor, status="concluida")
    print(f"[Webhook] Ocorrência salva (fonte={fonte}): ID={id_oc}, tipo={tipo}, setor={setor}")

    id_gasto = None
    if tipo in ("gasto", "ambos"):
        produto = analise.get("produto")
        valor_unitario = analise.get("valor_unitario")
        quantidade = analise.get("quantidade", 1) or 1

        if produto and valor_unitario:
            id_gasto = save_gasto(
                id_oc, produto, float(valor_unitario), int(quantidade),
                status_aprovacao="aprovado",
            )
            print(f"[Webhook] Gasto salvo (aprovado): ID={id_gasto}, produto={produto}")

    return {
        "status": "recebido",
        "tipo": tipo,
        "fonte": fonte,
        "id_ocorrencia": id_oc,
        "id_gasto": id_gasto,
    }

# ============ OCORRENCIAS ============

@app.get("/ocorrencias")
def listar_ocorrencias():
    return get_ocorrencias()

@app.get("/ocorrencias/{id}")
def buscar_ocorrencia(id: int):
    oc = get_ocorrencia_by_id(id)
    if oc:
        oc["gastos"] = get_gastos_by_ocorrencia(id)
        return oc
    raise HTTPException(status_code=404, detail="Ocorrencia nao encontrada")

@app.patch("/ocorrencias/{id}/status")
async def atualizar_status_ocorrencia(id: int, request: Request):
    body = await request.json()
    status = body.get("status")
    if update_ocorrencia_status(id, status):
        return {"success": True}
    raise HTTPException(status_code=500, detail="Erro ao atualizar")

@app.delete("/ocorrencias/{id}")
def remover_ocorrencia(id: int):
    if delete_ocorrencia(id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Ocorrencia nao encontrada")

# ============ GASTOS ============

@app.get("/gastos")
def listar_gastos():
    return get_gastos()

@app.post("/gastos")
async def criar_gasto(request: Request):
    body = await request.json()
    id = save_gasto(
        id_ocorrencia=body.get("id_ocorrencia"),
        nome_produto=body.get("nome_produto"),
        valor_unitario=body.get("valor_unitario"),
        quantidade=body.get("quantidade", 1)
    )
    if id:
        return {"success": True, "id": id}
    raise HTTPException(status_code=500, detail="Erro ao salvar gasto")

@app.post("/gastos/manual")
async def criar_gasto_manual(request: Request):
    """Lançamento manual de saída via formulário do /caixa.
    Cria uma ocorrência sintética + gasto aprovado."""
    body = await request.json()
    descricao = body.get("descricao")
    valor = body.get("valor")
    setor = body.get("setor")
    if not descricao or valor is None:
        raise HTTPException(status_code=400, detail="descricao e valor são obrigatórios")

    id_oc = save_ocorrencia(
        telefone="manual",
        descricao=f"[Manual] {descricao}",
        foto_url=None,
        setor=setor,
        status="concluida",
    )
    if not id_oc:
        raise HTTPException(status_code=500, detail="Erro ao criar ocorrência")

    id_gasto = save_gasto(
        id_ocorrencia=id_oc,
        nome_produto=descricao,
        valor_unitario=float(valor),
        quantidade=1,
        status_aprovacao="aprovado",
    )
    return {"success": True, "id_ocorrencia": id_oc, "id_gasto": id_gasto}

@app.patch("/gastos/{id}/aprovar")
def aprovar_gasto(id: int):
    if update_gasto_status(id, "aprovado"):
        return {"success": True, "status": "aprovado"}
    raise HTTPException(status_code=500, detail="Erro ao aprovar")

@app.patch("/gastos/{id}/reprovar")
def reprovar_gasto(id: int):
    if update_gasto_status(id, "reprovado"):
        return {"success": True, "status": "reprovado"}
    raise HTTPException(status_code=500, detail="Erro ao reprovar")

@app.delete("/gastos/{id}")
def remover_gasto(id: int):
    if delete_gasto(id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Gasto nao encontrado")

@app.patch("/gastos/{id}")
async def editar_gasto(id: int, request: Request):
    body = await request.json()
    ok = update_gasto(
        id,
        nome_produto=body.get("nome_produto"),
        valor_unitario=body.get("valor_unitario"),
        quantidade=body.get("quantidade"),
    )
    if ok:
        return {"success": True}
    raise HTTPException(status_code=500, detail="Erro ao atualizar gasto")

# ============ GANHOS ============

@app.get("/ganhos")
def listar_ganhos():
    return get_ganhos()

@app.post("/ganhos")
async def criar_ganho(request: Request):
    body = await request.json()
    descricao = body.get("descricao")
    valor = body.get("valor")
    if not descricao or valor is None:
        raise HTTPException(status_code=400, detail="descricao e valor são obrigatórios")
    id = save_ganho(
        descricao=descricao,
        valor=float(valor),
        categoria=body.get("categoria"),
        data=body.get("data"),
    )
    if id:
        return {"success": True, "id": id}
    raise HTTPException(status_code=500, detail="Erro ao salvar ganho")

@app.delete("/ganhos/{id}")
def remover_ganho(id: int):
    if delete_ganho(id):
        return {"success": True}
    raise HTTPException(status_code=404, detail="Ganho nao encontrado")

# ============ RELATORIOS ============

@app.get("/relatorios/total")
def relatorio_total():
    return {"total_gastos": get_total_gastos()}

@app.get("/relatorios/por-setor")
def relatorio_por_setor():
    return get_gastos_por_setor()

@app.get("/relatorios/por-produto")
def relatorio_por_produto(limit: int = 5):
    return get_gastos_por_produto(limit=limit)

@app.get("/relatorios/por-mes")
def relatorio_por_mes(meses: int = 6):
    return get_gastos_por_mes(meses=meses)

@app.get("/relatorios/ganhos-por-mes")
def relatorio_ganhos_por_mes(meses: int = 6):
    return get_ganhos_por_mes(meses=meses)

# ============ WHATSAPP ============

@app.get("/whatsapp/status")
def whatsapp_status():
    return whatsapp_snapshot()

bot_process = None
BOT_PATH = os.path.join("python_core", "whatsapp_bot.py")
PAIR_REQUEST_FILE = Path("python_core") / "pair_request.txt"


def _start_bot():
    global bot_process
    print("Iniciando WhatsApp Bot em segundo plano...")
    bot_process = subprocess.Popen([sys.executable, BOT_PATH])


def _stop_bot(timeout: float = 5.0):
    global bot_process
    if not bot_process:
        return
    print("Encerrando WhatsApp Bot...")
    bot_process.terminate()
    try:
        bot_process.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        print("Bot não respondeu ao terminate, matando...")
        bot_process.kill()
        bot_process.wait()
    bot_process = None


@app.on_event("startup")
def startup_event():
    _start_bot()


@app.on_event("shutdown")
def shutdown_event():
    _stop_bot()


@app.post("/whatsapp/pair-phone")
async def whatsapp_pair_phone(request: Request):
    """Pareamento por número: grava o telefone num arquivo de estado e
    reinicia o bot. No próximo startup ele chama client.PairPhone() ANTES
    de connect() (única ordem aceita pelo neonize) e salva o código de 8
    caracteres no whatsapp_state. Frontend faz polling em /whatsapp/status."""
    body = await request.json()
    phone_raw = (body.get("phone") or "").strip()
    phone_digits = "".join(c for c in phone_raw if c.isdigit())
    if len(phone_digits) < 10:
        raise HTTPException(status_code=400, detail="Telefone inválido (mínimo 10 dígitos)")

    PAIR_REQUEST_FILE.parent.mkdir(parents=True, exist_ok=True)
    PAIR_REQUEST_FILE.write_text(phone_digits, encoding="utf-8")

    _stop_bot()
    _start_bot()

    return {"success": True, "phone": phone_digits, "restarted": True}

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="127.0.0.1", port=8000, reload=True)

