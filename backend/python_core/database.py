import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

DATABASE_URL = os.getenv("DATABASE_URL")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "mandaca"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
}

def get_connection():
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL, sslmode="require")
    return psycopg2.connect(**DB_CONFIG)

# ============ USUARIOS ============

def save_usuario(email: str, senha_hash: str, nome: str = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO usuarios (email, senha_hash, nome)
               VALUES (%s, %s, %s) RETURNING id""",
            (email.lower().strip(), senha_hash, nome)
        )
        id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return id
    except psycopg2.errors.UniqueViolation:
        return None
    except Exception as e:
        print(f"Erro ao salvar usuário: {e}")
        return None

def get_usuario_by_email(email: str):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email.lower().strip(),))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Erro ao buscar usuário: {e}")
        return None

def get_usuario_by_id(id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, email, nome, telefone_whatsapp, data_cadastro FROM usuarios WHERE id = %s", (id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Erro ao buscar usuário: {e}")
        return None

def get_first_usuario():
    """Retorna o usuário com menor id (admin/primeiro cadastrado).
    Usado pelo webhook como destino default das mensagens recebidas."""
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, email, nome FROM usuarios ORDER BY id ASC LIMIT 1")
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Erro ao buscar primeiro usuário: {e}")
        return None

def get_usuario_by_telefone(telefone: str):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, email, nome, telefone_whatsapp FROM usuarios WHERE telefone_whatsapp = %s", (telefone,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Erro ao buscar usuário por telefone: {e}")
        return None

def vincular_telefone(usuario_id: int, telefone: str) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE usuarios SET telefone_whatsapp = %s WHERE id = %s",
            (telefone, usuario_id)
        )
        updated = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return updated > 0
    except psycopg2.errors.UniqueViolation:
        return False
    except Exception as e:
        print(f"Erro ao vincular telefone: {e}")
        return False

# ============ OCORRENCIAS ============

def save_ocorrencia(usuario_id: int, telefone: str, descricao: str, foto_url: str = None, setor: str = None, status: str = "pendente"):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO ocorrencias (usuario_id, telefone, descricao, foto_url, setor, data_criacao, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (usuario_id, telefone, descricao, foto_url, setor, datetime.now(), status)
        )
        id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return id
    except Exception as e:
        print(f"Erro ao salvar ocorrencia: {e}")
        return None

def get_ocorrencias(usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT id, telefone, descricao, foto_url, setor, data_criacao, status
            FROM ocorrencias WHERE usuario_id = %s ORDER BY data_criacao DESC
        """, (usuario_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar ocorrencias: {e}")
        return []

def get_ocorrencia_by_id(id: int, usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM ocorrencias WHERE id = %s AND usuario_id = %s", (id, usuario_id))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Erro ao buscar ocorrencia: {e}")
        return None

def delete_ocorrencia(id: int, usuario_id: int) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM gastos WHERE id_ocorrencia = %s AND usuario_id = %s", (id, usuario_id))
        cursor.execute("DELETE FROM ocorrencias WHERE id = %s AND usuario_id = %s", (id, usuario_id))
        deleted = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return deleted > 0
    except Exception as e:
        print(f"Erro ao deletar ocorrencia: {e}")
        return False

def update_ocorrencia_status(id: int, status: str, usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE ocorrencias SET status = %s WHERE id = %s AND usuario_id = %s",
            (status, id, usuario_id)
        )
        updated = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return updated > 0
    except Exception as e:
        print(f"Erro ao atualizar status: {e}")
        return False

# ============ GASTOS ============

def save_gasto(usuario_id: int, id_ocorrencia: int, nome_produto: str, valor_unitario: float, quantidade: int = 1, status_aprovacao: str = "pendente"):
    try:
        valor_total = valor_unitario * quantidade
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO gastos (usuario_id, id_ocorrencia, nome_produto, valor_unitario, quantidade, valor_total, data_criacao, status_aprovacao)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (usuario_id, id_ocorrencia, nome_produto, valor_unitario, quantidade, valor_total, datetime.now(), status_aprovacao)
        )
        id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return id
    except Exception as e:
        print(f"Erro ao salvar gasto: {e}")
        return None

def get_gastos(usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT g.*, o.descricao as ocorrencia_descricao
            FROM gastos g
            LEFT JOIN ocorrencias o ON g.id_ocorrencia = o.id
            WHERE g.usuario_id = %s
            ORDER BY g.data_criacao DESC
        """, (usuario_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar gastos: {e}")
        return []

def get_gastos_by_ocorrencia(id_ocorrencia: int, usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            "SELECT * FROM gastos WHERE id_ocorrencia = %s AND usuario_id = %s",
            (id_ocorrencia, usuario_id)
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar gastos: {e}")
        return []

def update_gasto_status(id: int, status: str, usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE gastos SET status_aprovacao = %s WHERE id = %s AND usuario_id = %s",
            (status, id, usuario_id)
        )
        updated = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return updated > 0
    except Exception as e:
        print(f"Erro ao atualizar status: {e}")
        return False

def update_gasto(id: int, usuario_id: int, nome_produto: str = None, valor_unitario: float = None, quantidade: int = None) -> bool:
    try:
        sets = []
        params = []
        if nome_produto is not None:
            sets.append("nome_produto = %s"); params.append(nome_produto)
        if valor_unitario is not None:
            sets.append("valor_unitario = %s"); params.append(valor_unitario)
        if quantidade is not None:
            sets.append("quantidade = %s"); params.append(quantidade)
        if valor_unitario is not None or quantidade is not None:
            sets.append("valor_total = COALESCE(%s, valor_unitario) * COALESCE(%s, quantidade)")
            params.extend([valor_unitario, quantidade])
        if not sets:
            return True
        params.extend([id, usuario_id])
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE gastos SET {', '.join(sets)} WHERE id = %s AND usuario_id = %s",
            params,
        )
        updated = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return updated > 0
    except Exception as e:
        print(f"Erro ao atualizar gasto: {e}")
        return False

def delete_gasto(id: int, usuario_id: int) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM gastos WHERE id = %s AND usuario_id = %s", (id, usuario_id))
        deleted = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return deleted > 0
    except Exception as e:
        print(f"Erro ao deletar gasto: {e}")
        return False

# ============ GANHOS ============

def save_ganho(usuario_id: int, descricao: str, valor: float, categoria: str = None, data: str = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        if data:
            cursor.execute(
                """INSERT INTO ganhos (usuario_id, descricao, categoria, valor, data)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (usuario_id, descricao, categoria, valor, data),
            )
        else:
            cursor.execute(
                """INSERT INTO ganhos (usuario_id, descricao, categoria, valor)
                   VALUES (%s, %s, %s, %s) RETURNING id""",
                (usuario_id, descricao, categoria, valor),
            )
        id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return id
    except Exception as e:
        print(f"Erro ao salvar ganho: {e}")
        return None

def get_ganhos(usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            "SELECT id, descricao, categoria, valor, data, data_criacao FROM ganhos WHERE usuario_id = %s ORDER BY data DESC, id DESC",
            (usuario_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar ganhos: {e}")
        return []

def delete_ganho(id: int, usuario_id: int) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM ganhos WHERE id = %s AND usuario_id = %s", (id, usuario_id))
        deleted = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        return deleted > 0
    except Exception as e:
        print(f"Erro ao deletar ganho: {e}")
        return False

# ============ RELATORIOS ============

def get_total_gastos(usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COALESCE(SUM(valor_total), 0) FROM gastos WHERE status_aprovacao = 'aprovado' AND usuario_id = %s",
            (usuario_id,)
        )
        total = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return float(total)
    except Exception as e:
        print(f"Erro ao calcular total: {e}")
        return 0

def get_gastos_por_setor(usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT COALESCE(o.setor, 'Outros') as setor,
                   COALESCE(SUM(g.valor_total), 0) as total
            FROM gastos g
            JOIN ocorrencias o ON g.id_ocorrencia = o.id
            WHERE g.status_aprovacao = 'aprovado' AND g.usuario_id = %s
            GROUP BY o.setor
            ORDER BY total DESC
        """, (usuario_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar gastos por setor: {e}")
        return []

def get_gastos_por_produto(usuario_id: int, limit: int = 5):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT g.nome_produto as produto,
                   SUM(g.valor_total) as total,
                   COUNT(*) as vezes
            FROM gastos g
            WHERE g.status_aprovacao = 'aprovado' AND g.usuario_id = %s
            GROUP BY g.nome_produto
            ORDER BY total DESC
            LIMIT %s
        """, (usuario_id, limit))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar gastos por produto: {e}")
        return []

def get_ganhos_por_mes(usuario_id: int, meses: int = 6):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT to_char(date_trunc('month', data), 'YYYY-MM') as mes,
                   SUM(valor) as total
            FROM ganhos
            WHERE usuario_id = %s
              AND data >= (CURRENT_DATE - (%s || ' months')::interval)
            GROUP BY mes
            ORDER BY mes
        """, (usuario_id, meses))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar ganhos por mes: {e}")
        return []

def get_gastos_por_mes(usuario_id: int, meses: int = 6):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT to_char(date_trunc('month', g.data_criacao), 'YYYY-MM') as mes,
                   SUM(g.valor_total) as total
            FROM gastos g
            WHERE g.status_aprovacao = 'aprovado'
              AND g.usuario_id = %s
              AND g.data_criacao >= (CURRENT_DATE - (%s || ' months')::interval)
            GROUP BY mes
            ORDER BY mes
        """, (usuario_id, meses))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar gastos por mes: {e}")
        return []
