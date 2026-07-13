# Checklist de Deploy (Dia 7)

Este documento e um guia manual passo-a-passo. Nao foi testado ponta-a-ponta (nao tenho acesso as
tuas contas Vercel/Railway/Supabase), por isso trata os comandos como ponto de partida e ajusta
conforme o que a UI de cada plataforma pedir.

## 0. Pre-requisitos

- Conta Supabase (ja em uso — ver `.env`)
- Conta Vercel ligada ao GitHub
- Conta Railway ligada ao GitHub
- Repositorio `LeonardoNkuba/kixipay` atualizado no GitHub (`git push`)

## 1. Base de Dados (Supabase — ja provisionada)

Nao ha passo novo aqui: a base de dados de desenvolvimento e a mesma que vai para produgao.
Antes da demo/pitch, corre localmente para limpar dados de teste acumulados:

```bash
npm run prisma:seed
```

Isto recria os 4 utilizadores de teste + grupo "Familia Silva". Os dados de demo "ao vivo"
(18 membros, 6 meses de historico) sao gerados a parte, sob pedido, pelo endpoint
`POST /api/auth/demo` (ver secao 4) — nao precisas de os semear manualmente.

## 2. Backend — Railway (`apps/api`)

Este e um monorepo com npm workspaces: o `apps/api/package.json` sozinho nao instala nada (as
dependencias ficam no `node_modules` da raiz) e o Prisma Client e gerado a partir de
`prisma/schema.prisma` na raiz. Por isso, configura o servico com a **raiz do repositorio** como
Root Directory (nao `apps/api`), e usa comandos customizados:

1. Railway → New Project → Deploy from GitHub repo → seleciona `kixipay`
2. Settings do servico:
   - Root Directory: `/` (raiz, deixa em branco)
   - Build Command: `npm install && npm run prisma:generate && npm run build --workspace @kixipay/api`
   - Start Command: `npm run start --workspace @kixipay/api`
3. Variaveis de ambiente (Settings → Variables):
   ```
   DATABASE_URL=<a mesma connection string do .env, pooler porta 6543>
   DIRECT_URL=<a mesma connection string do .env, pooler porta 5432>
   JWT_SECRET=<gera um valor novo e forte — nao reaproveites o "change-me" do .env.example>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   WEB_APP_URL=https://<o teu dominio Vercel, definido no passo 3>
   ```
   `PORT` e injetada automaticamente pelo Railway — o codigo ja le `process.env.PORT`
   (`apps/api/src/index.ts:10`), nao precisas de a definir.
4. Deploy. Depois de subir, confirma:
   ```bash
   curl https://<o-teu-servico>.up.railway.app/health
   ```
   Deve devolver `{"status":"ok","service":"kixipay-api"}`.

## 3. Frontend — Vercel (`apps/web`)

1. Vercel → Add New Project → importa `kixipay`
2. Root Directory: `apps/web` (a Vercel deteta o `next.config` automaticamente)
3. Framework Preset: Next.js (deteta sozinho)
4. Se o install falhar por causa do workspace (procura por `package-lock.json` na raiz e nao
   encontra por causa do Root Directory), em Settings → Build & Development Overrides define:
   - Install Command: `cd ../.. && npm install`
   - Build Command: `cd ../.. && npm run build --workspace web`
   - Output Directory: `.next` (relativo a `apps/web`)
5. Variaveis de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://<o-teu-servico>.up.railway.app/api
   ```
6. Deploy. Depois de subir, abre `https://<projeto>.vercel.app` e confirma que o ecra de login
   carrega sem erros de consola (Network tab: chamadas a `/api/...` devem apontar para o Railway,
   nao para `localhost:3333`).

## 4. Popular o ambiente de demo

Nao precisas de correr nenhum script manualmente em producao. Assim que alguem carregar em
"Try live demo" no ecra de login (ou fizeres `POST /api/auth/demo`), a API cria automaticamente
uma conta `demo@kixipay.ao` com um grupo de 18 membros e 6 meses de historico
(`apps/api/src/modules/demo/demo-dataset.ts`).

Para reiniciar os dados de demo a qualquer momento (por exemplo, antes de subir ao palco), com a
demo account autenticada:

```bash
curl -X POST https://<o-teu-servico>.up.railway.app/api/admin/reset-demo \
  -H "Authorization: Bearer <token-da-demo-account>"
```

ou usa o botao "Reiniciar demo" que aparece no cabecalho quando estas autenticado como a conta
demo (badge verde "Ambiente de demonstracao").

## 5. Verificacao final antes do pitch

- [ ] `/health` no Railway responde 200
- [ ] Login normal (conta seed real) funciona em producao
- [ ] Botao "Try live demo" funciona e leva ao dashboard sem erros de consola
- [ ] Badge "Ambiente de demonstracao" aparece so para a conta demo, nao para contas normais
- [ ] Botao "Reiniciar demo" repoe os dados sem precisar de reiniciar o deploy
- [ ] `npm run prisma:seed` local corrido para limpar artefactos de teste da conta de demonstracao
      usada nas tuas proprias sessoes de verificacao (grupos extra, etc. — ver README)
- [ ] `JWT_SECRET` em producao e um valor forte gerado de novo, nao o placeholder do `.env.example`
