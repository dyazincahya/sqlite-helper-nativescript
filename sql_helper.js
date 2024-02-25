import { openOrCreate } from "@nativescript-community/sqlite";

const sqlite = openOrCreate("your_database.db");

export async function SQL__select(table, fields = "*", conditionalQuery) {
  const select = "SELECT " + fields + " FROM " + table + " " + conditionalQuery;
  const data = await sqlite.select(select);
  return data;
}

export async function SQL__insert(table, fields, holder, value = []) {
  const insert =
    "INSERT INTO " + table + " (" + fields + ") VALUES (" + holder + ")";
  await sqlite.execute(insert, value);
}

export async function SQL__update(table, dataSet, conditionalQuery) {
  const update = "UPDATE " + table + " SET " + dataSet + " " + conditionalQuery;
  await sqlite.execute(update, value);
}

export async function SQL__delete(table, conditionalQuery) {
  await sqlite.execute("DELETE FROM " + table + " " + conditionalQuery);
}

export async function SQL__truncate(table) {
  await sqlite.execute("DELETE FROM " + table);
  await sqlite.execute("VACUUM");
}

export async function SQL__query(query) {
  const data = await sqlite.execute(query);
  return data;
}
