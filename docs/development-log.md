# Diario de Desenvolvimento

Registo dia-a-dia da construcao do KixiPay ao longo de um sprint de 7 dias
(`docs/roadmap-7-days.md`). Mantido separado do `README.md` porque e detalhe demasiado
granular para quem esta a conhecer o projeto pela primeira vez — serve como historico e
justificativa de decisoes tecnicas, nao como apresentacao do produto.

## Dia 1

- Backend API operacional (Express + TypeScript)
- Banco de dados PostgreSQL configurado com Prisma
- Autenticacao JWT funcional
- Hash de senha com bcrypt
- Login funcional (frontend e API)
- Middleware de autenticacao ativo
- Rotas protegidas no backend
- Dashboard protegido no frontend

## Dia 2

- Sessao do frontend integrada com `GET /api/auth/me`
- Fluxo de registro completo (frontend + API), com login automatico apos o cadastro
- Recuperacao de senha (modo demo: link gerado e logado no console da API, sem envio real de email)
- Dashboard com dados reais de grupos, contribuicoes e emprestimos
- Convite de membros para grupos por email (token de convite, aceitacao via link, cadastro ou login do convidado)
- Fallback de migrations do Prisma para o pooler do Supabase (`scripts/apply-migration.ts`), documentado em `prisma/README.md`

## Dia 3

- CRUD completo de grupos: edicao (`PATCH /api/groups/:groupId`) e mudanca de estado - pausar/reativar/encerrar (`PATCH /api/groups/:groupId/status`)
- Gestao de membros existentes: alterar cargo e remover do grupo (`PATCH`/`DELETE /api/groups/:groupId/members/:membershipId`), com protecao contra remover o ultimo administrador do grupo
- Fluxo de emprestimos ponta a ponta na interface: solicitacao, aprovacao/rejeicao e registo de pagamento (endpoints de emprestimo ja existiam na API; passaram a estar acessiveis pela UI)
- Correcao de seguranca: `GET /api/loans/group/:groupId` deixou de expor hash de senha e token de recuperacao dos utilizadores

## Dia 4

- Servico de indice de confianca (`apps/api/src/modules/trust-score`): recalcula `score`/`onTimePayments`/`latePayments` por membro a cada contribuicao ou emprestimo pago
- Pontualidade de contribuicoes calculada a partir do dia de cobranca do grupo (`GroupSettings.collectionDay`); pontualidade de emprestimos calculada ao quitar o valor total antes ou depois da data de vencimento
- Interface de contribuicoes: registo de pagamento (admin/tesoureiro podem registar por qualquer membro; membro comum so registra a propria contribuicao)
- Badge de confianca na aba Membros de cada grupo

## Dia 5

- Endpoint `GET /api/dashboard` consolidado no backend, substituindo a agregacao N+1 que o frontend fazia (uma chamada a `/groups` mais uma chamada a `/loans/group/:id` por grupo)
- Grafico "Emprestimos por Status" no dashboard (pendente/aprovado/rejeitado/pago), com paleta de cores validada para contraste e daltonismo (`node scripts/validate_palette.js`, skill dataviz)

## Internacionalizacao (fora do cronograma de 7 dias, a pedido)

- Interface do `apps/web` traduzida para portugues, ingles, espanhol e frances (`apps/web/src/i18n/`)
- Troca de idioma client-side (sem rotas por locale), persistida em `localStorage`, disponivel no ecra de login/registo e no cabecalho/definicoes da aplicacao
- Mensagens de erro devolvidas pela API continuam em portugues (fora deste escopo; exigiria codigos de erro em vez de texto livre)

## Dia 6

- Correcao de responsividade: dropdown de cargo na tabela de Membros ficava ilegivel (~1 caractere) em ecrans estreitos por falta de largura minima; agora o cargo fica legivel e a tabela usa scroll horizontal como as demais
- Testes automatizados (`apps/api`, Vitest): 15 testes cobrindo o calculo de indice de confianca e, em especial, a logica de pontualidade (`isContributionOnTime`/`isLoanPaymentOnTime`), extraida para `apps/api/src/modules/trust-score/punctuality.ts` com um teste de regressao para o bug de fuso horario do Dia 4
- Pagina de Relatorios com dados reais: novo endpoint `GET /api/reports/summary` (totais de contribuicoes coletadas/pendentes e emprestimos emitidos/em aberto, resumo por grupo, ranking de confianca dos membros)
- `npm run lint` (apps/web) corrigido: a regra `react-hooks/set-state-in-effect` conflitava com o padrao "fetch on mount" usado em todos os hooks de dados da aplicacao; desativada com justificativa em `eslint.config.mjs`

## Dia 7

- Modo demo ponta-a-ponta: botao "Experimentar demo ao vivo" no ecra de login (`POST /api/auth/demo`) cria/reaproveita uma conta `demo@kixipay.ao` (`isDemo=true` no modelo `User`, migracao `20260713170000_add_user_is_demo`) e faz login automatico, sem palavra-passe
- Dataset de demonstracao realista gerado sob pedido (`apps/api/src/modules/demo/demo-dataset.ts`): 1 grupo, 18 membros, 6 meses de contribuicoes (108 registos com mistura de pagas/atrasadas/pendentes), 5 emprestimos em todos os estados (pendente/aprovado/rejeitado/pago), indices de confianca calculados, transacoes, notificacoes e registos de auditoria
- Botao "Reiniciar demo" no cabecalho (visivel so para a conta demo, com o badge "Ambiente de demonstracao"): chama `POST /api/admin/reset-demo` e repoe os dados de demonstracao sem precisar de redeploy
- `docs/deploy-checklist.md`: guia passo-a-passo de deploy, originalmente escrito para Vercel (web) + Railway (api); na pratica, ambos os servicos acabaram implantados no Railway (ver secao seguinte)
- Correcao de seguranca: senha real da base de dados removida de `.env.example` (estava commitada em texto simples). O `.env` versionado no repositorio publico continua a expor a senha real na historia do git — rotacao adiada deliberadamente pelo utilizador para depois do pitch

## Deploy (Dia 7, continuacao)

- `apps/api` e `apps/web` foram ambos implantados no Railway (nao Vercel, como o checklist original sugeria) — ver `docs/deploy-checklist.md` para os passos reais usados
- Descoberto e corrigido durante a verificacao: `apps/web` cai para `http://localhost:3333/api` quando `NEXT_PUBLIC_API_URL` nao esta definida em build-time (`apps/web/src/services/api.ts`); como e uma variavel `NEXT_PUBLIC_*`, precisa de rebuild (nao apenas restart) para ter efeito — isto ficou quebrado numa primeira tentativa de deploy ate a variavel ser definida e o servico reconstruido
- URL publico do domínio da API precisa de ser gerado explicitamente em Settings -> Networking -> Public Domain; o dominio `*.railway.internal` gerado automaticamente so funciona dentro da rede privada do Railway, nao e alcancavel pelo browser do visitante
- Verificado ponta-a-ponta em producao (`https://kixipay.up.railway.app`): login demo, dashboard, reset de dados demo, sem erros de consola
