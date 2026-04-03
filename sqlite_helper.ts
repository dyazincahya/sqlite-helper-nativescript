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
 * @Version    : 3.1 (Optimized for Bulk & Transactions)
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
  paths: {
    documentsFolder: Folder;
    assetsFolder: string;
  };
}

export interface DataField {
  field: string;
  value: any;
}

/**
 * Configuration database
 */
const config: Config = {
  databaseName: "YOUR_DATABASE_NAME.db",
  debug: true,
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
    // Native path on Android (usually /data/data/<package>/databases/)
    const context =
      Application.android.context || Application.android.nativeApp;
    const dbFile = context.getDatabasePath(dbName);
    return dbFile.getAbsolutePath();
  } else if (global.ios) {
    // Standard documents folder for iOS
    return path.join(knownFolders.documents().path, dbName);
  }
  // Fallback for other environments
  return path.join(config.paths.documentsFolder.path, dbName);
}

/**
 * Path database (Resolved during initialization)
 */
let dbPath: string | null = null;

/**
 * Variable sqlite instance
 */
let sqlite: any = null;

/**
 * Initialization lock to prevent concurrent opening attempts
 */
let initPromise: Promise<any> | null = null;

/**
 * Initialize database with singleton pattern and lock
 * @async
 * @returns sqlite instance
 */
async function initializeDatabase(): Promise<any> {
  if (sqlite) return sqlite;

  // If initialization is already in progress, wait for it
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
      // Lazy resolve the native database path
      if (!dbPath) {
        dbPath = getNativeDatabasePath(config.databaseName);
      }

      const isFileDbExists = File.exists(dbPath);
      if (!isFileDbExists) {
        // Find seed database in assets
        const assetsPath = knownFolders
          .currentApp()
          .getFolder(config.paths.assetsFolder).path;
        const seedPath = path.join(assetsPath, config.databaseName);

        if (File.exists(seedPath)) {
          if (config.debug)
            console.log(`SQLite: Seeding database from assets to ${dbPath}...`);

          // Ensure destination folder exists (critical for Android /databases/ folder)
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

      // Open database using absolute native path
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
 * MAIN CRUD FUNCTIONS
 * --------------------------------
 */

/**
 * Perform a SELECT query
 * @param table             - table name
 * @param fields            - fields name (default: "*")
 * @param conditionalQuery  - conditional query (default: "")
 * @returns                 - array of records
 */
export async function SQL__select<T = any>(
  table: string,
  fields: string = "*",
  conditionalQuery: string = "",
): Promise<T[]> {
  await initializeDatabase();
  if (!sqlite) return [];

  const query = `SELECT ${fields} FROM ${table} ${conditionalQuery}`.trim();
  try {
    return await sqlite.select(query);
  } catch (error) {
    if (config.debug) console.error("SQL__select error >> ", error);
    return [];
  }
}

/**
 * Perform a raw SELECT query
 * @param query - SQL query
 * @returns     - array of records
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
 * Perform an INSERT (Multiple rows supported via Transactions for bulk)
 * @param table  - table name
 * @param data   - single row DataField[] or bulk Array<DataField[]>
 * @returns      - void
 */
export async function SQL__insert(
  table: string,
  data: DataField[] | DataField[][] = [],
): Promise<void> {
  await initializeDatabase();
  if (!sqlite || !data) return;

  try {
    // Current legacy format: [{field: 'name', value: 'val'}, ...]
    // If it's this format, we insert one row.
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof (data[0] as DataField).field === "string"
    ) {
      const row = data as DataField[];
      const fields = row.map((item) => item.field).join(", ");
      const holders = row.map(() => "?").join(", ");
      const values = row.map((item) => item.value);
      const query = `INSERT INTO ${table} (${fields}) VALUES (${holders})`;
      await sqlite.execute(query, values);
    } else if (Array.isArray(data)) {
      // Bulk insert (array of rows)
      const rows = data as DataField[][];
      await SQL__transaction(async (db) => {
        for (const row of rows) {
          const fields = row.map((item) => item.field).join(", ");
          const holders = row.map(() => "?").join(", ");
          const values = row.map((item) => item.value);
          await db.execute(
            `INSERT INTO ${table} (${fields}) VALUES (${holders})`,
            values,
          );
        }
      });
    }
  } catch (error) {
    if (config.debug) console.error("SQL__insert error >> ", error);
  }
}

/**
 * Perform an UPDATE
 * @param table             - table name
 * @param data              - array of {field, value}
 * @param id                - primary key ID
 * @param conditionalQuery  - optional WHERE clause
 * @returns                 - void
 */
export async function SQL__update(
  table: string,
  data: DataField[] = [],
  id: number | string | null = null,
  conditionalQuery: string = "",
): Promise<void> {
  await initializeDatabase();
  if (!sqlite || !data.length) return;

  const dataSet = data.map((item) => `${item.field} = ?`).join(", ");
  const values = data.map((item) => item.value);

  const where = id ? `WHERE id = ${id}` : conditionalQuery;
  const query = `UPDATE ${table} SET ${dataSet} ${where}`.trim();

  try {
    await sqlite.execute(query, values);
  } catch (error) {
    if (config.debug) console.error("SQL__update error >> ", error);
  }
}

/**
 * Delete records
 * @param table
 * @param id
 * @param conditionalQuery
 */
export async function SQL__delete(
  table: string,
  id: number | string | null = null,
  conditionalQuery: string = "",
): Promise<void> {
  await initializeDatabase();
  if (!sqlite) return;

  const where = id ? `WHERE id = ${id}` : conditionalQuery;
  const query = `DELETE FROM ${table} ${where}`.trim();

  try {
    await sqlite.execute(query);
  } catch (error) {
    if (config.debug) console.error("SQL__delete error >> ", error);
  }
}

/**
 * Truncate table and vacuum
 * @param table
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
 * @param table
 * @param ifExist
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
 * @param query
 * @param values
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
 * TRANSACTION: For heavy bulk operations
 * @param callback - async function with database context
 */
export async function SQL__transaction<T = any>(
  callback: (db: any) => Promise<T> | T,
): Promise<T | undefined> {
  await initializeDatabase();
  if (!sqlite) return;

  try {
    return await sqlite.transaction(callback);
  } catch (error) {
    if (config.debug) console.error("SQL__transaction error >> ", error);
    throw error;
  }
}

/**
 * Execute Batch: Fast execution of multiple queries
 * @param queries - array of [query, params] or string query
 */
export async function SQL__executeBatch(
  queries: Array<string | [string, any[]]>,
): Promise<any> {
  await initializeDatabase();
  if (!sqlite) return;

  try {
    // Check plugin support for executeBatch or fallback to transaction
    if (typeof sqlite.executeBatch === "function") {
      return await sqlite.executeBatch(queries);
    } else {
      return await SQL__transaction(async (db) => {
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
    if (config.debug) console.error("SQL__executeBatch error >> ", error);
  }
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
