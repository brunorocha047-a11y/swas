# MAGMA-OS Frontend & Backend - TODO

## Backend (Fastify + Prisma)

### Módulo 1: Mapeamento (Fase M)
- [x] Endpoint POST /api/v1/mapeamento - Criar/atualizar MagmaMapeamento com Personas
- [x] Endpoint GET /api/v1/mapeamento - Recuperar dados de mapeamento do tenant
- [x] Validação de awarenessLevel (1-5) no backend
- [x] Isolamento multi-tenant garantido pelo middleware do Prisma

### Módulo 2: Pilares & Estratégia (Fase A)
- [x] Endpoint POST /api/v1/pilares - Criar Pilar e TopicClusters
- [x] Endpoint GET /api/v1/pilares - Listar pilares do projeto
- [x] Endpoint PATCH /api/v1/project - Atualizar projeto com manifesto e script
- [x] Validação de dados de entrada com Zod

## Frontend (Next.js + React)

### Módulo 1: Onboarding & Mapeamento
- [x] Página /onboarding/brand - Brand Story Canvas
- [x] Página /onboarding/audience - Audience Intelligence (Personas)
- [x] Página /onboarding/competitors - Competitive Landscape
- [x] Componentes React com ShadCN/UI e React Hook Form
- [x] Integração com API do backend

### Módulo 2: Estratégia & Ativação
- [x] Página /strategy/pillars - Editor de Pilares e TopicClusters
- [x] Página /strategy/manifesto - Editor de Brand Manifesto
- [x] Página /strategy/storybrand - Formulário de 7 passos do StoryBrand
- [x] Componentes React com ShadCN/UI e React Hook Form
- [x] Integração com API do backend

## Segurança & Validação
- [ ] Isolamento multi-tenant garantido em todas as rotas
- [ ] Validação de dados de entrada no frontend e backend
- [ ] Nenhum dado sensível deve vazar entre tenants
- [ ] Autenticação com Clerk integrada


## Módulo 3: Content Factory (Fase G)

### Backend (Fastify + Prisma)
- [x] Endpoint POST /api/v1/content-pieces/:id/generate-pilar - Gerar conteúdo pilar com IA
- [x] Integração com API de IA (Anthropic Claude 3.5 Sonnet ou OpenAI GPT-4)
- [x] Agente de IA para geração de peças satélite (LinkedIn, Instagram, X, etc.)
- [x] Endpoint PATCH /api/v1/content-pieces/:id/status - Atualizar status do conteúdo
- [x] Lógica de transição de estados (máquina de estados)
- [ ] Rate limiting (máximo 10 chamadas/min por tenant)
- [ ] Logs de prompt/response para debug

### Frontend (React)
- [x] Página /content-factory - Interface Kanban
- [x] Componente Kanban com drag-and-drop (@dnd-kit)
- [x] Colunas: BACKLOG → PILAR EM REVISÃO → PILAR APROVADO → SATELITE EM REVISÃO → APROVADO
- [x] Botão "Enviar para IA" para gerar conteúdo pilar
- [x] Botão "Aprovar Pilar" para disparar geração de satélites
- [x] Botão "Aprovar Satélite" para atualizar status
- [x] Visualização de rascunhos de IA (aiDraftV1)

## Segurança & Validação
- [x] Isolamento multi-tenant garantido em todas as rotas
- [x] Validação de dados de entrada no frontend e backend
- [ ] Nenhum dado sensível deve vazar entre tenants


## Módulo 4: Webhook de Saída (Integração Zapier)

### Backend (Fastify + Prisma)
- [x] Função triggerOutboundWebhook em outboundWebhook.ts
- [x] Retry com backoff exponencial (3 tentativas)
- [x] Idempotência (evitar envios duplicados)
- [x] Validação de URL (https://hooks.zapier.com/ ou https://hooks.make.com/)
- [x] Integração com contentFactoryRoutes.ts (disparo no status APROVADO)
- [x] Logging de sucesso/falha
- [x] Atualização de status para PUBLICADO após envio bem-sucedido

### Frontend (React)
- [x] Página /admin/tenants/[id] - Painel de administração
- [x] Campo "Webhook de Publicação (Zapier)"
- [x] Tooltip com instruções de configuração
- [x] Validação de URL no frontend
- [x] Integração com API de atualização de TenantConfig


## Módulo 5: Loop de Otimização (Fase A - Ajustamento)

### Backend (Fastify + Prisma)
- [x] Endpoint PATCH /api/v1/pilares/:id - Atualizar status de pilar
- [x] Validação de permissão OPB-only
- [x] Filtro de status em geração de conteúdo (ATIVO | OTIMIZANDO, nunca ELIMINADO)
- [x] Tabela AbTestLog para log de testes A/B
- [x] Endpoint POST /api/v1/ab-tests - Criar log de teste A/B

### Frontend (React)
- [x] Página /optimization - Interface de análise e decisão estratégica
- [x] Listagem de pilares com status visual (✅, 🔧, 🗑️)
- [x] Exibição de métricas de desempenho por pilar
- [x] Botões de ação: Repetir, Otimizar, Eliminar
- [x] Formulário de log de testes A/B
- [x] Controle de acesso OPB-only


## Fluxo 1: Onboarding Automatizado de Clientes

### Backend (Fastify + Prisma)
- [x] Endpoint POST /api/v1/webhooks/stripe - Webhook público do Stripe
- [x] Validação de assinatura com STRIPE_WEBHOOK_SECRET
- [x] Função provisionNewTenant em provisioning.ts
- [x] Criação de Tenant com stripeCustomerId
- [x] Criação de Usuário no Clerk com metadados
- [x] Criação de Projeto inicial
- [x] Envio de email de boas-vindas com Resend
- [x] Idempotência com stripe_events table
- [x] Retry logic e logging de erros

### Frontend (React)
- [x] Página /pricing com campo "Nome da Empresa/Projeto"
- [x] Integração com Stripe Checkout
- [x] Passagem de client_reference_id para Stripe
- [x] Redirecionamento pós-checkout para /onboarding/brand
