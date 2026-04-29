# Mandaca 🌾

O **Mandaca** é uma solução inteligente e ágil para a gestão financeira e acompanhamento de ocorrências diárias. Ele combina uma API em Python poderosa (com um bot integrado via WhatsApp) e um painel de controle moderno construído com React/Vite.

## 🚀 Tecnologias Utilizadas

### Backend (Python)
- **FastAPI**: Criação rápida e robusta de APIs.
- **Neonize**: Integração de bot diretamente pelo WhatsApp.
- **PostgreSQL**: Banco de dados relacional.
- **Redis**: Cache e sessões de estado.
- **Docker**: Orquestração e conteinerização do banco de dados e mensageria.

### Frontend (JavaScript/React)
- **React + Vite**: Framework moderno e de alta performance.
- **Tailwind CSS**: Estilização do painel e componentes fluídos.

## 📁 Estrutura do Projeto

O repositório é organizado em um formato de *Monorepo*, separando claramente as responsabilidades:

```text
agro_beyond/
├── backend/          # Todo o código Python (API, Script de Tabelas, Bot do WhatsApp)
├── frontend/         # Todo o código React/Vite (Telas, Componentes e Hooks)
├── docker-compose.yml# Configuração e orquestração do PostgreSQL e Redis
└── .env              # Variáveis de ambiente e senhas (ignorado pelo git)
```

## 🛠️ Como Rodar o Projeto Localmente

Para rodar o projeto na sua máquina, você vai precisar do **Docker Desktop**, **Python 3+**, e **Node.js** instalados.

Serão necessários **3 terminais** separados na raiz do projeto:

### 1. Subindo o Banco de Dados (Docker)
No **Terminal 1**, rode o comando abaixo para baixar e iniciar o PostgreSQL e o Redis em segundo plano:
```bash
docker-compose up -d
```
> **Nota:** Certifique-se de possuir o arquivo `.env` na raiz do projeto contendo as credenciais do banco (ex: `DB_PORT=5433`, `DB_USER=postgres`, `DB_PASSWORD=postgres`, etc).

### 2. Rodando a API e o Bot do WhatsApp (Backend)
No **Terminal 2**, entre na pasta do backend, instale as dependências e rode a API:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn api.main:app --reload
```
> A API ficará disponível na porta `8000`. O Bot do WhatsApp será inicializado automaticamente em segundo plano assim que o Uvicorn subir!
> **Dica:** Se for a primeira vez rodando um banco zerado, certifique-se de rodar `python create_tables.py` dentro de `backend/` para popular as tabelas iniciais.

### 3. Rodando o Painel de Controle (Frontend)
No **Terminal 3**, entre na pasta do frontend, instale os pacotes e suba a interface:
```bash
cd frontend
npm install
npm run dev
```
> Acesse o link gerado no terminal (geralmente `http://localhost:8080` ou `5173`) pressionando `Ctrl + Clique` para abrir a aplicação no seu navegador.

---
**Pareamento do WhatsApp:** Assim que o projeto estiver rodando, acesse a aba "Conectar" no Frontend para visualizar o QR Code do Neonize e realizar o pareamento do seu número.
