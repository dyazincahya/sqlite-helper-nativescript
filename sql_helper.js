import { openOrCreate } from "@nativescript-community/sqlite";

/* 
  References:
    - https://github.com/nativescript-community/sqlite 
    - https://www.tutorialspoint.com/sqlite/index.htm
*/

const sqlite = openOrCreate("xlabs_bukukasbon.db");

export async function SQL__select(table, fields = "*", conditionalQuery) {
  const select = "SELECT " + fields + " FROM " + table + " " + conditionalQuery;
  const data = await sqlite.select(select);
  return data;
}

export async function SQL__insert(table, data = []) {
  if (data.length) {
    let fields = [],
      holder = [],
      value = [];
    for (let key in data) {
      fields.push(key);
      holder.push("?");
      value.push(data[key]);
    }

    let fieldsString = fields.join(", "),
      holderString = holder.join(", ");

    const insert =
      "INSERT INTO " +
      table +
      " (" +
      fieldsString +
      ") VALUES (" +
      holderString +
      ")";
    await sqlite.execute(insert, value);
  } else {
    console.dir("Data : ", data);
    console.dir("Data length : ", data.length);
    console.log("No data to insert");
  }
}

export async function SQL__update(table, data = [], id, conditionalQuery) {
  if (data.length) {
    let dataSet = [];
    for (let key in data) {
      dataSet.push(key + " = " + data[key]);
    }

    let dataSetString = dataSet.join(", ");

    if (id) {
      const update =
        "UPDATE " + table + " SET " + dataSetString + " WHERE id=" + id;
    } else {
      const update =
        "UPDATE " + table + " SET " + dataSetString + " " + conditionalQuery;
    }
    await sqlite.execute(update);
  } else {
    console.dir("Data : ", data);
    console.dir("Data length : ", data.length);
    console.log("No data to update");
  }
}

export async function SQL__delete(table, conditionalQuery) {
  await sqlite.execute("DELETE FROM " + table + " " + conditionalQuery);
}

export async function SQL__truncate(table) {
  await sqlite.execute("DELETE FROM " + table);
  await sqlite.execute("VACUUM");
}

export async function SQL__query(query) {
  await sqlite.execute(query);
}
