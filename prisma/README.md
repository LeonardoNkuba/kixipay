# Prisma

Schema principal: prisma/schema.prisma

## Setup rapido
1. Copiar .env.example para .env
2. Configurar DATABASE_URL
3. Gerar cliente:
   npm run prisma:generate
4. Criar migracao inicial:
   npm run prisma:migrate -- --name init
5. Abrir Prisma Studio:
   npm run prisma:studio
