from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from python_core.database import (
    save_ocorrencia, get_ocorrencias, get_ocorrencia_by_id, update_ocorrencia_status,
    save_gasto, get_gastos, get_gastos_by_ocorrencia, update_gasto_status,
    get_total_gastos, get_gastos_por_setor
)

app = FastAPI(title="AgroFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "funcionando", "app": "AgroFlow", "version": "1.0.0"}

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
    setor = payload.get("setor", None)
    
    if telefone and texto:
        id = save_ocorrencia(telefone, texto, foto_url, setor)
        return {"status": "recebido", "id": id}
    
    return {"status": "recebido"}

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

# ============ RELATORIOS ============

@app.get("/relatorios/total")
def relatorio_total():
    return {"total_gastos": get_total_gastos()}

@app.get("/relatorios/por-setor")
def relatorio_por_setor():
    return get_gastos_por_setor()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)