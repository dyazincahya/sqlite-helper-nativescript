import { openOrCreate } from "@nativescript-community/sqlite";

/* 
  References:
    - https://github.com/nativescript-community/sqlite 
    - https://www.tutorialspoint.com/sqlite/index.htm
*/

const sqlite = openOrCreate("dbname.db");
const showError = false;

export async function SQL__select(
  table,
  fields = "*",
  conditionalQuery = null
) {
  let selectQuery;

  if (conditionalQuery) {
    selectQuery =
      "SELECT " + fields + " FROM " + table + " " + conditionalQuery;
  } else {
    selectQuery = "SELECT " + fields + " FROM " + table;
  }

  try {
    const data = await sqlite.select(selectQuery);
    return data;
  } catch (error) {
    if (showError) {
      console.log("SQL__select error >> ", error);
    }
  }
}

export async function SQL__selectRaw(query = null) {
  if (!query) {
    console.log("No query");
    return;
  }

  let selectQuery = query;

  try {
    const data = await sqlite.select(selectQuery);
    return data;
  } catch (error) {
    if (showError) {
      console.log("SQL__selectRaw error >> ", error);
    }
  }
}

export async function SQL__insert(table, data = []) {
  if (!data.length) {
    console.dir("Data : ", data);
    console.dir("Data length : ", data.length);
    console.log("No data to insert");
    return;
  }

  let insertQuery,
    fields = [],
    holder = [],
    value = [];
  for (let i in data) {
    fields.push(data[i].field);
    holder.push("?");
    value.push(data[i].value);
  }

  let fieldsString = fields.join(", "),
    holderString = holder.join(", ");

  insertQuery =
    "INSERT INTO " +
    table +
    " (" +
    fieldsString +
    ") VALUES (" +
    holderString +
    ")";

  try {
    await sqlite.execute(insertQuery, value);
  } catch (error) {
    if (showError) {
      console.log("SQL__insert error >> ", error);
    }
  }
}

export async function SQL__update(table, data = [], id, conditionalQuery) {
  if (!data.length) {
    console.dir("Data : ", data);
    console.dir("Data length : ", data.length);
    console.log("No data to update");
    return;
  }

  let updateQuery,
    dataSet = [],
    valueSet = [];

  for (let i in data) {
    dataSet.push(data[i].field + " = ?");
    valueSet.push(data[i].value);
  }

  let dataSetString = dataSet.join(", ");

  if (id) {
    updateQuery =
      "UPDATE " + table + " SET " + dataSetString + " WHERE id=" + id;
  } else {
    updateQuery =
      "UPDATE " + table + " SET " + dataSetString + " " + conditionalQuery;
  }

  try {
    await sqlite.execute(updateQuery, valueSet);
  } catch (error) {
    if (showError) {
      console.log("SQL__update error >> ", error);
    }
  }
}

export async function SQL__delete(table, id, conditionalQuery) {
  let deleteQuery;
  if (id) {
    deleteQuery = "DELETE FROM " + table + " WHERE id=" + id;
  } else {
    deleteQuery = "DELETE FROM " + table + " " + conditionalQuery;
  }
  try {
    await sqlite.execute(deleteQuery);
  } catch (error) {
    if (showError) {
      console.log("SQL__delete error >> ", error);
    }
  }
}

export async function SQL__truncate(table) {
  try {
    await sqlite.execute("DELETE FROM " + table);
    await sqlite.execute("VACUUM");
  } catch (error) {
    if (showError) {
      console.log("SQL__truncate error >> ", error);
    }
  }
}

export async function SQL__query(query) {
  try {
    const data = await sqlite.execute(query);
    return data;
  } catch (error) {
    if (showError) {
      console.log("SQL__query error >> ", error);
    }
  }
}
