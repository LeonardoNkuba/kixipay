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

Dia 7 concluido no lado de codigo (modo demo pronto para pitch). Falta apenas o deploy em si
(Vercel/Railway), que depende de contas que so o utilizador tem acesso — ver `docs/deploy-checklist.md`.

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

Entregas validadas (Dia 4):
- Servico de indice de confianca (`apps/api/src/modules/trust-score`): recalcula `score`/`onTimePayments`/`latePayments` por membro a cada contribuicao ou emprestimo pago
- Pontualidade de contribuicoes calculada a partir do dia de cobranca do grupo (`GroupSettings.collectionDay`); pontualidade de emprestimos calculada ao quitar o valor total antes ou depois da data de vencimento
- Interface de contribuicoes: registo de pagamento (admin/tesoureiro podem registar por qualquer membro; membro comum so registra a propria contribuicao)
- Badge de confianca na aba Membros de cada grupo

Entregas validadas (Dia 5):
- Endpoint `GET /api/dashboard` consolidado no backend, substituindo a agregacao N+1 que o frontend fazia (uma chamada a `/groups` mais uma chamada a `/loans/group/:id` por grupo)
- Grafico "Emprestimos por Status" no dashboard (pendente/aprovado/rejeitado/pago), com paleta de cores validada para contraste e daltonismo (`node scripts/validate_palette.js`, skill dataviz)

Internacionalizacao (fora do cronograma de 7 dias, a pedido):
- Interface do `apps/web` traduzida para portugues, ingles, espanhol e frances (`apps/web/src/i18n/`)
- Troca de idioma client-side (sem rotas por locale), persistida em `localStorage`, disponivel no ecra de login/registo e no cabecalho/definicoes da aplicacao
- Mensagens de erro devolvidas pela API continuam em portugues (fora deste escopo; exigiria codigos de erro em vez de texto livre)

Entregas validadas (Dia 6):
- Correcao de responsividade: dropdown de cargo na tabela de Membros ficava ilegivel (~1 caractere) em ecrans estreitos por falta de largura minima; agora o cargo fica legivel e a tabela usa scroll horizontal como as demais
- Testes automatizados (`apps/api`, Vitest): 15 testes cobrindo o calculo de indice de confianca e, em especial, a logica de pontualidade (`isContributionOnTime`/`isLoanPaymentOnTime`), extraida para `apps/api/src/modules/trust-score/punctuality.ts` com um teste de regressao para o bug de fuso horario do Dia 4
- Pagina de Relatorios com dados reais: novo endpoint `GET /api/reports/summary` (totais de contribuicoes coletadas/pendentes e emprestimos emitidos/em aberto, resumo por grupo, ranking de confianca dos membros)
- `npm run lint` (apps/web) corrigido: a regra `react-hooks/set-state-in-effect` conflitava com o padrao "fetch on mount" usado em todos os hooks de dados da aplicacao; desativada com justificativa em `eslint.config.mjs`

Entregas validadas (Dia 7):
- Modo demo ponta-a-ponta: botao "Experimentar demo ao vivo" no ecra de login (`POST /api/auth/demo`) cria/reaproveita uma conta `demo@kixipay.ao` (`isDemo=true` no modelo `User`, nova migracao) e faz login automatico, sem palavra-passe
- Dataset de demonstracao realista gerado sob pedido (`apps/api/src/modules/demo/demo-dataset.ts`): 1 grupo, 18 membros, 6 meses de contribuicoes (108 registos com mistura de pagas/atrasadas/pendentes), 5 emprestimos em todos os estados (pendente/aprovado/rejeitado/pago), indices de confianca calculados, transacoes, notificacoes e registos de auditoria
- Botao "Reiniciar demo" no cabecalho (visivel so para a conta demo, com o badge "Ambiente de demonstracao"): chama `POST /api/admin/reset-demo` e repoe os dados de demonstracao sem precisar de redeploy
- `docs/deploy-checklist.md`: guia passo-a-passo para deploy em Vercel (web) e Railway (api) sobre a base Supabase existente — o deploy em si nao foi executado nesta sessao, requer as contas do utilizador
- Correcao de seguranca: senha real da base de dados removida de `.env.example` (estava commitada em texto simples)

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
- docs/deploy-checklist.md

## Scripts (raiz)

- npm run dev
- npm run dev:web
- npm run dev:api
- npm run build
- npm run typecheck
- npm run test
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

## Proximo Marco

- Deploy real (web no Vercel, API no Railway, conforme `docs/deploy-checklist.md`) - ainda nao existe implantacao publica; o codigo esta pronto, falta so executar os passos (contas Vercel/Railway sao do utilizador)
- `JWT_SECRET` de producao: gerar um valor novo e forte, nao reaproveitar o placeholder do `.env.example`
- Pitch e video de demonstracao (o modo demo torna isto trivial: basta clicar "Experimentar demo ao vivo")
- Nota de seguranca em aberto (decisao do utilizador, adiada para depois do pitch): a senha real da base de dados Supabase esteve commitada no `.env` versionado deste repositorio publico e ainda nao foi rodada — recomendado rodar a senha no painel do Supabase antes de dar uso continuo a esta base
- Sugestao: rodar `npm run prisma:seed` antes da demo para limpar dados de teste acumulados durante o desenvolvimento (grupos "EvolvOUT"/"Contas da Empresa" e alguns registos avulsos de contribuicao/emprestimo usados para validar funcionalidades) — os dados da conta demo (`demo@kixipay.ao`) sao independentes e reiniciam-se pelo botao "Reiniciar demo"
