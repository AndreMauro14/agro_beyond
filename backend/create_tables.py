from python_core.database import get_connection

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        nome VARCHAR(150),
        telefone_whatsapp VARCHAR(50) UNIQUE,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ocorrencias (
        id SERIAL PRIMARY KEY,
        telefone VARCHAR(50),
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
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
        id_ocorrencia INTEGER REFERENCES ocorrencias(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
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
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        descricao TEXT,
        categoria VARCHAR(100),
        valor DECIMAL(10,2),
        data DATE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;")
    cursor.execute("ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;")
    cursor.execute("ALTER TABLE ganhos ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE;")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ocorrencias_usuario ON ocorrencias(usuario_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gastos_usuario ON gastos(usuario_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ganhos_usuario ON ganhos(usuario_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone_whatsapp);")

    conn.commit()
    cursor.close()
    conn.close()
    print("Tabelas criadas com sucesso no banco de dados!")

if __name__ == "__main__":
    create_tables()
