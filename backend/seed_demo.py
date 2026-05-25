"""Popula o banco com dados realistas pra apresentação.

Atribui tudo ao primeiro usuário cadastrado (admin).
Distribuição: últimos 6 meses (Dez/2025 → Mai/2026), com volume crescente
no mês corrente pra parecer "fazenda em uso ativo".

Roda com: .venv/bin/python seed_demo.py
"""
from datetime import datetime, timedelta, date
import random
from python_core.database import get_connection, get_first_usuario


SETORES = ["Lavoura", "Pecuária", "Maquinário", "Sanidade", "Insumos", "Logística"]

# (descricao, setor, status)
OCORRENCIAS = [
    ("Aplicação de fungicida na soja talhão 3", "Lavoura", "concluida"),
    ("Vaca da brincada 0427 com sinais de mastite", "Sanidade", "concluida"),
    ("Trator John Deere com vazamento no hidráulico", "Maquinário", "pendente"),
    ("Recolhimento de 80kg de milho do silo", "Logística", "concluida"),
    ("Adubação NPK no pasto da invernada norte", "Pecuária", "concluida"),
    ("Compra de 200 kg de ração proteica", "Insumos", "concluida"),
    ("Verificação cerca elétrica setor leste", "Pecuária", "concluida"),
    ("Bezerro nasceu na manhã - matriz 0152", "Pecuária", "concluida"),
    ("Manutenção do plantador - troca de discos", "Maquinário", "concluida"),
    ("Aplicação de herbicida no talhão 5", "Lavoura", "concluida"),
    ("Vacinação de 45 cabeças contra febre aftosa", "Sanidade", "concluida"),
    ("Pivô central 2 com falha no motor", "Maquinário", "pendente"),
    ("Colheita parcial soja - 12 toneladas", "Lavoura", "concluida"),
    ("Compra de sementes de milho híbrido", "Insumos", "concluida"),
    ("Curral norte precisa de novo bebedouro", "Pecuária", "pendente"),
    ("Aplicação de calcário no talhão 1", "Lavoura", "concluida"),
    ("Suplementação mineral do gado", "Pecuária", "concluida"),
    ("Limpeza do galpão de máquinas", "Maquinário", "concluida"),
    ("Recebimento de adubo 100 sacos NPK", "Insumos", "concluida"),
    ("Vermifugação do rebanho - 78 cabeças", "Sanidade", "concluida"),
    ("Plantio de milho safrinha talhão 4", "Lavoura", "concluida"),
    ("Compra de combustível 500L diesel", "Logística", "concluida"),
    ("Reparo da cerca após queda de árvore", "Pecuária", "concluida"),
    ("Pulverização preventiva contra ferrugem", "Lavoura", "concluida"),
    ("Manutenção do silo - vedação portinhola", "Maquinário", "concluida"),
    ("Compra de fardo de feno - 30 unidades", "Insumos", "concluida"),
    ("Visita do veterinário para check-up", "Sanidade", "concluida"),
    ("Análise de solo dos talhões 1 e 2", "Lavoura", "concluida"),
    ("Reforma do bezerreiro - madeira nova", "Pecuária", "concluida"),
    ("Inseminação artificial 12 matrizes", "Pecuária", "concluida"),
]

# (descricao_ocorrencia, setor, status_ocorrencia, produto, valor_unit, qtd)
GASTOS_DETALHADOS = [
    ("Compra de 200 kg de ração proteica", "Insumos", "concluida", "Ração proteica 200kg", 8.50, 200),
    ("Compra de sementes de milho híbrido", "Insumos", "concluida", "Sementes de milho híbrido (sc)", 850.00, 6),
    ("Recebimento de adubo 100 sacos NPK", "Insumos", "concluida", "Adubo NPK 20-05-20 (saco 50kg)", 145.00, 100),
    ("Compra de combustível 500L diesel", "Logística", "concluida", "Diesel S10 (litro)", 6.20, 500),
    ("Compra de fardo de feno - 30 unidades", "Insumos", "concluida", "Fardo de feno", 95.00, 30),
    ("Vacinação de 45 cabeças contra febre aftosa", "Sanidade", "concluida", "Vacina aftosa (dose)", 4.80, 45),
    ("Vermifugação do rebanho - 78 cabeças", "Sanidade", "concluida", "Vermífugo bovino (dose)", 12.50, 78),
    ("Reparo da cerca após queda de árvore", "Pecuária", "concluida", "Mourão de eucalipto", 35.00, 22),
    ("Manutenção do plantador - troca de discos", "Maquinário", "concluida", "Disco de plantadeira", 280.00, 8),
    ("Análise de solo dos talhões 1 e 2", "Lavoura", "concluida", "Análise laboratorial de solo", 120.00, 4),
    ("Aplicação de herbicida no talhão 5", "Lavoura", "concluida", "Herbicida glifosato (L)", 38.50, 60),
    ("Pulverização preventiva contra ferrugem", "Lavoura", "concluida", "Fungicida sistêmico (L)", 165.00, 10),
    ("Aplicação de calcário no talhão 1", "Lavoura", "concluida", "Calcário dolomítico (ton)", 220.00, 12),
    ("Suplementação mineral do gado", "Pecuária", "concluida", "Sal mineral (saco 30kg)", 95.00, 25),
    ("Reforma do bezerreiro - madeira nova", "Pecuária", "concluida", "Tábua de eucalipto", 28.00, 60),
    ("Inseminação artificial 12 matrizes", "Pecuária", "concluida", "Sêmen bovino (dose)", 180.00, 12),
    ("Visita do veterinário para check-up", "Sanidade", "concluida", "Consulta veterinária", 450.00, 1),
]

# (descricao, categoria, valor)
GANHOS_TEMPLATES = [
    ("Venda de boi gordo - frigorífico Marfrig", "Venda de gado", 18500.00),
    ("Venda de soja - cooperativa", "Venda de grãos", 42000.00),
    ("Venda de leite - laticínio", "Venda de leite", 6200.00),
    ("Venda de bezerros - leilão", "Venda de gado", 24800.00),
    ("Venda de milho - cooperativa", "Venda de grãos", 19200.00),
    ("Venda de queijo artesanal", "Produtos derivados", 1850.00),
    ("Arrendamento talhão 7 - safra", "Arrendamento", 12000.00),
    ("Venda de feijão - mercado local", "Venda de grãos", 8400.00),
    ("Venda de vacas descarte", "Venda de gado", 9700.00),
    ("Bonificação cooperativa - safra anterior", "Bonificação", 3500.00),
    ("Venda de leite - laticínio", "Venda de leite", 6800.00),
    ("Venda de boi gordo - frigorífico", "Venda de gado", 21300.00),
]


def random_dt_in_month(year: int, month: int) -> datetime:
    """Data aleatória dentro do mês informado, em horário comercial."""
    if month == 12:
        next_month = datetime(year + 1, 1, 1)
    else:
        next_month = datetime(year, month + 1, 1)
    start = datetime(year, month, 1)
    delta_dias = (next_month - start).days
    dia = random.randint(1, delta_dias - 1)
    hora = random.randint(6, 19)
    minuto = random.randint(0, 59)
    return datetime(year, month, dia, hora, minuto)


def seed():
    user = get_first_usuario()
    if not user:
        raise SystemExit("Nenhum usuário cadastrado. Crie uma conta antes de rodar o seed.")
    uid = user["id"]
    print(f"Atribuindo dados ao usuário id={uid} ({user['email']})")

    # 6 meses: Dez/2025 → Mai/2026
    meses = [(2025, 12), (2026, 1), (2026, 2), (2026, 3), (2026, 4), (2026, 5)]

    conn = get_connection()
    cur = conn.cursor()

    # mapa descricao_ocorrencia → id_ocorrencia (pra linkar gasto)
    desc_to_id: dict[str, int] = {}

    # Espalha as OCORRENCIAS pelos meses
    ocorrencias_por_mes = len(OCORRENCIAS) // len(meses)
    occ_idx = 0
    total_oc = 0
    for ano, mes in meses:
        for _ in range(ocorrencias_por_mes + (1 if mes == 5 else 0)):
            if occ_idx >= len(OCORRENCIAS):
                break
            desc, setor, status = OCORRENCIAS[occ_idx]
            occ_idx += 1
            dt = random_dt_in_month(ano, mes)
            cur.execute(
                """INSERT INTO ocorrencias (usuario_id, telefone, descricao, foto_url, setor, status, data_criacao)
                   VALUES (%s, %s, %s, NULL, %s, %s, %s) RETURNING id""",
                (uid, "5581999998888", desc, setor, status, dt),
            )
            oc_id = cur.fetchone()[0]
            desc_to_id[desc] = oc_id
            total_oc += 1

    # GASTOS — usa o id_ocorrencia mapeado pra criar o vínculo
    total_g = 0
    for desc, setor, status, produto, valor_unit, qtd in GASTOS_DETALHADOS:
        oc_id = desc_to_id.get(desc)
        if oc_id is None:
            # se a ocorrência não foi criada (mês esgotou), insere uma sintética
            ano, mes = random.choice(meses)
            dt = random_dt_in_month(ano, mes)
            cur.execute(
                """INSERT INTO ocorrencias (usuario_id, telefone, descricao, foto_url, setor, status, data_criacao)
                   VALUES (%s, %s, %s, NULL, %s, %s, %s) RETURNING id""",
                (uid, "5581999998888", f"[Manual] {produto}", setor, "concluida", dt),
            )
            oc_id = cur.fetchone()[0]
            total_oc += 1
        # data do gasto = data da ocorrência (já consistente)
        cur.execute(
            """INSERT INTO gastos (usuario_id, id_ocorrencia, nome_produto, valor_unitario, quantidade, valor_total, status_aprovacao, data_criacao)
               VALUES (%s, %s, %s, %s, %s, %s, 'aprovado',
                       (SELECT data_criacao FROM ocorrencias WHERE id=%s))""",
            (uid, oc_id, produto, valor_unit, qtd, valor_unit * qtd, oc_id),
        )
        total_g += 1

    # GANHOS — 2 por mês
    total_gn = 0
    ganhos_idx = 0
    for ano, mes in meses:
        for _ in range(2):
            if ganhos_idx >= len(GANHOS_TEMPLATES):
                ganhos_idx = 0
            desc, cat, valor = GANHOS_TEMPLATES[ganhos_idx]
            ganhos_idx += 1
            # leve variação no valor pra parecer real
            valor_var = round(valor * random.uniform(0.85, 1.18), 2)
            dt = random_dt_in_month(ano, mes)
            cur.execute(
                """INSERT INTO ganhos (usuario_id, descricao, categoria, valor, data, data_criacao)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (uid, desc, cat, valor_var, dt.date(), dt),
            )
            total_gn += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDados de demo inseridos com sucesso:")
    print(f"  • {total_oc} ocorrências")
    print(f"  • {total_g} gastos (todos aprovados)")
    print(f"  • {total_gn} ganhos")


if __name__ == "__main__":
    seed()
