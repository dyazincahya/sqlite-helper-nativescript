# SQLite Helper Nativescript

This `helper` can helping you when you using SQLite in Nativescript

## Dependency

Before you using this helper, you must be install plugin [nativescript-community/sqlite](https://github.com/nativescript-community/sqlite), cause this helper running on this plugin.

## Changelogs

See full changelogs [here](https://github.com/dyazincahya/sqlite-helper-nativescript/releases)

## Requirements

- [NativeScript 8.x or newer](https://nativescript.org/)
- [@nativescript-community/sqlite](https://github.com/nativescript-community/sqlite) installed in your project.

## Folder Structure

You can use either the JavaScript (`.js`) or TypeScript (`.ts`) version of the helper.

```
NSProject/
├── app/
│   └── assets/
│       └── db/
│           └── your_database.db      <-- Seed database (optional)
│   └── sqlite_helper.js              <-- For JS projects
│   └── sqlite_helper.ts              <-- For TS projects (recomended)
```

## Instructions

1. Download [sqlite_helper.js](https://github.com/dyazincahya/sqlite-helper-nativescript/blob/main/sqlite_helper.js) (or the `.ts` version) and save it to your `app` folder.
2. (Optional) Create a seed database using [SQLite Browser](https://sqlitebrowser.org).
3. Place your `.db` file in `app/assets/db/`.
4. Open the helper file and update the `config` object:

```javascript
const config = {
  databaseName: "my_app.db", // Your actual database filename
  debug: true,               // Enable for detailed logs in console
  paths: {
    documentsFolder: knownFolders.documents(),
    assetsFolder: "assets/db", // Where the helper looks for the seed file
  },
};
```

5. import file sql_helper.js on your module, like :
   ```javascript
   import {
     SQL__select,
     SQL__selectRaw,
     SQL__insert,
     SQL__update,
     SQL__delete,
     SQL__truncate,
     SQL__query,
   } from "~/sqlite_helper";
   ```
6. Avaliable methode on `sql_helper.js`
   | Method | Description | Return |
   |-------------------|-------------------------------------------------------------|--------|
   | SQL__select(...) | for get data from table | Array |
   | SQL__selectRaw(...) | for get data from table, same like `SQL_select`, but here you can execute simple or advance query, like JOIN Query or etc | Array |
   | SQL__insert(...) | for insert data to table (supports single row or bulk array) | void |
   | SQL__update(...) | for update data to table | void |
   | SQL__delete(...) | for delete data row from table | void |
   | SQL__truncate(...) | for clear all data on the table | void |
   | SQL__query(...) | for execute raw query like Create new Table or Etc | ? |
   | SQL__transaction(...) | for execute multiple operations in one transaction (Bulk) | Promise |
   | SQL__executeBatch(...) | for execute multiple raw queries efficiently | Promise |
   | SQL__close() | for close database connection | void |
7. For details, you can look at the [sqlite_helper.js](https://github.com/dyazincahya/sqlite-helper-nativescript/blob/main/sqlite_helper.js) file directly

## Sample Code

### TABLE

Assummed I have a **users** table like this :

```sql
CREATE TABLE "users" (
	"id"	INTEGER NOT NULL UNIQUE,
	"fullname"	TEXT NOT NULL,
	"about"	TEXT DEFAULT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
)
```

#### CREATE new TABLE USERS

Before you can do something, make sure you already create the table. for create table in SQLite, you can use method `SQL_query` from `sqlite_helper.js`, example like this :

```javascript
import { SQL__query } from "~/sqlite_helper";

SQL__query(`CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER NOT NULL UNIQUE,
	"fullname"	TEXT NOT NULL,
	"about"	TEXT DEFAULT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
)`);
```

When you make create table query, make sure you use `IF NOT EXISTS` in your query. This is useful to avoid double execution of your query.

#### GET all USERS

```sql
SQL__select(tableName)
```

I want to get all user data from the table

```javascript
import { SQL__select } from "~/sqlite_helper";

SQL__select("users").then((res) => {
  console.log(res);
  console.log(res.length);
});
```

#### GET USER where FULLNAME is JOHN DUO

```sql
SQL__select(tableName, fields, conditionalQuery)
```

I want to get all user data from table by fullname is john duo

```javascript
import { SQL__select } from "~/sqlite_helper";

SQL__select("users", "*", "WHERE fullname='john duo'").then((res) => {
  console.log(res);
  console.log(res.length);
});
```

#### CREATE new USER

```sql
SQL__insert(tableName, data)
```

I want to create new user with fullname is Kang Cahya and about is Designer

```javascript
import { SQL__insert } from "~/sqlite_helper";

SQL__insert("users", [
  { field: "fullname", value: "Kang Cahya" },
  { field: "about", value: "Designer" },
]);
```

#### UPDATE Data by ID

I want to update the `about` field for the user with ID `3`.

```javascript
import { SQL__update } from "~/sqlite_helper";

SQL__update("users", [{ field: "about", value: "Tester" }], 3);
```

#### UPDATE Data with WHERE Condition

I want to update the `about` field where the ID is `3` using a custom string condition.

```javascript
import { SQL__update } from "~/sqlite_helper";

SQL__update(
  "users",
  [{ field: "about", value: "Tester" }],
  null,
  "WHERE id='3'",
);
```

#### TRANSACTION (For Bulk CRUD)

Use transactions when you need to execute multiple write operations (Insert/Update/Delete) as a single atomic unit. This is **much faster** than individual calls.

```javascript
import { SQL__transaction } from "~/sqlite_helper";

await SQL__transaction(async (db) => {
  // All these operations happen in ONE transaction
  // 'db' provides the standard SQLite plugin API (execute, select, etc)
  await db.execute("INSERT INTO users (fullname) VALUES (?)", ["User 1"]);
  await db.execute("INSERT INTO users (fullname) VALUES (?)", ["User 2"]);
  await db.execute("UPDATE users SET about='Batch' WHERE fullname LIKE 'User%'");
});
```

#### BULK INSERT (Optimized)

The `SQL__insert` method is smart: if you pass an array of row objects, it will automatically use a transaction internally for high performance.

```javascript
import { SQL__insert } from "~/sqlite_helper";

const manyUsers = [
  [{ field: "fullname", value: "User A" }, { field: "about", value: "A" }],
  [{ field: "fullname", value: "User B" }, { field: "about", value: "B" }],
  [{ field: "fullname", value: "User C" }, { field: "about", value: "C" }]
];

// This will automatically use a transaction internally
await SQL__insert("users", manyUsers);
```

#### EXECUTE BATCH

```javascript
import { SQL__executeBatch } from "~/sqlite_helper";

const queries = [
  "DELETE FROM users WHERE archive=1",
  ["INSERT INTO users (fullname) VALUES (?)", ["User X"]],
  "VACUUM"
];

await SQL__executeBatch(queries);
```

## My Nativescript App using SQLite Helper

[WA Sender](https://github.com/x-labs-86/wa-sender)

## More info about Sqlite

[Sqlite Tutorial by Tutorialspoint](https://www.tutorialspoint.com/sqlite/index.htm)
