import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "mounir.db");

// ensure folder exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON"); // enforce relations :contentReference[oaicite:1]{index=1}
