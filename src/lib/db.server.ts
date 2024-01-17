import pkg from 'pg';
const { Pool, Client } = pkg;

import { LargeObjectManager } from 'pg-large-object'

const pool = new Pool({
	user: 'postgres',
	database: 'pastr'
})

const client = await pool.connect()

await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto")

// 16 random bytes is the same as UUID
await client.query(`CREATE TABLE IF NOT EXISTS "datainfo" ("id" BYTEA PRIMARY KEY NOT NULL DEFAULT gen_random_bytes(16), "dataoid" OID NOT NULL, "filename" VARCHAR(256), "content_type" TEXT, "iv" BYTEA NOT NULL, "salt" BYTEA NOT NULL)`)

export default client

export const loManager = new LargeObjectManager({ pg: client });

