import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import "dotenv/config";

const migrationPath = process.argv[2];
if (!migrationPath) {
	console.error("Uso: tsx scripts/apply-migration.ts <caminho-para-migration.sql>");
	process.exit(1);
}

const sql = readFileSync(migrationPath, "utf-8");
const checksum = createHash("sha256").update(sql).digest("hex");
const migrationName = path.basename(path.dirname(migrationPath));

async function main() {
	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();
	try {
		const existing = await client.query(
			"select 1 from _prisma_migrations where migration_name = $1",
			[migrationName],
		);
		if (existing.rowCount) {
			console.log(`Migration ${migrationName} ja esta registrada em _prisma_migrations. Nada a fazer.`);
			return;
		}

		await client.query(sql);
		await client.query(
			`insert into _prisma_migrations
				(id, checksum, finished_at, migration_name, applied_steps_count, started_at)
			 values ($1, $2, now(), $3, 1, now())`,
			[randomUUID(), checksum, migrationName],
		);
		console.log(`Migration ${migrationName} aplicada e registrada com sucesso.`);
	} finally {
		await client.end();
	}
}

main().catch((err) => {
	console.error("Falhou ao aplicar migration:", err);
	process.exit(1);
});
