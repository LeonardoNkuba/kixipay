# Prisma

Schema principal: prisma/schema.prisma

## Setup rapido
1. Copiar .env.example para .env
2. Configurar DATABASE_URL
3. Gerar cliente:
   npm run prisma:generate
4. Criar migracao inicial:
   npm run prisma:migrate -- --name init
   O Supavisor (pooler do Supabase) nao suporta bem os prepared statements que o `prisma migrate`/`db execute`
   reaproveitam entre passos, mesmo na porta 5432 (session mode) — nao ha conexao direta real (db.<ref>.supabase.co)
   disponivel sem IPv6. Se `prisma migrate`/`db execute` travar ou falhar, escreva o SQL manualmente em
   prisma/migrations/<timestamp>_<nome>/migration.sql e aplique com:
   npx tsx scripts/apply-migration.ts prisma/migrations/<timestamp>_<nome>/migration.sql
   Esse script usa a lib `pg` diretamente (o mesmo caminho que a API ja usa via @prisma/adapter-pg), contornando
   o schema engine do Prisma. Depois, registre a migracao como aplicada inserindo uma linha em
   `_prisma_migrations` (id, checksum sha256 do arquivo, migration_name, applied_steps_count=1, started_at/finished_at=now()).
5. Abrir Prisma Studio:
   npm run prisma:studio
6. Popular dados demo para pitch:
   npm run prisma:seed
