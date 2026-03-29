import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "agroflow"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

# ============ OCORRENCIAS ============

def save_ocorrencia(telefone: str, descricao: str, foto_url: str = None, setor: str = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO ocorrencias (telefone, descricao, foto_url, setor, data_criacao) 
               VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (telefone, descricao, foto_url, setor, datetime.now())
        )
        id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Ocorrencia salva com ID: {id}")
        return id
    except Exception as e:
        print(f"Erro ao salvar ocorrencia: {e}")
        return None

def get_ocorrencias():
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT id, telefone, descricao, foto_url, setor, data_criacao, status 
            FROM ocorrencias ORDER BY data_criacao DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar ocorrencias: {e}")
        return []

def get_ocorrencia_by_id(id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM ocorrencias WHERE id = %s", (id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Erro ao buscar ocorrencia: {e}")
        return None

def update_ocorrencia_status(id: int, status: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE ocorrencias SET status = %s WHERE id = %s", (status, id))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Erro ao atualizar status: {e}")
        return False

# ============ GASTOS ============

def save_gasto(id_ocorrencia: int, nome_produto: str, valor_unitario: float, quantidade: int = 1):
    try:
        valor_total = valor_unitario * quantidade
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO gastos (id_ocorrencia, nome_produto, valor_unitario, quantidade, valor_total, data_criacao) 
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (id_ocorrencia, nome_produto, valor_unitario, quantidade, valor_total, datetime.now())
        )
        id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Gasto salvo com ID: {id}")
        return id
    except Exception as e:
        print(f"Erro ao salvar gasto: {e}")
        return None

def get_gastos():
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT g.*, o.descricao as ocorrencia_descricao 
            FROM gastos g 
            LEFT JOIN ocorrencias o ON g.id_ocorrencia = o.id 
            ORDER BY g.data_criacao DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar gastos: {e}")
        return []

def get_gastos_by_ocorrencia(id_ocorrencia: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM gastos WHERE id_ocorrencia = %s", (id_ocorrencia,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar gastos: {e}")
        return []

def update_gasto_status(id: int, status: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE gastos SET status_aprovacao = %s WHERE id = %s", (status, id))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Erro ao atualizar status: {e}")
        return False

# ============ RELATORIOS ============

def get_total_gastos():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(SUM(valor_total), 0) FROM gastos WHERE status_aprovacao = 'aprovado'")
        total = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return float(total)
    except Exception as e:
        print(f"Erro ao calcular total: {e}")
        return 0

def get_gastos_por_setor():
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT o.setor, COALESCE(SUM(g.valor_total), 0) as total
            FROM gastos g
            JOIN ocorrencias o ON g.id_ocorrencia = o.id
            WHERE g.status_aprovacao = 'aprovado'
            GROUP BY o.setor
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Erro ao buscar gastos por setor: {e}")
        return []