import { knownFolders, path, File } from "@nativescript/core";
import { openOrCreate } from "@nativescript-community/sqlite";

/*
* @Name       : SQLite Helper {N}
* @Version    : 2.0
* @Repo       : https://github.com/dyazincahya/sqlite-helper-nativescript
* @Author     : Kang Cahya (github.com/dyazincahya)
* @Blog       : https://www.kang-cahya.com
* ===============================================================================================================
* @References : https://github.com/nativescript-community/sqlite
*               https://www.tutorialspoint.com/sqlite/index.htm
* ===============================================================================================================
*/


interface Config {
  databaseName: string;
  debug: boolean;
  paths: {
    documentsFolder: any;
    assetsFolder: string;
  };
}

interface DataField {
  field: string;
  value: any;
}


/**
 * Configuration database
 * @type {Object}
 */
const config: Config = {
  databaseName: "YOUR_DATABASE_NAME.db",
  debug: true,
  paths: {
    documentsFolder: knownFolders.documents(), // Do not change this value. It is used to get the root documents directory.
    assetsFolder: "assets/db", // Location of your SQLite database file. If you place an existing database here, this helper will automatically copy it to the system directory, so you don't need to manually create the database.
  },
};

/**
 * Path database
 * @type {String}
 */
const dbPath: string = path.join(
  config.paths.documentsFolder.path,
  config.databaseName
);

/**
 * Variable sqlite
 * @type {Object}
 */
let sqlite: any = null;

/**
 * Initialize database
 * @async
 * @function initializeDatabase
 * @returns {Promise<Object>} sqlite
 */
async function initializeDatabase(): Promise<any> {
  if (sqlite) {
    return sqlite;
  }

  if (!config.databaseName || config.databaseName === "YOUR_DATABASE_NAME.db") {
    console.log("Database name is not defined or empty.");
    return null;
  }

  try {
    const isFileDbExists = File.exists(dbPath);
    if (!isFileDbExists) {
      const assetsPath = knownFolders
        .currentApp()
        .getFolder(config.paths.assetsFolder).path;
      const pathDbAssets = path.join(assetsPath, config.databaseName);
      const fileDb = File.fromPath(pathDbAssets);

      if (config.debug) {
        console.log("Database not found. Copying from assets...");
        console.log("Assets path:", pathDbAssets);
        console.log("Database path:", dbPath);
        console.log("File exists:", fileDb.exists);
        console.log("File path:", fileDb.path);
        console.log("File size:", fileDb.size);
        console.log("File extension:", fileDb.extension);
      }

      await fileDb.copy(dbPath);

      if (config.debug) {
        console.log("Database copied to:", dbPath);
      }
    }

    sqlite = await openOrCreate(dbPath);
    if (config.debug) {
      console.log("Database opened at:", dbPath);
    }
    return sqlite;
  } catch (error) {
    if (config.debug) {
      console.error("Error initializing database:", error);
    }
  }
}

/* 
  * MAIN FUNCTION of SQLITE-HELPER 
  * --------------------------------
  * - SQL__select
  * - SQL__selectRaw
  * - SQL__insert
  * - SQL__update
  * - SQL__delete
  * - SQL__truncate
  * - SQL__dropTable
  * - SQL__query
  * --------------------------------
  * Example:
    SQL__select("table_name", "field1, field2", "WHERE id = 1")
    SQL__selectRaw("SELECT * FROM table_name WHERE id = 1")
    SQL__insert("table_name", [{field: "field1", value: "value1"}, {field: "field2", value: "value2"}])
    SQL__update("table_name", [{field: "field1", value: "new_value1"}, {field: "field2", value: "new_value2"}], 1, "WHERE id = 1")
    SQL__delete("table_name", 1, "WHERE id = 1")
    SQL__truncate("table_name")
    SQL__dropTable("table_name")
    SQL__query("SELECT * FROM table_name")
    --------------------------------
  * --------------------------------
  * --------------------------------
  * --------------------------------
*/

/**
 *
 * @param {*} table             - table name
 * @param {*} fields            - fields name (default: "*")
 * @param {*} conditionalQuery  - conditional query (default: null)
 * @returns                     - data (array of objects)
 */
export async function SQL__select(
  table: string,
  fields: string = "*",
  conditionalQuery: string | null = null
): Promise<any[] | undefined> {
  await initializeDatabase();

  if (sqlite) {
    const selectQuery = conditionalQuery
      ? `SELECT ${fields} FROM ${table} ${conditionalQuery}`
      : `SELECT ${fields} FROM ${table}`;

    try {
      const data = await sqlite.select(selectQuery);
      return data;
    } catch (error) {
      if (config.debug) {
        console.log("SQL__select error >>", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__select error >> Database not initialized.");
    }
  }
}

/**
 *
 * @param {*} query - raw query (default: null)
 * @returns         - data (array of objects)
 */
export async function SQL__selectRaw(query: string | null): Promise<any[] | undefined> {
  await initializeDatabase();

  if (sqlite) {
    if (!query) {
      console.log("No query");
      return;
    }

    try {
      const data = await sqlite.select(query);
      return data;
    } catch (error) {
      if (config.debug) {
        console.log("SQL__selectRaw error >>", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__selectRaw error >> Database not initialized.");
    }
  }
}

/**
 *
 * @param {*} table  - table name
 * @param {*} data   - data (array of objects)
 * @returns         - void
 */
export async function SQL__insert(table: string, data: DataField[] = []): Promise<void> {
  await initializeDatabase();

  if (sqlite) {
    if (!data.length) {
      console.log("No data to insert");
      return;
    }

    const fields = data.map((item) => item.field).join(", ");
    const holder = data.map(() => "?").join(", ");
    const values = data.map((item) => item.value);

    const insertQuery = `INSERT INTO ${table} (${fields}) VALUES (${holder})`;

    try {
      await sqlite.execute(insertQuery, values);
    } catch (error) {
      if (config.debug) {
        console.log("SQL__insert error >>", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__insert error >> Database not initialized.");
    }
  }
}

/**
 *
 * @param {*} table             - table name
 * @param {*} data              - data (array of objects)
 * @param {*} id                - id (default: null) - if null, use conditionalQuery
 * @param {*} conditionalQuery  - conditional query (default: null) - if null, use id
 * @returns                     - void
 */
export async function SQL__update(
  table: string,
  data: DataField[] = [],
  id?: number,
  conditionalQuery?: string
): Promise<void> {
  await initializeDatabase();

  if (sqlite) {
    if (!data.length) {
      console.log("No data to update");
      return;
    }

    const dataSet = data.map((item) => `${item.field} = ?`).join(", ");
    const values = data.map((item) => item.value);

    const updateQuery = id
      ? `UPDATE ${table} SET ${dataSet} WHERE id=${id}`
      : `UPDATE ${table} SET ${dataSet} ${conditionalQuery || ""}`;

    try {
      await sqlite.execute(updateQuery, values);
    } catch (error) {
      if (config.debug) {
        console.log("SQL__update error >>", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__update error >> Database not initialized.");
    }
  }
}

/**
 *
 * @param {*} table             - table name
 * @param {*} id                - id (default: null) - if null, use conditionalQuery
 * @param {*} conditionalQuery  - conditional query (default: null) - if null, use id
 * @returns                     - void
 */
export async function SQL__delete(
  table: string,
  id?: number,
  conditionalQuery?: string
): Promise<void> {
  await initializeDatabase();

  if (sqlite) {
    const deleteQuery = id
      ? `DELETE FROM ${table} WHERE id=${id}`
      : `DELETE FROM ${table} ${conditionalQuery || ""}`;

    try {
      await sqlite.execute(deleteQuery);
    } catch (error) {
      if (config.debug) {
        console.log("SQL__delete error >>", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__delete error >> Database not initialized.");
    }
  }
}

/**
 *
 * @param {*} table  - table name
 * @returns         - void
 */
export async function SQL__truncate(table: string): Promise<void> {
  await initializeDatabase();

  if (sqlite) {
    try {
      await sqlite.execute(`DELETE FROM ${table}`);
      await sqlite.execute("VACUUM");
    } catch (error) {
      if (config.debug) {
        console.log("SQL__truncate error >>", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__truncate error >> Database not initialized.");
    }
  }
}

/**
 * Drops a table from the database.
 * 
 * @param table   - Name of the table to drop.
 * @param ifExist - Whether to include "IF EXISTS" in the query (default: false).
 * @returns       - A promise that resolves to void.
 */
export async function SQL__dropTable(table: string, ifExist: boolean = false): Promise<void> {
  await initializeDatabase(); // Wait for the database to be fully initialized

  if (sqlite) {
    const dropQuery = ifExist
      ? `DROP TABLE IF EXISTS ${table}`
      : `DROP TABLE ${table}`;

    try {
      await sqlite.execute(dropQuery);
    } catch (error) {
      if (config.debug) {
        console.error("SQL__dropTable error >>", error);
      }
    }
  } else {
    if (config.debug) {
      console.error("SQL__dropTable error >> Database not initialized.");
    }
  }
}

/**
 * Executes a raw SQL query and returns the data.
 * 
 * @param query - Raw SQL query string (default: null).
 * @returns     - A promise that resolves to an array of objects.
 */
export async function SQL__query(query: string): Promise<any[]> {
  await initializeDatabase(); // Wait for the database to be fully initialized

  if (sqlite) {
    try {
      const data = await sqlite.execute(query);
      return data || [];
    } catch (error) {
      if (config.debug) {
        console.error("SQL__query error >>", error);
      }
      return [];
    }
  } else {
    if (config.debug) {
      console.error("SQL__query error >> Database not initialized.");
    }
    return [];
  }
}

