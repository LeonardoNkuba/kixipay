import { readFileSync } from "node:fs";
import { Client } from "pg";
import "dotenv/config";

const migrationPath = process.argv[2];
if (!migrationPath) {
	console.error("Uso: tsx scripts/apply-migration.ts <caminho-para-migration.sql>");
	process.exit(1);
}

const sql = readFileSync(migrationPath, "utf-8");

async function main() {
	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();
	try {
		await client.query(sql);
		console.log("Migration aplicada com sucesso.");
	} finally {
		await client.end();
	}
}

main().catch((err) => {
	console.error("Falhou ao aplicar migration:", err);
	process.exit(1);
});
