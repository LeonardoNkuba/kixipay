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

Dia 1 concluido.

Entregas validadas:
- Backend API operacional (Express + TypeScript)
- Banco de dados PostgreSQL configurado com Prisma
- Autenticacao JWT funcional
- Hash de senha com bcrypt
- Login funcional (frontend e API)
- Middleware de autenticacao ativo
- Rotas protegidas no backend
- Dashboard protegido no frontend

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

- Email: leonardo@kixipay.ao
- Senha: 123456

## Proximo Marco (Dia 2)

- Integrar sessao do frontend com `GET /api/auth/me`
- Implementar fluxo de registro no frontend
- Montar dashboard com dados reais de grupos, contribuicoes e emprestimos
