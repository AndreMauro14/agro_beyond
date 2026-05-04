# PRD — Mandaca: Gestão Agrícola via WhatsApp

## 1. Informações Gerais

- **Nome do Produto:** Mandaca
- **Responsáveis:** André Mauro, Lucas Tenorio, Mateus Ferreira, Ester Feliciano, Geovana Leticia
- **Data:** 04 de maio de 2026
- **Status:** MVP em desenvolvimento (Versão de Validação)

## 2. Objetivo e Visão do Produto

### 2.1. Problema a ser Resolvido

"O produtor rural brasileiro enfrenta o 'Apagão Operacional do Campo': capatazes, tratoristas e funcionários relatam ocorrências, gastos e despesas operacionais por canais informais — principalmente grupos de WhatsApp — em formato de texto livre, foto e áudio. Essas informações se perdem na timeline da conversa, não são consolidadas em nenhum sistema, e o gestor descobre o estouro de orçamento ou a perda de uma máquina dias depois, quando o prejuízo já se materializou. As soluções tradicionais de ERP agrícola exigem treinamento da equipe em apps complexos, fricção que torna a adoção em campo inviável."

### 2.2. Público-Alvo (Persona)

**Perfil de Usuário: O Gestor da Fazenda**

- **Perfil:** Pequeno e médio produtor rural ou administrador de fazenda no Brasil, responsável por gestão financeira e operacional da propriedade.
- **Necessidades:** Visibilidade em tempo quase-real sobre gastos e ocorrências da operação, sem precisar treinar equipe em ferramentas novas; controle de aprovação antes que despesas virem oficiais; consolidação automática por setor (lavoura, pecuária, manutenção) e por produto.
- **Dores:** Mensagens importantes se perdem no grupo do WhatsApp; dificuldade em fechar mês porque não há base estruturada; equipe operacional resiste a usar apps; planilhas ficam desatualizadas e divergem da realidade do campo.

**Persona Secundária: O Capataz / Operador de Campo**

- Reporta ocorrências e gastos no WhatsApp como já faz hoje. Não interage diretamente com o sistema — sua experiência é zero-fricção: continua mandando mensagem no grupo.

### 2.3. Benefícios Esperados

- **Captura Passiva Zero-Fricção:** A equipe de campo continua usando o WhatsApp como sempre — o sistema escuta o grupo dedicado e estrutura os dados sem mudar o comportamento do funcionário.
- **Inteligência Híbrida:** Parser regex resolve 70% dos casos de graça; fallback Gemini AI cobre os 30% restantes só quando necessário, controlando custo de IA.
- **Aprovação Antes da Oficialização:** Todo gasto identificado entra em fila de aprovação — o gestor decide o que vai virar lançamento contábil.
- **Visualização Consolidada:** Dashboard de fluxo de caixa com cortes por setor, produto e mês, alimentado em tempo real pelo bot.

## 3. Matriz CSD (Certezas, Suposições e Dúvidas)

| Certezas | Suposições (Salto de Fé) | Dúvidas |
|---|---|---|
| O WhatsApp já é o canal de fato da operação rural — substituí-lo é inviável; integrar com ele é o único caminho. | **Salto de Fé:** Um parser híbrido (regex + LLM) consegue extrair `produto + valor + setor` com precisão suficiente (>80%) sem necessidade de comandos estruturados pela equipe. | Como evoluir o parser quando aparecerem dialetos regionais ou abreviações específicas de cada fazenda? |
| O gestor exige etapa de aprovação antes de gastos virarem oficiais — confiar 100% no parser não é aceitável. | A captura via grupo dedicado (filtrado por `GRUPO_WHATSAPP`) é suficiente para isolar mensagens de trabalho de mensagens pessoais. | A latência atual (buffer de 20s) é tolerável para o gestor, ou é preciso entregar quase-instantâneo? |
| Pareamento por QR Code funciona; pareamento por pair code (digitar telefone e receber código de 8 dígitos) ainda apresenta falhas de timing com o websocket do neonize. | A persona não precisa de mobile app dedicado no MVP — acesso via web (desktop ou mobile responsivo) é suficiente. | Qual o volume real de mensagens/dia em uma fazenda média? O buffer de 20s e o quota gratuita do Gemini sustentam? |

## 4. Funcionalidades do MVP (Features)

### 4.1. Captura via Webhook do WhatsApp com Filtro de Grupo

- **Descrição:** Bot Neonize conectado ao WhatsApp do gestor escuta um grupo dedicado (controlado pela env `GRUPO_WHATSAPP`). Mensagens de fora do grupo são descartadas para isolar contexto operacional de pessoal.
- **Objetivo:** Garantir que apenas mensagens de trabalho cheguem ao pipeline de processamento, evitando ruído e custo de IA desnecessário.
- **Critério de Aceitação:**
  - **Dado** que `GRUPO_WHATSAPP=219404713337054` está configurado no `.env`;
  - **Quando** uma mensagem é enviada em um chat diferente desse ID;
  - **Então** o bot loga `[Filtro] Ignorando chat...` e nada é gravado no banco.
- **Status de Entrega:** ✅ Sim

### 4.2. Buffer de Mensagens com Janela Temporal

- **Descrição:** Mensagens do mesmo telefone são acumuladas em Redis por 20 segundos (configurável via `MESSAGE_BUFFER_SECONDS`) antes de irem para o parser, permitindo que o usuário envie múltiplas mensagens fragmentadas que serão processadas como uma só.
- **Objetivo:** Lidar com o comportamento natural do WhatsApp em que um relato vem em 3-4 mensagens curtas em sequência, evitando criar 4 ocorrências separadas.
- **Critério de Aceitação:**
  - **Dado** que o usuário enviou "comprei adubo" às 10:00:00 e "300 reais 2 sacos" às 10:00:08;
  - **Quando** o timer de 20s expira após a segunda mensagem;
  - **Então** o sistema processa o texto consolidado "comprei adubo 300 reais 2 sacos" como uma única ocorrência/gasto.
- **Status de Entrega:** ✅ Sim

### 4.3. Parser Híbrido (Regex + Gemini AI)

- **Descrição:** Pipeline de duas camadas: (1) parser regex local resolve casos previsíveis (gasto com valor explícito, padrão `produto X reais`); (2) fallback para Gemini API só quando regex falha. Ambos retornam JSON estruturado: `{tipo, descricao, setor, produto, valor_unitario, quantidade}`.
- **Objetivo:** Estruturar texto livre com >80% de precisão, mantendo custo de IA controlado (regex grátis para o caminho comum).
- **Critério de Aceitação:**
  - **Dado** que o usuário envia "comprei 2 sacos de adubo a 150 reais cada";
  - **Quando** o regex casa com sucesso;
  - **Então** o sistema salva ocorrência com `tipo=gasto, produto=adubo, valor_unitario=150, quantidade=2, fonte=regex`, sem chamar a Gemini.
- **Status de Entrega:** ✅ Sim

### 4.4. Aprovação de Gastos

- **Descrição:** Gastos extraídos pelo parser entram com `status_aprovacao=aprovado` (caminho otimista para reduzir fricção do gestor), mas podem ser reprovados a qualquer momento pelo gestor via dashboard. Edição de valor, produto e quantidade também é suportada.
- **Objetivo:** Dar controle ao gestor sem bloquear o fluxo automático.
- **Critério de Aceitação:**
  - **Dado** que existe um gasto com status `aprovado`;
  - **Quando** o gestor clica em "Reprovar";
  - **Então** o status muda para `reprovado` e o gasto é excluído dos cálculos de fluxo de caixa.
- **Status de Entrega:** ✅ Sim

### 4.5. Lançamento Manual de Gasto e Ganho

- **Descrição:** Página `/caixa` permite que o gestor lance saídas (gastos sem origem no WhatsApp) e entradas (ganhos: venda de soja, leite, gado etc.) diretamente via formulário.
- **Objetivo:** Cobrir o cenário em que a despesa não passa pelo grupo do WhatsApp (ex.: pagamento de boleto pelo gestor) e capturar entradas, fechando o ciclo de fluxo de caixa.
- **Critério de Aceitação:**
  - **Dado** que o gestor preencheu descrição, valor e setor no formulário de saída manual;
  - **Quando** ele clica em "Lançar";
  - **Então** o sistema cria uma ocorrência sintética com prefixo `[Manual]` e o gasto associado já aprovado.
- **Status de Entrega:** ✅ Sim

### 4.6. Dashboard de Fluxo de Caixa

- **Descrição:** Visualização consolidada de gastos e ganhos, com gráficos por setor, por produto (top 5) e evolução mensal (últimos 6 meses). Filtro por grupo de produto/setor disponível.
- **Objetivo:** Substituir planilhas dispersas por uma visão única e atualizada em tempo real.
- **Critério de Aceitação:**
  - **Dado** que existem 50 gastos aprovados nos últimos 6 meses;
  - **Quando** o gestor abre o dashboard;
  - **Então** o gráfico de barras "por mês" é renderizado em <1s com os totais agregados corretamente.
- **Status de Entrega:** ✅ Sim

### 4.7. Pareamento WhatsApp por QR Code e Pair Code

- **Descrição:** Tela `/Conectar` exibe QR Code gerado pelo Neonize para vincular o número do bot. Alternativamente, o gestor pode digitar o telefone e receber um código de 8 caracteres para inserir manualmente em "Aparelhos Conectados → Conectar com número de telefone" no app do WhatsApp.
- **Objetivo:** Permitir conexão inicial sem depender de leitura de QR (útil em ambientes com câmera bloqueada ou suporte remoto).
- **Critério de Aceitação:**
  - **Dado** que o bot está em estado `disconnected`;
  - **Quando** o gestor digita o telefone e clica em "Solicitar código";
  - **Então** em até 5 segundos o frontend exibe o pair code recebido do bot via Redis + polling em `/whatsapp/status`.
- **Status de Entrega:** 🔄 QR Code funcionando ✅ | Pair Code com bug de timing no websocket do Neonize (refator planejado para próxima iteração).

## 5. Priorização de Requisitos (Matriz MoSCoW)

- **Must Have (Essencial — MVP atual):**
  - Webhook WhatsApp com filtro de grupo dedicado.
  - Parser híbrido regex + Gemini com cache em Redis.
  - Persistência em PostgreSQL (ocorrências, gastos, ganhos).
  - Dashboard de fluxo de caixa com agregações por setor/produto/mês.
  - Aprovação, edição e reprovação de gastos.
  - Pareamento via QR Code.

- **Should Have (Importante — próxima iteração):**
  - Pair code estável (refator do `_pair_command_listener` para resolver `PairPhoneError('websocket not connected')`).
  - Exportação do dashboard em PDF (já existe dependência `jspdf` no frontend).
  - Auto-restart do bot em caso de desconexão prolongada.

- **Could Have (Desejável — médio prazo):**
  - OCR sobre fotos de notas fiscais anexadas no WhatsApp.
  - Multi-fazenda: um único deploy atendendo várias propriedades, isoladas por grupo de WhatsApp.
  - Notificações push para gestor quando gasto exceder limite mensal por setor.
  - Modo "perguntar ao gestor": quando o parser não tem confiança, o bot responde no grupo pedindo clarificação.

- **Won't Have (Fora do Escopo do MVP):**
  - Integração com sistemas bancários ou pagamento de boletos.
  - Reconhecimento de áudio (transcrição de áudios do WhatsApp).
  - App mobile nativo (iOS/Android).
  - Integração com ERPs agrícolas (TOTVS Agro, Aegro etc.).
  - Compartilhamento social ou marketplace.

## 6. Roadmap de Desenvolvimento

1. **Curto Prazo (0–3 meses): Validação em Campo**
   - Refator do pair code para resolver bug de websocket.
   - Pilotar com 2–3 produtores rurais reais durante uma safra parcial.
   - Calibrar o parser regex com vocabulário real coletado dos pilotos.
   - Métricas de adoção: % de mensagens automaticamente identificadas, latência média mensagem→ocorrência.

2. **Médio Prazo (3–6 meses): Robustez e Multi-tenant**
   - Suporte a múltiplas fazendas no mesmo deploy (multi-grupo, isolamento de dados).
   - OCR de fotos de notas fiscais (extração automática de valor + fornecedor + CNPJ).
   - Exportação PDF de relatório mensal.
   - Auto-recuperação do bot (reconexão automática, persistência de sessão).

3. **Longo Prazo (6+ meses): Ecossistema Agro**
   - Integração via API com ERPs agrícolas e sistemas de contabilidade.
   - Modo conversacional: o bot responde no grupo confirmando lançamentos e tirando dúvidas.
   - Insights preditivos: alertas de tendência de gastos por setor com base em sazonalidade.
   - App mobile dedicado para o gestor (com push de aprovação).

## 7. Escopo Negativo e Restrições

Não serão contempladas integrações bancárias, transcrição de áudio, app nativo nem integração com ERPs agrícolas nesta fase.

- **Justificativa (Teoria do Cupcake):** O foco do MVP está na "camada vital": validar que a captura passiva via WhatsApp + parser híbrido + dashboard de aprovação resolve a dor do produtor a ponto dele preferir essa solução em vez da planilha. Adicionar integrações bancárias, OCR avançado ou app nativo agora seria construir o "recheio" antes de saber se a "massa" (o pipeline WhatsApp→banco→dashboard) é palatável.

## 8. Critérios de Sucesso e Métricas (KPIs)

- **Taxa de Identificação Automática:** % de mensagens enviadas no grupo que viram ocorrências classificadas (≠ `indefinido`). **Meta: > 80%.**
- **Distribuição Regex vs. Gemini:** % de identificações resolvidas pelo parser regex, sem chamada à Gemini. **Meta: > 60%** (controle de custo de IA).
- **Latência Mensagem→Ocorrência:** Tempo médio do recebimento da última mensagem do buffer até persistência no banco. **Meta: < 30s** (buffer 20s + processamento).
- **Taxa de Aprovação no Primeiro Clique:** % de gastos que o gestor aprova sem editar. **Meta: > 70%** (proxy de qualidade do parser).
- **Adoção de Lançamento Manual:** Razão entre gastos manuais e gastos automáticos. **Meta: < 30%** (se passar disso, a captura via WhatsApp não está funcionando como deveria).

## 9. Requisitos Técnicos e Sistêmicos

- **Plataforma Backend:** FastAPI (Python 3.11+) + Uvicorn, com bot WhatsApp em subprocess (Neonize). PostgreSQL como banco relacional. Redis para buffer de mensagens e fila de comandos do pareamento. Containerização via Docker Compose.
- **Plataforma Frontend:** React 18 + Vite + TypeScript, organizado em **Clean Architecture** (camadas: `domain/`, `application/`, `infrastructure/`, `presentation/`). UI com Tailwind + shadcn/ui (Radix). Gráficos via Recharts. Estado servidor via TanStack Query.
- **Integrações:**
  - **Neonize** (cliente WhatsApp não-oficial baseado em whatsmeow).
  - **Google Gemini API** (parser fallback de IA).
- **Performance:** Resposta da API REST em <200ms para endpoints de leitura. Pipeline assíncrono no webhook não pode bloquear a resposta ao Neonize por mais de 5s.
- **Confiabilidade:** Buffer Redis com TTL de 60s evita perda silenciosa em caso de timer falho. Bot WhatsApp deve reconectar automaticamente após queda de rede (atualmente manual — débito técnico documentado).
- **Compliance:** Mensagens contêm dados pessoais e financeiros — armazenamento em banco local do produtor, sem retenção em logs públicos. Em produção, exigir HTTPS e rotação de chave Gemini.
- **Compatibilidade:** Frontend responsivo mobile-first, testado em Chrome v100+, Safari v15+ e Edge.
