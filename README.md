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
