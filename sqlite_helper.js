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

/**
 * Configuration database
 * @type {Object}
 */
const config = {
  databaseName: "YOUR_DATABASE_NAME.db", // set your database name
  debug: true, // set false for production and set true for development
  paths: {
    documentsFolder: knownFolders.documents(),
    assetsFolder: "assets/db",
  },
};

/**
 * Get native database path using platform-specific APIs
 * @param {string} dbName
 * @returns {string} absolute native path
 */
function getNativeDatabasePath(dbName) {
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
 * @type {String|null}
 */
let dbPath = null;

/**
 * Variable sqlite instance
 * @type {any}
 */
let sqlite = null;

/**
 * Initialization lock to prevent concurrent opening attempts
 * @type {Promise<any>|null}
 */
let initPromise = null;

/**
 * Initialize database with singleton pattern and lock
 * @async
 * @function initializeDatabase
 * @returns {Promise<any>} sqlite instance
 */
async function initializeDatabase() {
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
          const destinationDir = path.dirname(dbPath);
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
 * @param {string} table             - table name
 * @param {string} fields            - fields name (default: "*")
 * @param {string} conditionalQuery  - conditional query (default: "")
 * @returns {Promise<any[]>}         - array of records
 */
export async function SQL__select(table, fields = "*", conditionalQuery = "") {
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
 * @param {string} query - SQL query
 * @returns {Promise<any[]>}
 */
export async function SQL__selectRaw(query) {
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
 * @param {string} table  - table name
 * @param {any|any[]} data   - object {field, value} array (legacy) or items (bulk)
 * @returns {Promise<void>}
 */
export async function SQL__insert(table, data = []) {
  await initializeDatabase();
  if (!sqlite || !data) return;

  try {
    // Current legacy format: [{field: 'name', value: 'val'}, ...]
    // If it's this format, we insert one row.
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0].field === "string"
    ) {
      const fields = data.map((item) => item.field).join(", ");
      const holders = data.map(() => "?").join(", ");
      const values = data.map((item) => item.value);
      const query = `INSERT INTO ${table} (${fields}) VALUES (${holders})`;
      await sqlite.execute(query, values);
    } else if (Array.isArray(data)) {
      // Potentially many rows of legacy format or objects
      // For now, let's stick to consistent legacy if possible or use transaction
      await SQL__transaction(async (db) => {
        for (const entry of data) {
          const fields = entry.map((item) => item.field).join(", ");
          const holders = entry.map(() => "?").join(", ");
          const values = entry.map((item) => item.value);
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
 * @param {string} table             - table name
 * @param {any[]} data               - array of {field, value}
 * @param {number|string} id         - primary key ID (optional if conditionalQuery provided)
 * @param {string} conditionalQuery  - optional WHERE clause
 * @returns {Promise<void>}
 */
export async function SQL__update(
  table,
  data = [],
  id = null,
  conditionalQuery = "",
) {
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
 * @param {string} table
 * @param {number|string} id
 * @param {string} conditionalQuery
 * @returns {Promise<void>}
 */
export async function SQL__delete(table, id = null, conditionalQuery = "") {
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
 * @param {string} table
 */
export async function SQL__truncate(table) {
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
 * @param {string} table
 * @param {boolean} ifExist
 */
export async function SQL__dropTable(table, ifExist = false) {
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
 * @param {string} query
 * @param {any[]} values
 * @returns {Promise<any>}
 */
export async function SQL__query(query, values = []) {
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
 * @param {function} callback - async function(db) returning operations
 * @returns {Promise<any>}
 */
export async function SQL__transaction(callback) {
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
 * @param {any[]} queries - array of [query, params] or string query
 */
export async function SQL__executeBatch(queries) {
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
export async function SQL__close() {
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
