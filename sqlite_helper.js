import { knownFolders, path, File } from "@nativescript/core";
import { openOrCreate } from "@nativescript-community/sqlite";

/* 
  References:
    - https://github.com/nativescript-community/sqlite 
    - https://www.tutorialspoint.com/sqlite/index.htm
*/

/**
 * Configuration database
 * @type {Object}
 */
const config = {
  databaseName: "YOUR_DATABASE_NAME.db", // set your database name
  debug: true, // set false for production and set true for development
  paths: {
    documentsFolder: knownFolders.documents(), // don't change this part, this for get root directory file
    assetsFolder: "assets/db", // location your sqlite file database
  },
};

/**
 * Path database
 * @type {String}
 */
const dbPath = path.join(
  config.paths.documentsFolder.path,
  config.databaseName
);

/**
 * Variable sqlite
 * @type {Object}
 */
let sqlite = null;

/**
 * Initialize database
 * @async
 * @function initializeDatabase
 * @returns {Promise<Object>} sqlite
 */
async function initializeDatabase() {
  if (sqlite) {
    // If the database is already open, immediately return sqlite
    return sqlite;
  }

  if (!config.databaseName || config.databaseName === "YOUR_DATABASE_NAME.db") {
    console.log("Database name is not defined or empty.");
    return null;
  }

  try {
    const isFileDbExists = File.exists(dbPath);
    if (!isFileDbExists) {
      // If the database is not in the document, copy it from assets.
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

      // copy the database file from assets to documents
      await fileDb.copy(dbPath);

      if (config.debug) {
        console.log("Database copied to: ", dbPath);
      }
    }

    // Open or create a connection to the database after ensuring the file exists.
    sqlite = openOrCreate(dbPath);
    if (config.debug) {
      console.log("Database opened at: ", dbPath);
    }
    return sqlite;
  } catch (error) {
    if (config.debug) {
      console.error("Error initializing database: ", error);
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
  table,
  fields = "*",
  conditionalQuery = null
) {
  await initializeDatabase(); // Waiting for the database to be fully initialized

  if (sqlite) {
    let selectQuery;

    if (conditionalQuery) {
      selectQuery = `SELECT ${fields} FROM ${table} ${conditionalQuery}`;
    } else {
      selectQuery = `SELECT ${fields} FROM ${table}`;
    }

    try {
      const data = await sqlite.select(selectQuery);
      return data;
    } catch (error) {
      if (config.debug) {
        console.log("SQL__select error >> ", error);
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
export async function SQL__selectRaw(query = null) {
  await initializeDatabase(); // Waiting for the database to be fully initialized

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
        console.log("SQL__selectRaw error >> ", error);
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
export async function SQL__insert(table, data = []) {
  await initializeDatabase(); // Waiting for the database to be fully initialized

  if (sqlite) {
    if (!data.length) {
      console.log("No data to insert");
      return;
    }

    let fields = data.map((item) => item.field).join(", ");
    let holder = data.map(() => "?").join(", ");
    let values = data.map((item) => item.value);

    let insertQuery = `INSERT INTO ${table} (${fields}) VALUES (${holder})`;

    try {
      await sqlite.execute(insertQuery, values);
    } catch (error) {
      if (config.debug) {
        console.log("SQL__insert error >> ", error);
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
export async function SQL__update(table, data = [], id, conditionalQuery) {
  await initializeDatabase(); // Waiting for the database to be fully initialized

  if (sqlite) {
    if (!data.length) {
      console.log("No data to update");
      return;
    }

    let dataSet = data.map((item) => `${item.field} = ?`).join(", ");
    let values = data.map((item) => item.value);

    let updateQuery = id
      ? `UPDATE ${table} SET ${dataSet} WHERE id=${id}`
      : `UPDATE ${table} SET ${dataSet} ${conditionalQuery}`;

    try {
      await sqlite.execute(updateQuery, values);
    } catch (error) {
      if (config.debug) {
        console.log("SQL__update error >> ", error);
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
export async function SQL__delete(table, id, conditionalQuery) {
  await initializeDatabase(); // Waiting for the database to be fully initialized

  if (sqlite) {
    let deleteQuery = id
      ? `DELETE FROM ${table} WHERE id=${id}`
      : `DELETE FROM ${table} ${conditionalQuery}`;

    try {
      await sqlite.execute(deleteQuery);
    } catch (error) {
      if (config.debug) {
        console.log("SQL__delete error >> ", error);
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
export async function SQL__truncate(table) {
  await initializeDatabase(); // Waiting for the database to be fully initialized

  if (sqlite) {
    try {
      await sqlite.execute(`DELETE FROM ${table}`);
      await sqlite.execute("VACUUM");
    } catch (error) {
      if (config.debug) {
        console.log("SQL__truncate error >> ", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__truncate error >> Database not initialized.");
    }
  }
}

/**
 *
 * @param {*} table     - table name
 * @param {*} ifExist   - if exist (default: false)
 * @returns             - void
 */
export async function SQL__dropTable(table, ifExist = false) {
  await initializeDatabase(); // Waiting for the database to be fully initialized

  if (sqlite) {
    let dropQuery = ifExist
      ? `DROP TABLE IF EXISTS ${table}`
      : `DROP TABLE ${table}`;

    try {
      await sqlite.execute(dropQuery);
    } catch (error) {
      if (config.debug) {
        console.log("SQL__dropTable error >> ", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__dropTable error >> Database not initialized.");
    }
  }
}

/**
 *
 * @param {*} query - raw query (default: null)
 * @returns         - data (array of objects)
 */
export async function SQL__query(query) {
  await initializeDatabase(); // Waiting for the database to be fully initialized

  if (sqlite) {
    try {
      const data = await sqlite.execute(query);
      return data;
    } catch (error) {
      if (config.debug) {
        console.log("SQL__query error >> ", error);
      }
    }
  } else {
    if (config.debug) {
      console.log("SQL__query error >> Database not initialized.");
    }
  }
}
