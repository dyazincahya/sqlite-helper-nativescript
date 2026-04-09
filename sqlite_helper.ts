import {
  knownFolders,
  path,
  File,
  Folder,
  Application,
} from "@nativescript/core";
import { openOrCreate } from "@nativescript-community/sqlite";

/*
 * @Name       : SQLite Helper {N}
 * @Version    : 4.0 (Soft-Delete & Bulk Support)
 * @Repo       : https://github.com/dyazincahya/sqlite-helper-nativescript
 * @Author     : Kang Cahya (github.com/dyazincahya)
 * @Blog       : https://www.kang-cahya.com
 * ===============================================================================================================
 * @References : https://github.com/nativescript-community/sqlite
 * ===============================================================================================================
 */

export interface Config {
  databaseName: string;
  debug: boolean;
  softDelete: boolean;
  paths: {
    documentsFolder: Folder;
    assetsFolder: string;
  };
}

export interface DataField {
  field: string;
  value: any;
}

export interface BatchCommand {
  type: "insert" | "update" | "delete" | "hardDelete" | "restore" | "query";
  table?: string;
  data?: DataField[] | DataField[][];
  id?: number | string | Array<number | string>;
  condition?: string;
  query?: string;
  values?: any[];
}

export interface TransactionHelper {
  select: <T = any>(table: string, fields?: string, conditionalQuery?: string) => Promise<T[]>;
  insert: (table: string, data: DataField[] | DataField[][]) => Promise<void>;
  update: (table: string, data: DataField[], id?: number | string | Array<number | string> | null, conditionalQuery?: string) => Promise<void>;
  delete: (table: string, id?: number | string | Array<number | string> | null, conditionalQuery?: string) => Promise<void>;
  hardDelete: (table: string, id?: number | string | Array<number | string> | null, conditionalQuery?: string) => Promise<void>;
  restore: (table: string, id?: number | string | Array<number | string> | null, conditionalQuery?: string) => Promise<void>;
  query: (query: string, values?: any[]) => Promise<any>;
}

/**
 * Configuration database
 */
const config: Config = {
  databaseName: "YOUR_DATABASE_NAME.db",
  debug: true,
  softDelete: true,
  paths: {
    documentsFolder: knownFolders.documents(),
    assetsFolder: "assets/db",
  },
};

/**
 * Get native database path using platform-specific APIs
 * @param dbName
 * @returns absolute native path
 */
function getNativeDatabasePath(dbName: string): string {
  if (global.android) {
    const context =
      Application.android.context || Application.android.nativeApp;
    const dbFile = context.getDatabasePath(dbName);
    return dbFile.getAbsolutePath();
  } else if (global.ios) {
    return path.join(knownFolders.documents().path, dbName);
  }
  return path.join(config.paths.documentsFolder.path, dbName);
}

let dbPath: string | null = null;
let sqlite: any = null;
let initPromise: Promise<any> | null = null;

async function initializeDatabase(): Promise<any> {
  if (sqlite) return sqlite;
  if (initPromise) return initPromise;

  initInitPromise();
  return initPromise;
}

function initInitPromise() {
  initPromise = (async () => {
    if (
      !config.databaseName ||
      config.databaseName === "YOUR_DATABASE_NAME.db"
    ) {
      console.warn("SQLite: Database name is not defined or empty.");
      return null;
    }

    try {
      if (!dbPath) {
        dbPath = getNativeDatabasePath(config.databaseName);
      }

      const isFileDbExists = File.exists(dbPath);
      if (!isFileDbExists) {
        const assetsPath = knownFolders
          .currentApp()
          .getFolder(config.paths.assetsFolder).path;
        const seedPath = path.join(assetsPath, config.databaseName);

        if (File.exists(seedPath)) {
          if (config.debug)
            console.log(`SQLite: Seeding database from assets to ${dbPath}...`);

          const destinationDir = path.join(dbPath, "..");
          if (!Folder.exists(destinationDir)) {
            Folder.fromPath(destinationDir);
          }

          const seedFile = File.fromPath(seedPath);
          await seedFile.copy(dbPath);

          if (config.debug) console.log("SQLite: Seed copy successful.");
        } else {
          if (config.debug)
            console.log(
              "SQLite: No seed database found in assets. Starting with empty DB.",
            );
        }
      } else {
        if (config.debug)
          console.log("SQLite: Existing database found, skipping seed.");
      }

      sqlite = openOrCreate(dbPath);
      if (config.debug)
        console.log("SQLite: Database opened at native location:", dbPath);

      return sqlite;
    } catch (error) {
      console.error("SQLite: Initialization error >> ", error);
      throw error;
    } finally {
      initPromise = null;
    }
  })();
}

/*
 * HELPERS
 * --------------------------------
 */

/**
 * Format WHERE clause to support single ID or multiple IDs (Array)
 */
function formatWhere(id: number | string | Array<number | string> | null, conditionalQuery: string): string {
  if (id) {
    if (Array.isArray(id)) {
      const formattedIds = id.map((v) => (typeof v === "string" ? `'${v}'` : v)).join(", ");
      return `WHERE id IN (${formattedIds})`;
    } else {
      return `WHERE id = ${typeof id === "string" ? `'${id}'` : id}`;
    }
  }
  return conditionalQuery;
}

/*
 * MAIN CRUD FUNCTIONS
 * --------------------------------
 */

/**
 * Perform a SELECT query
 */
export async function SQL__select<T = any>(
  table: string,
  fields: string = "*",
  conditionalQuery: string = "",
): Promise<T[]> {
  await initializeDatabase();
  if (!sqlite) return [];

  let query = "";
  if (config.softDelete) {
    const softDeleteCondition = "is_deleted = 0";
    const trimmedConditional = conditionalQuery.trim();
    if (!trimmedConditional) {
      query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition}`;
    } else if (trimmedConditional.toUpperCase().startsWith("WHERE")) {
      const wherePart = trimmedConditional.substring(5).trim();
      query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition} AND (${wherePart})`;
    } else if (
      trimmedConditional.toUpperCase().startsWith("ORDER BY") ||
      trimmedConditional.toUpperCase().startsWith("LIMIT") ||
      trimmedConditional.toUpperCase().startsWith("GROUP BY")
    ) {
      query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition} ${trimmedConditional}`;
    } else {
      query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition} AND (${trimmedConditional})`;
    }
  } else {
    query = `SELECT ${fields} FROM ${table} ${conditionalQuery}`.trim();
  }

  try {
    return await sqlite.select(query);
  } catch (error) {
    if (config.debug) console.error("SQL__select error >> ", error);
    return [];
  }
}

/**
 * Perform a raw SELECT query
 */
export async function SQL__selectRaw<T = any>(query: string): Promise<T[]> {
  if (!query) return [];
  await initializeDatabase();
  if (!sqlite) return [];

  try {
    return await sqlite.select(query);
  } catch (error) {
    if (config.debug) console.error("SQL__selectRaw error >> ", error);
    return [];
  }
}

/**
 * Perform an INSERT
 */
export async function SQL__insert(
  table: string,
  data: DataField[] | DataField[][] = [],
): Promise<void> {
  await initializeDatabase();
  if (!sqlite || !data) return;

  try {
    const finalData = Array.isArray(data[0]) ? (data as DataField[][]) : [data as DataField[]];
    
    if (finalData.length === 1 && !Array.isArray(data[0])) {
      // Single row insert
      const row = [...finalData[0]];
      if (config.softDelete && !row.some(item => item.field === 'is_deleted')) {
        row.push({ field: 'is_deleted', value: 0 });
      }
      const fields = row.map((item) => item.field).join(", ");
      const holders = row.map(() => "?").join(", ");
      const values = row.map((item) => item.value);
      await sqlite.execute(`INSERT INTO ${table} (${fields}) VALUES (${holders})`, values);
    } else {
      // Bulk insert (array of rows)
      await SQL__transactionNative(async (db) => {
        for (const entry of finalData) {
          const row = [...entry];
          if (config.softDelete && !row.some(item => item.field === 'is_deleted')) {
            row.push({ field: 'is_deleted', value: 0 });
          }
          const fields = row.map((item) => item.field).join(", ");
          const holders = row.map(() => "?").join(", ");
          const values = row.map((item) => item.value);
          await db.execute(`INSERT INTO ${table} (${fields}) VALUES (${holders})`, values);
        }
      });
    }
  } catch (error) {
    if (config.debug) console.error("SQL__insert error >> ", error);
  }
}

/**
 * Perform an UPDATE
 */
export async function SQL__update(
  table: string,
  data: DataField[] = [],
  id: number | string | Array<number | string> | null = null,
  conditionalQuery: string = "",
): Promise<void> {
  await initializeDatabase();
  if (!sqlite || !data.length) return;

  const finalData = [...data];
  if (config.softDelete) {
    const idx = finalData.findIndex((item) => item.field === "is_deleted");
    if (idx === -1) {
      finalData.push({ field: "is_deleted", value: 0 });
    } else {
      finalData[idx].value = 0;
    }
  }

  const dataSet = finalData.map((item) => `${item.field} = ?`).join(", ");
  const values = finalData.map((item) => item.value);
  const where = formatWhere(id, conditionalQuery);
  const query = `UPDATE ${table} SET ${dataSet} ${where}`.trim();

  try {
    await sqlite.execute(query, values);
  } catch (error) {
    if (config.debug) console.error("SQL__update error >> ", error);
  }
}

/**
 * Delete records
 */
export async function SQL__delete(
  table: string,
  id: number | string | Array<number | string> | null = null,
  conditionalQuery: string = "",
): Promise<void> {
  if (config.softDelete) {
    return await SQL__update(table, [{ field: "is_deleted", value: 1 }], id, conditionalQuery);
  }

  await initializeDatabase();
  if (!sqlite) return;

  const where = formatWhere(id, conditionalQuery);
  const query = `DELETE FROM ${table} ${where}`.trim();

  try {
    await sqlite.execute(query);
  } catch (error) {
    if (config.debug) console.error("SQL__delete error >> ", error);
  }
}

/**
 * Perform a physical deletion (Hard Delete)
 */
export async function SQL__hardDelete(
  table: string,
  id: number | string | Array<number | string> | null = null,
  conditionalQuery: string = "",
): Promise<void> {
  await initializeDatabase();
  if (!sqlite) return;

  const where = formatWhere(id, conditionalQuery);
  const query = `DELETE FROM ${table} ${where}`.trim();

  try {
    await sqlite.execute(query);
  } catch (error) {
    if (config.debug) console.error("SQL__hardDelete error >> ", error);
  }
}

/**
 * Restore a soft-deleted record
 */
export async function SQL__restore(
  table: string,
  id: number | string | Array<number | string> | null = null,
  conditionalQuery: string = "",
): Promise<void> {
  return await SQL__update(table, [{ field: "is_deleted", value: 0 }], id, conditionalQuery);
}

/**
 * Truncate table and vacuum
 */
export async function SQL__truncate(table: string): Promise<void> {
  await initializeDatabase();
  if (!sqlite) return;

  try {
    await sqlite.execute(`DELETE FROM ${table}`);
    await sqlite.execute("VACUUM");
  } catch (error) {
    if (config.debug) console.error("SQL__truncate error >> ", error);
  }
}

/**
 * Drop Table
 */
export async function SQL__dropTable(
  table: string,
  ifExist: boolean = false,
): Promise<void> {
  await initializeDatabase();
  if (!sqlite) return;

  const query = ifExist
    ? `DROP TABLE IF EXISTS ${table}`
    : `DROP TABLE ${table}`;
  try {
    await sqlite.execute(query);
  } catch (error) {
    if (config.debug) console.error("SQL__dropTable error >> ", error);
  }
}

/**
 * Execute custom query
 */
export async function SQL__query(
  query: string,
  values: any[] = [],
): Promise<any> {
  await initializeDatabase();
  if (!sqlite) return;

  try {
    return await sqlite.execute(query, values);
  } catch (error) {
    if (config.debug) console.error("SQL__query error >> ", error);
  }
}

/**
 * TRANSACTION NATIVE: Raw SQL transaction
 */
export async function SQL__transactionNative<T = any>(
  callback: (db: any) => Promise<T> | T,
): Promise<T | undefined> {
  await initializeDatabase();
  if (!sqlite) return;

  try {
    return await sqlite.transaction(callback);
  } catch (error) {
    if (config.debug) console.error("SQL__transactionNative error >> ", error);
    throw error;
  }
}

/**
 * TRANSACTION Helper: Soft-Delete aware transaction
 */
export async function SQL__transaction<T = any>(
  callback: (helper: TransactionHelper) => Promise<T> | T,
): Promise<T | undefined> {
  return await SQL__transactionNative(async (db) => {
    const helper: TransactionHelper = {
      select: async (table, fields = "*", conditionalQuery = "") => {
        let query = "";
        if (config.softDelete) {
          const softDeleteCondition = "is_deleted = 0";
          const trimmedConditional = conditionalQuery.trim();
          if (!trimmedConditional) {
            query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition}`;
          } else if (trimmedConditional.toUpperCase().startsWith("WHERE")) {
            const wherePart = trimmedConditional.substring(5).trim();
            query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition} AND (${wherePart})`;
          } else if (
            trimmedConditional.toUpperCase().startsWith("ORDER BY") ||
            trimmedConditional.toUpperCase().startsWith("LIMIT") ||
            trimmedConditional.toUpperCase().startsWith("GROUP BY")
          ) {
            query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition} ${trimmedConditional}`;
          } else {
            query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition} AND (${trimmedConditional})`;
          }
        } else {
          query = `SELECT ${fields} FROM ${table} ${conditionalQuery}`.trim();
        }
        return await db.select(query);
      },
      insert: async (table, data) => {
        const finalData = Array.isArray(data[0]) ? (data as DataField[][]) : [data as DataField[]];
        for (const entry of finalData) {
          const row = [...entry];
          if (config.softDelete && !row.some(item => item.field === 'is_deleted')) {
            row.push({ field: 'is_deleted', value: 0 });
          }
          const fields = row.map((item) => item.field).join(", ");
          const holders = row.map(() => "?").join(", ");
          const values = row.map((item) => item.value);
          await db.execute(`INSERT INTO ${table} (${fields}) VALUES (${holders})`, values);
        }
      },
      update: async (table, data, id = null, conditionalQuery = "") => {
        const rowData = [...data];
        if (config.softDelete) {
          const idx = rowData.findIndex((item) => item.field === "is_deleted");
          if (idx === -1) {
            rowData.push({ field: "is_deleted", value: 0 });
          } else {
            rowData[idx].value = 0;
          }
        }
        const dataSet = rowData.map((item) => `${item.field} = ?`).join(", ");
        const values = rowData.map((item) => item.value);
        const where = formatWhere(id, conditionalQuery);
        await db.execute(`UPDATE ${table} SET ${dataSet} ${where}`, values);
      },
      delete: async (table, id = null, conditionalQuery = "") => {
        if (config.softDelete) {
          return await helper.update(table, [{ field: "is_deleted", value: 1 }], id, conditionalQuery);
        }
        const where = formatWhere(id, conditionalQuery);
        await db.execute(`DELETE FROM ${table} ${where}`);
      },
      hardDelete: async (table, id = null, conditionalQuery = "") => {
        const where = formatWhere(id, conditionalQuery);
        await db.execute(`DELETE FROM ${table} ${where}`);
      },
      restore: async (table, id = null, conditionalQuery = "") => {
        return await helper.update(table, [{ field: "is_deleted", value: 0 }], id, conditionalQuery);
      },
      query: async (query, values = []) => {
        return await db.execute(query, values);
      }
    };
    return await callback(helper);
  });
}

/**
 * Execute Batch Native: Raw execution of multiple queries
 */
export async function SQL__executeBatchNative(
  queries: Array<string | [string, any[]]>,
): Promise<any> {
  await initializeDatabase();
  if (!sqlite) return;

  try {
    if (typeof sqlite.executeBatch === "function") {
      return await sqlite.executeBatch(queries);
    } else {
      return await SQL__transactionNative(async (db) => {
        for (const q of queries) {
          if (Array.isArray(q)) {
            await db.execute(q[0], q[1] || []);
          } else {
            await db.execute(q);
          }
        }
      });
    }
  } catch (error) {
    if (config.debug) console.error("SQL__executeBatchNative error >> ", error);
  }
}

/**
 * Execute Batch Helper: Object-based commands with soft-delete support
 */
export async function SQL__executeBatch(commands: BatchCommand[] = []): Promise<void> {
  return await SQL__transaction(async (helper) => {
    for (const cmd of commands) {
      switch (cmd.type.toLowerCase()) {
        case "insert":
          if (cmd.table && cmd.data) await helper.insert(cmd.table, cmd.data);
          break;
        case "update":
          if (cmd.table && cmd.data) {
            await helper.update(
              cmd.table,
              cmd.data as DataField[],
              cmd.id,
              cmd.condition,
            );
          }
          break;
        case "delete":
          if (cmd.table) await helper.delete(cmd.table, cmd.id, cmd.condition);
          break;
        case "harddelete":
          if (cmd.table) await helper.hardDelete(cmd.table, cmd.id, cmd.condition);
          break;
        case "restore":
          if (cmd.table) await helper.restore(cmd.table, cmd.id, cmd.condition);
          break;
        case "query":
          if (cmd.query) await helper.query(cmd.query, cmd.values);
          break;
      }
    }
  });
}

/**
 * Close database connection
 */
export async function SQL__close(): Promise<void> {
  if (sqlite) {
    try {
      sqlite.close();
      sqlite = null;
      if (config.debug) console.log("SQLite: Database closed.");
    } catch (error) {
      console.error("SQLite: Close error >> ", error);
    }
  }
}
