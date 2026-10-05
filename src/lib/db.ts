import mysql from "mysql2/promise";
import type { Connection, Pool, PoolConnection, PoolOptions, ResultSetHeader } from "mysql2/promise";

export const dbConfig: PoolOptions = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "campus",
  database: process.env.DB_NAME ?? "campus_events_db",
  // Keep DATE/DATETIME as plain strings and DECIMAL as numbers.
  dateStrings: true,
  decimalNumbers: true,
  connectionLimit: 10,
};

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { campusPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.campusPool) globalForDb.campusPool = mysql.createPool(dbConfig);
  return globalForDb.campusPool;
}

export type Row = Record<string, unknown>;
export type Param = string | number | boolean | null;

/** Runs a SELECT and returns plain objects (safe to pass to client components). */
export async function query<T = Row>(sql: string, params: Param[] = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, params);
  return (rows as unknown as Row[]).map((r) => ({ ...r })) as T[];
}

export async function queryOne<T = Row>(sql: string, params: Param[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Runs INSERT / UPDATE / DELETE and returns the result header. */
export async function execute(sql: string, params: Param[] = []): Promise<ResultSetHeader> {
  const [result] = await getPool().query<ResultSetHeader>(sql, params);
  return result;
}

/** Runs a CALL and returns the first result set. */
export async function callProcedure<T = Row>(sql: string, params: Param[] = []): Promise<T[]> {
  const [result] = await getPool().query(sql, params);
  const sets = result as unknown as Row[][];
  return (sets[0] ?? []).map((r) => ({ ...r })) as T[];
}

export async function withConnection<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

/** A one-off connection that accepts several statements in one query. */
export async function openMultiStatementConnection(useDatabase = true): Promise<Connection> {
  // connectionLimit is a pool-only option, so leave it out of a single connection.
  const { database, connectionLimit: _unused, ...rest } = dbConfig;
  return mysql.createConnection({
    ...rest,
    ...(useDatabase ? { database } : {}),
    multipleStatements: true,
  });
}

/** Turns a MySQL error into a sentence a user can act on. */
export function dbErrorMessage(error: unknown): string {
  const err = error as { errno?: number; code?: string; sqlState?: string; sqlMessage?: string; message?: string };
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT") {
    return "Cannot reach the MySQL server. Check that the database is running.";
  }
  if (err.sqlState === "45000" && err.sqlMessage) return err.sqlMessage; // SIGNAL from a trigger
  switch (err.errno) {
    case 1062:
      return `Duplicate value: ${err.sqlMessage ?? "a unique key would be repeated"}.`;
    case 1451:
      return "This record is still used by other records (foreign key ON DELETE RESTRICT), so it can't be deleted.";
    case 1452:
      return "The referenced record does not exist (foreign key check failed).";
    case 3819:
      return `Rejected by a CHECK constraint: ${err.sqlMessage ?? ""}`.trim();
    case 1265:
    case 1366:
      return `Invalid value: ${err.sqlMessage ?? ""}`.trim();
  }
  return err.sqlMessage ?? err.message ?? "Unknown database error.";
}
