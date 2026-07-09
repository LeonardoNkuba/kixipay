import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

const envCandidates = [
	path.resolve(process.cwd(), ".env"),
	path.resolve(process.cwd(), "../../.env"),
	path.resolve(process.cwd(), "apps/api/.env"),
	path.resolve(process.cwd(), "../.env"),
];

for (const envPath of envCandidates) {
	if (existsSync(envPath)) {
		dotenv.config({ path: envPath });
		break;
	}
}

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL ou DIRECT_URL nao configurada para a API.");
}

const pool = new Pool({
	connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
	adapter,
});
