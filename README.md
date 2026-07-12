# KixiPay

KixiPay e uma FinTech Social para digitalizar a Kixikila e criar confianca atraves da tecnologia.

## Visao

Nao estamos a construir apenas um sistema de registos.

Estamos a construir uma plataforma que:
- digitaliza grupos de poupanca comunitaria
- aumenta transparencia nas contribuicoes e emprestimos
- reduz conflitos, fraude e perda de registos
- cria historico de confianca para inclusao financeira futura

## Estado Atual

Monorepo inicializado com:
- apps/web (Next.js + TypeScript)
- apps/api (Express + TypeScript)
- packages/ui
- packages/types
- packages/utils

## Marco Atual

Dia 3 concluido (CRUD de grupos, gestao de membros e fluxo de emprestimos ponta a ponta).

Entregas validadas (Dia 1):
- Backend API operacional (Express + TypeScript)
- Banco de dados PostgreSQL configurado com Prisma
- Autenticacao JWT funcional
- Hash de senha com bcrypt
- Login funcional (frontend e API)
- Middleware de autenticacao ativo
- Rotas protegidas no backend
- Dashboard protegido no frontend

Entregas validadas (Dia 2):
- Sessao do frontend integrada com `GET /api/auth/me`
- Fluxo de registro completo (frontend + API), com login automatico apos o cadastro
- Recuperacao de senha (modo demo: link gerado e logado no console da API, sem envio real de email)
- Dashboard com dados reais de grupos, contribuicoes e emprestimos
- Convite de membros para grupos por email (token de convite, aceitacao via link, cadastro ou login do convidado)
- Fallback de migrations do Prisma para o pooler do Supabase (`scripts/apply-migration.ts`), documentado em `prisma/README.md`

Entregas validadas (Dia 3):
- CRUD completo de grupos: edicao (`PATCH /api/groups/:groupId`) e mudanca de estado - pausar/reativar/encerrar (`PATCH /api/groups/:groupId/status`)
- Gestao de membros existentes: alterar cargo e remover do grupo (`PATCH`/`DELETE /api/groups/:groupId/members/:membershipId`), com protecao contra remover o ultimo administrador do grupo
- Fluxo de emprestimos ponta a ponta na interface: solicitacao, aprovacao/rejeicao e registo de pagamento (endpoints de emprestimo ja existiam na API; passaram a estar acessiveis pela UI)
- Correcao de seguranca: `GET /api/loans/group/:groupId` deixou de expor hash de senha e token de recuperacao dos utilizadores

## Estrutura

```text
kixipay/
|- apps/
|  |- web/
|  \- api/
|- packages/
|  |- ui/
|  |- types/
|  \- utils/
|- docs/
|- database/
|- prisma/
|- assets/
\- README.md
```

## Documentacao de Produto

- docs/vision.md
- docs/mvp-features.md
- docs/premium-features.md
- docs/architecture-stack.md
- docs/data-model.md
- docs/roadmap-7-days.md

## Scripts (raiz)

- npm run dev
- npm run dev:web
- npm run dev:api
- npm run build
- npm run typecheck
- npm run prisma:generate
- npm run prisma:migrate
- npm run prisma:seed

## Como Executar

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variaveis de ambiente (raiz):

- criar `.env` com base em `.env.example`
- definir `JWT_SECRET`, `DATABASE_URL` e `DIRECT_URL`

3. Subir frontend e backend:

```bash
npm run dev
```

4. Enderecos locais:

- Web: http://localhost:3000
- API: http://localhost:3333
- Health: http://localhost:3333/health

## Conta Demo (Seed)

- Email: {privado}
- Senha: {privado}

## Proximo Marco (Dia 4)

- Indice de confianca (trust score) calculado a partir da pontualidade de contribuicoes/pagamentos (modelo ja existe no schema; falta o servico de calculo e a atualizacao automatica apos cada pagamento)
- Fluxo de contribuicoes na interface (hoje so existe criacao via API/seed)
