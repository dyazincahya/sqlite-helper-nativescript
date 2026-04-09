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

/**
 * Configuration database
 * @type {Object}
 */
const config = {
  databaseName: "xlabs_bukukasbon.db", // set your database name
  debug: true, // set false for production and set true for development
  paths: {
    documentsFolder: knownFolders.documents(),
    assetsFolder: "assets/db",
  },
  softDelete: true,
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

  let query = "";
  if (config.softDelete) {
    const softDeleteCondition = "is_deleted = 0";
    const trimmedConditional = conditionalQuery.trim();

    if (!trimmedConditional) {
      query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition}`;
    } else if (trimmedConditional.toUpperCase().startsWith("WHERE")) {
      // Insert right after WHERE
      const wherePart = trimmedConditional.substring(5).trim();
      query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition} AND (${wherePart})`;
    } else if (
      trimmedConditional.toUpperCase().startsWith("ORDER BY") ||
      trimmedConditional.toUpperCase().startsWith("LIMIT") ||
      trimmedConditional.toUpperCase().startsWith("GROUP BY")
    ) {
      query = `SELECT ${fields} FROM ${table} WHERE ${softDeleteCondition} ${trimmedConditional}`;
    } else {
      // Assume it's a raw condition without WHERE keyword (unlikely but safe to handle)
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
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0].field === "string"
    ) {
      const finalData = [...data];
      if (config.softDelete) {
        // Enforce is_deleted = 0 on insert
        if (!finalData.some((item) => item.field === "is_deleted")) {
          finalData.push({ field: "is_deleted", value: 0 });
        }
      }

      const fields = finalData.map((item) => item.field).join(", ");
      const holders = finalData.map(() => "?").join(", ");
      const values = finalData.map((item) => item.value);
      const query = `INSERT INTO ${table} (${fields}) VALUES (${holders})`;
      await sqlite.execute(query, values);
    } else if (Array.isArray(data)) {
      await SQL__transaction(async (db) => {
        for (const entry of data) {
          const finalEntry = [...entry];
          if (config.softDelete) {
            if (!finalEntry.some((item) => item.field === "is_deleted")) {
              finalEntry.push({ field: "is_deleted", value: 0 });
            }
          }

          const fields = finalEntry.map((item) => item.field).join(", ");
          const holders = finalEntry.map(() => "?").join(", ");
          const values = finalEntry.map((item) => item.value);
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

  const finalData = [...data];
  if (config.softDelete) {
    // Ensure is_deleted is reset to 0 on update as requested
    if (!finalData.some((item) => item.field === "is_deleted")) {
      finalData.push({ field: "is_deleted", value: 0 });
    } else {
      // If it exists, force it to 0
      const idx = finalData.findIndex((item) => item.field === "is_deleted");
      finalData[idx].value = 0;
    }
  }

  const dataSet = finalData.map((item) => `${item.field} = ?`).join(", ");
  const values = finalData.map((item) => item.value);

  let where = "";
  if (id) {
    if (Array.isArray(id)) {
      const formattedIds = id
        .map((v) => (typeof v === "string" ? `'${v}'` : v))
        .join(", ");
      where = `WHERE id IN (${formattedIds})`;
    } else {
      where = `WHERE id = ${typeof id === "string" ? `'${id}'` : id}`;
    }
  } else {
    where = conditionalQuery;
  }

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
  if (config.softDelete) {
    // Perform soft delete (update is_deleted = 1)
    return await SQL__update(
      table,
      [{ field: "is_deleted", value: 1 }],
      id,
      conditionalQuery,
    );
  }

  await initializeDatabase();
  if (!sqlite) return;

  let where = "";
  if (id) {
    if (Array.isArray(id)) {
      const formattedIds = id
        .map((v) => (typeof v === "string" ? `'${v}'` : v))
        .join(", ");
      where = `WHERE id IN (${formattedIds})`;
    } else {
      where = `WHERE id = ${typeof id === "string" ? `'${id}'` : id}`;
    }
  } else {
    where = conditionalQuery;
  }

  const query = `DELETE FROM ${table} ${where}`.trim();

  try {
    await sqlite.execute(query);
  } catch (error) {
    if (config.debug) console.error("SQL__delete error >> ", error);
  }
}

/**
 * Perform a physical deletion (Hard Delete)
 * @param {string} table
 * @param {number|string} id
 * @param {string} conditionalQuery
 */
export async function SQL__hardDelete(table, id = null, conditionalQuery = "") {
  await initializeDatabase();
  if (!sqlite) return;

  let where = "";
  if (id) {
    if (Array.isArray(id)) {
      const formattedIds = id
        .map((v) => (typeof v === "string" ? `'${v}'` : v))
        .join(", ");
      where = `WHERE id IN (${formattedIds})`;
    } else {
      where = `WHERE id = ${typeof id === "string" ? `'${id}'` : id}`;
    }
  } else {
    where = conditionalQuery;
  }

  const query = `DELETE FROM ${table} ${where}`.trim();

  try {
    await sqlite.execute(query);
  } catch (error) {
    if (config.debug) console.error("SQL__hardDelete error >> ", error);
  }
}

/**
 * Restore a soft-deleted record
 * @param {string} table
 * @param {number|string} id
 * @param {string} conditionalQuery
 */
export async function SQL__restore(table, id = null, conditionalQuery = "") {
  return await SQL__update(table, [{ field: "is_deleted", value: 0 }], id, conditionalQuery);
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
export async function SQL__transactionNative(callback) {
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
 * High-level Transaction (Soft-Delete Aware)
 * @param {function} callback - async function(helper)
 */
export async function SQL__transaction(callback) {
  return await SQL__transactionNative(async (db) => {
    const helper = {
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
      insert: async (table, data = []) => {
        const finalData = Array.isArray(data[0]) ? data : [data];
        for (const entry of finalData) {
          const rowData = [...entry];
          if (config.softDelete && !rowData.some((item) => item.field === "is_deleted")) {
            rowData.push({ field: "is_deleted", value: 0 });
          }
          const fields = rowData.map((item) => item.field).join(", ");
          const holders = rowData.map(() => "?").join(", ");
          const values = rowData.map((item) => item.value);
          await db.execute(`INSERT INTO ${table} (${fields}) VALUES (${holders})`, values);
        }
      },
      update: async (table, data = [], id = null, conditionalQuery = "") => {
        const rowData = [...data];
        if (config.softDelete) {
          if (!rowData.some((item) => item.field === "is_deleted")) {
            rowData.push({ field: "is_deleted", value: 0 });
          } else {
            const idx = rowData.findIndex((item) => item.field === "is_deleted");
            rowData[idx].value = 0;
          }
        }
        const dataSet = rowData.map((item) => `${item.field} = ?`).join(", ");
        const values = rowData.map((item) => item.value);
        let where = "";
        if (id) {
          if (Array.isArray(id)) {
            const formattedIds = id.map((v) => (typeof v === "string" ? `'${v}'` : v)).join(", ");
            where = `WHERE id IN (${formattedIds})`;
          } else {
            where = `WHERE id = ${typeof id === "string" ? `'${id}'` : id}`;
          }
        } else {
          where = conditionalQuery;
        }
        await db.execute(`UPDATE ${table} SET ${dataSet} ${where}`, values);
      },
      delete: async (table, id = null, conditionalQuery = "") => {
        if (config.softDelete) {
          return await helper.update(table, [{ field: "is_deleted", value: 1 }], id, conditionalQuery);
        }
        let where = "";
        if (id) {
          if (Array.isArray(id)) {
            const formattedIds = id.map((v) => (typeof v === "string" ? `'${v}'` : v)).join(", ");
            where = `WHERE id IN (${formattedIds})`;
          } else {
            where = `WHERE id = ${typeof id === "string" ? `'${id}'` : id}`;
          }
        } else {
          where = conditionalQuery;
        }
        await db.execute(`DELETE FROM ${table} ${where}`);
      },
      hardDelete: async (table, id = null, conditionalQuery = "") => {
        let where = "";
        if (id) {
          if (Array.isArray(id)) {
            const formattedIds = id.map((v) => (typeof v === "string" ? `'${v}'` : v)).join(", ");
            where = `WHERE id IN (${formattedIds})`;
          } else {
            where = `WHERE id = ${typeof id === "string" ? `'${id}'` : id}`;
          }
        } else {
          where = conditionalQuery;
        }
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
 * Execute Batch Native: Fast execution of multiple queries
 * @param {any[]} queries - array of [query, params] or string query
 */
export async function SQL__executeBatchNative(queries) {
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
 * High-level Execute Batch (Soft-Delete Aware)
 * @param {any[]} commands - array of objects {type, table, data, id, condition}
 */
export async function SQL__executeBatch(commands = []) {
  return await SQL__transaction(async (helper) => {
    for (const cmd of commands) {
      switch (cmd.type.toLowerCase()) {
        case "insert":
          await helper.insert(cmd.table, cmd.data);
          break;
        case "update":
          await helper.update(cmd.table, cmd.data, cmd.id, cmd.condition);
          break;
        case "delete":
          await helper.delete(cmd.table, cmd.id, cmd.condition);
          break;
        case "hardDelete":
          await helper.hardDelete(cmd.table, cmd.id, cmd.condition);
          break;
        case "restore":
          await helper.restore(cmd.table, cmd.id, cmd.condition);
          break;
        case "query":
          await helper.query(cmd.query, cmd.values);
          break;
      }
    }
  });
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
