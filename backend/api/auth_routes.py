import random
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field

from python_core.auth import (
    hash_password, verify_password, create_access_token, get_current_user,
)
from python_core.database import (
    save_usuario, get_usuario_by_email, get_usuario_by_id,
    get_usuario_by_telefone, vincular_telefone,
)
from python_core.redis_cache import (
    enfileirar_envio, salvar_codigo_verificacao, validar_codigo_verificacao,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=6)
    nome: str | None = None


class LoginIn(BaseModel):
    email: EmailStr
    senha: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: dict


class VincularRequestIn(BaseModel):
    telefone: str = Field(min_length=10)


class VincularVerifyIn(BaseModel):
    telefone: str = Field(min_length=10)
    codigo: str = Field(min_length=4, max_length=8)


def _so_digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn):
    if get_usuario_by_email(payload.email):
        raise HTTPException(status_code=409, detail="Email já cadastrado")
    uid = save_usuario(payload.email, hash_password(payload.senha), payload.nome)
    if not uid:
        raise HTTPException(status_code=500, detail="Erro ao criar usuário")
    token = create_access_token(uid, payload.email)
    return TokenOut(
        access_token=token,
        usuario={"id": uid, "email": payload.email, "nome": payload.nome, "telefone_whatsapp": None},
    )


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn):
    user = get_usuario_by_email(payload.email)
    if not user or not verify_password(payload.senha, user["senha_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    token = create_access_token(user["id"], user["email"])
    return TokenOut(
        access_token=token,
        usuario={
            "id": user["id"], "email": user["email"], "nome": user.get("nome"),
            "telefone_whatsapp": user.get("telefone_whatsapp"),
        },
    )


@router.get("/me")
def me(current = Depends(get_current_user)):
    user = get_usuario_by_id(current["id"])
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


@router.post("/vincular-whatsapp/request")
def vincular_request(payload: VincularRequestIn, current = Depends(get_current_user)):
    telefone = _so_digitos(payload.telefone)
    if len(telefone) < 10:
        raise HTTPException(status_code=400, detail="Telefone inválido")

    existente = get_usuario_by_telefone(telefone)
    if existente and existente["id"] != current["id"]:
        raise HTTPException(status_code=409, detail="Telefone já vinculado a outra conta")

    codigo = f"{random.randint(0, 999999):06d}"
    salvar_codigo_verificacao(current["id"], telefone, codigo, ttl=600)
    enfileirar_envio(
        telefone,
        f"Mandaca: seu código de verificação é *{codigo}*. Válido por 10 minutos.",
    )
    return {"success": True, "telefone": telefone, "expira_em_segundos": 600}


@router.post("/vincular-whatsapp/verify")
def vincular_verify(payload: VincularVerifyIn, current = Depends(get_current_user)):
    telefone = _so_digitos(payload.telefone)
    uid = validar_codigo_verificacao(telefone, payload.codigo)
    if uid is None or uid != current["id"]:
        raise HTTPException(status_code=400, detail="Código inválido ou expirado")
    if not vincular_telefone(current["id"], telefone):
        raise HTTPException(status_code=409, detail="Não foi possível vincular (telefone em uso?)")
    return {"success": True, "telefone_whatsapp": telefone}
