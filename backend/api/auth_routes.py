from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field

from python_core.auth import (
    hash_password, verify_password, create_access_token, get_current_user,
)
from python_core.database import (
    save_usuario, get_usuario_by_email, get_usuario_by_id,
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
