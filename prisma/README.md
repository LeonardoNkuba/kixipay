# Prisma

Schema principal: prisma/schema.prisma

## Setup rapido
1. Copiar .env.example para .env
2. Configurar DATABASE_URL
3. Gerar cliente:
   npm run prisma:generate
4. Criar migracao inicial:
   npm run prisma:migrate -- --name init
   Se o banco estiver offline, use o SQL em prisma/migrations/20260709120000_init_final_schema/migration.sql.
5. Abrir Prisma Studio:
   npm run prisma:studio
6. Popular dados demo para pitch:
   npm run prisma:seed
