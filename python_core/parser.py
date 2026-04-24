"""
Parser de mensagens em português para extrair gastos agrícolas.
Funciona sem LLM — usa regex + heurísticas simples.
"""
from __future__ import annotations

import re
from typing import Optional, TypedDict


class ParseResult(TypedDict, total=False):
    tipo: str  # "gasto" | "ocorrencia" | "indefinido"
    descricao: str
    setor: Optional[str]
    cultura: Optional[str]
    urgencia: str
    produto: Optional[str]
    valor_unitario: Optional[float]
    quantidade: int
    valor_total: Optional[float]


# Normalizações comuns (typo → correto, abreviação → forma longa)
NORMALIZACOES = {
    r"\bc/\b": "com",
    r"\bp/\b": "para",
    r"\bpra\b": "para",
    r"\brs\b": "reais",
    r"\breais?\b": "reais",
    r"\br\$": "",
    r"\$": "",
}

# Palavras que indicam GASTO explícito
VERBOS_GASTO = [
    "gastei", "gastamos", "gastou",
    "comprei", "compramos", "comprou",
    "paguei", "pagamos", "pagou",
    "pago", "pagos", "paga", "pagas",
    "usei", "usamos",
    "custou", "custaram",
    "investi",
]

# Palavras que indicam OCORRENCIA (problema)
PALAVRAS_OCORRENCIA = [
    "praga", "pragas", "doença", "doenca",
    "seca", "enchente", "chuva demais",
    "morreu", "morrendo", "murchou", "apodrec",
    "quebrou", "estragou", "parou",
    "problema", "urgente", "emergência", "emergencia",
    "ajuda", "socorro",
]

# Taxonomia fixa de setores + palavras-chave pra classificar o produto
SETORES = {
    "Plantação": ["semente", "sementes", "muda", "mudas", "broto"],
    "Insumos": [
        "adubo", "adubos", "fertilizante", "fertilizantes",
        "defensivo", "defensivos", "agrotóxico", "agrotoxico",
        "herbicida", "fungicida", "inseticida", "calcário", "calcario",
    ],
    "Combustível": ["diesel", "gasolina", "álcool", "alcool", "combustível", "combustivel", "óleo", "oleo"],
    "Manutenção": [
        "conserto", "consertos", "peça", "pecas", "peças", "reparo",
        "manutenção", "manutencao", "troca",
    ],
    "Equipamento": [
        "trator", "colheitadeira", "pulverizador", "arado",
        "ferramenta", "ferramentas", "enxada", "foice",
        "bomba", "mangueira",
    ],
    "Mão de obra": [
        "salário", "salario", "diária", "diaria", "diarista",
        "funcionário", "funcionario", "pagamento", "folha",
    ],
}


def classificar_setor(produto: str) -> str:
    """Classifica o produto em um setor fixo. Retorna 'Outros' se não casar."""
    if not produto:
        return "Outros"
    p = produto.lower()
    for setor, palavras in SETORES.items():
        for palavra in palavras:
            if palavra in p:
                return setor
    return "Outros"

# Extensivo: número em qualquer formato (R$ 1.500,50 / 500 / 1500,50 / 500 reais)
RE_NUMERO = re.compile(
    r"(?<![\w.])"                      # não pode ter letra/ponto antes
    r"(\d{1,3}(?:\.\d{3})+(?:,\d+)?"   # 1.500,50 ou 1.500
    r"|\d+(?:[.,]\d+)?)"               # 500 ou 500,50 ou 500.50
    r"(?![\w])"                        # não pode ter letra depois
)


def _to_float(s: str) -> Optional[float]:
    """Converte '1.500,50' ou '500' ou '500.50' em float."""
    if not s:
        return None
    # heurística: se tem vírgula, vírgula é decimal; ponto é milhar
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _normalizar(texto: str) -> str:
    t = texto.lower().strip()
    for padrao, sub in NORMALIZACOES.items():
        t = re.sub(padrao, sub, t, flags=re.IGNORECASE)
    # colapsa espaços múltiplos
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _extrair_valor(texto: str) -> Optional[float]:
    """
    Pega o valor monetário, preferindo números ligados a palavras de preço.
    Ordem de preferência:
      1) número depois de 'por', 'a', 'custou', 'custando'
      2) número seguido de 'reais'
      3) número depois de 'R$'
      4) qualquer número
    """
    # 1) depois de por/a/custou
    m = re.search(r"(?:por|a|custou|custando)\s+(?:r\$\s*)?(\d[\d.,]*)", texto, re.IGNORECASE)
    if m:
        v = _to_float(m.group(1))
        if v and v > 0:
            return v

    # 2) seguido de "reais"
    m = re.search(r"(\d[\d.,]*)\s*reais?", texto, re.IGNORECASE)
    if m:
        v = _to_float(m.group(1))
        if v and v > 0:
            return v

    # 3) depois de R$
    m = re.search(r"r\$\s*(\d[\d.,]*)", texto, re.IGNORECASE)
    if m:
        v = _to_float(m.group(1))
        if v and v > 0:
            return v

    # 4) fallback: primeiro número
    matches = RE_NUMERO.findall(texto)
    for m in matches:
        val = _to_float(m)
        if val and val > 0:
            return val
    return None


def _extrair_produto(texto: str, valor_str: Optional[str]) -> Optional[str]:
    """
    Tenta extrair o produto entre preposições comuns depois do verbo de gasto
    ou do valor.
    Ex: 'gastei 500 reais com semente de pimenta' → 'semente de pimenta'
        'comprei adubo por 200'                  → 'adubo'
    """
    # padrão 1: VERBO ... VALOR <prep> PRODUTO
    m = re.search(
        r"(?:" + "|".join(VERBOS_GASTO) + r")\s+(?:\d[\d.,]*\s*)?(?:reais?\s+)?"
        r"(?:com|de|em|no|na|para|pra|por)\s+(.+?)(?:\s*[.!?,;]|$)",
        texto, re.IGNORECASE
    )
    if m and m.group(1).strip():
        return _limpar_produto(m.group(1))

    # padrão 2: VERBO PRODUTO por/a VALOR
    m = re.search(
        r"(?:" + "|".join(VERBOS_GASTO) + r")\s+(.+?)\s+(?:por|a|custando)\s+(?:r\$\s*)?\d[\d.,]*",
        texto, re.IGNORECASE
    )
    if m and m.group(1).strip():
        return _limpar_produto(m.group(1))

    # padrão 3: VALOR reais <prep> PRODUTO (sem verbo)
    m = re.search(
        r"\d[\d.,]*\s*reais?\s+(?:com|de|em|no|na|para|pra|por)\s+(.+?)(?:\s*[.!?,;]|$)",
        texto, re.IGNORECASE
    )
    if m and m.group(1).strip():
        return _limpar_produto(m.group(1))

    # padrão 4: VALOR reais|R$ ... <prep> PRODUTO
    # Exige marcador monetário explícito (reais ou R$) pra não casar
    # com qualquer número solto no meio de conversa.
    # Cobre passiva como "550 reais foram gastos em manutenção do trator".
    m = re.search(
        r"(?:r\$\s*\d[\d.,]*|\d[\d.,]*\s*reais?)\s+"
        r"[\w\s]{0,40}?(?:com|de|em|no|na|para|pra|por)\s+"
        r"(.+?)(?:\s*[.!?,;]|$)",
        texto, re.IGNORECASE
    )
    if m and m.group(1).strip():
        return _limpar_produto(m.group(1))

    return None


def _limpar_produto(s: str) -> str:
    """Remove lixo das bordas do produto extraído."""
    s = s.strip()
    s = re.sub(r"^(?:uma?|uns|umas|o|a|os|as|de|para|pra)\s+", "", s, flags=re.IGNORECASE)
    s = s.strip(" .!?,;:-")
    return s


def _identificar_tipo(texto: str) -> str:
    tem_verbo_gasto = any(v in texto for v in VERBOS_GASTO)
    tem_valor = _extrair_valor(texto) is not None
    tem_problema = any(p in texto for p in PALAVRAS_OCORRENCIA)

    if tem_verbo_gasto and tem_valor:
        return "ambos" if tem_problema else "gasto"
    if tem_problema:
        return "ocorrencia"
    return "indefinido"


def analisar_com_regex(texto: str) -> Optional[ParseResult]:
    """
    Analisa uma mensagem e retorna um dict no mesmo formato do Gemini
    (tipo, descricao, produto, valor_unitario, etc).
    Retorna None quando não consegue identificar nada útil.
    """
    if not texto or not texto.strip():
        return None

    original = texto.strip()
    t = _normalizar(original)

    tipo = _identificar_tipo(t)
    valor = _extrair_valor(t)
    produto = _extrair_produto(t, None)

    # sem verbo explícito, mas casou valor+produto (ex: "500 reais em sementes")
    if tipo == "indefinido" and valor and produto:
        tipo = "gasto"

    if tipo == "indefinido":
        return None

    resultado: ParseResult = {
        "tipo": tipo,
        "descricao": original,
        "setor": None,
        "cultura": None,
        "urgencia": "media",
        "produto": None,
        "valor_unitario": None,
        "quantidade": 1,
        "valor_total": None,
    }

    if tipo in ("gasto", "ambos"):
        if valor and produto:
            resultado["valor_unitario"] = valor
            resultado["valor_total"] = valor
            resultado["produto"] = produto
            resultado["setor"] = classificar_setor(produto)
        else:
            # não conseguiu extrair produto+valor suficientes → desiste
            return None

    return resultado
