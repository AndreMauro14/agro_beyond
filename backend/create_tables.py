from python_core.database import get_connection

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ocorrencias (
        id SERIAL PRIMARY KEY,
        telefone VARCHAR(50),
        descricao TEXT,
        foto_url TEXT,
        setor VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pendente',
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY,
        id_ocorrencia INTEGER REFERENCES ocorrencias(id),
        nome_produto VARCHAR(255),
        valor_unitario DECIMAL(10,2),
        quantidade INTEGER DEFAULT 1,
        valor_total DECIMAL(10,2),
        status_aprovacao VARCHAR(50) DEFAULT 'pendente',
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ganhos (
        id SERIAL PRIMARY KEY,
        descricao TEXT,
        categoria VARCHAR(100),
        valor DECIMAL(10,2),
        data DATE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    print("Tabelas criadas com sucesso no banco de dados!")

if __name__ == "__main__":
    create_tables()
