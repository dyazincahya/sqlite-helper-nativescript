# SQLite Helper Nativescript
This ```helper``` can helping you when you using SQLite in Nativescript


## Dependency
Before you using this helper, you must be install plugin [nativescript-community/sqlite](https://github.com/nativescript-community/sqlite), cause this helper running on this plugin.

## Changelogs
See full changelogs [here](https://github.com/dyazincahya/sqlite-helper-nativescript/releases)
## Requirement
- [Nativescript 8 or newer](https://nativescript.org/)
- [nativescript-community/sqlite](https://github.com/nativescript-community/sqlite)


## Instructions
1. Download file [sqlite_helper.js](https://github.com/dyazincahya/sqlite-helper-nativescript/blob/main/sqlite_helper.js) and save that file here : ```\YOUR_NATIVESCRIPT_PROJECT\app```
2. Create ```.db``` file using [SQLite Browser](https://sqlitebrowser.org) and create ```assets\db``` folder on ```\YOUR_NATIVESCRIPT_PROJECT\app```
3. And after that put the ```your_database.db``` in ```\YOUR_NATIVESCRIPT_PROJECT\app\assets\db```
4. Open [sqlite_helper.js](https://github.com/dyazincahya/sqlite-helper-nativescript/blob/main/sqlite_helper.js) file, you can adjust configuration here
```javascript
const config = {
  databaseName: "YOUR_DATABASE_NAME.db", // set your database name
  debug: true, // set false for production and set true for development
  paths: {
    documentsFolder: knownFolders.documents(), // Do not change this value. It is used to get the root documents directory.
    assetsFolder: "assets/db", // Location of your SQLite database file. If you place an existing database here, this helper will automatically copy it to the system directory, so you don't need to manually create the database.
  },
};
```
5. import file sql_helper.js on your module, like :
   ``` javascript
   import { SQL__select, SQL__selectRaw, SQL__insert, SQL__update, SQL__delete, SQL__truncate, SQL__query } from "~/sqlite_helper";
   ```
6. Avaliable methode on ```sql_helper.js```
    | Method            | Description                                                 | Return |
    |-------------------|-------------------------------------------------------------|--------|
    | SQL__select(...)   | for get data from table                                         | Array  |
    | SQL__selectRaw(...) | for get data from table, same like ```SQL_select```, but here you can execute simple or advance query, like JOIN Query or etc | Array | 
    | SQL__insert(...)   | for insert data to table                                    | void   |
    | SQL__update(...)   | for update data to table                                    | void   |
    | SQL__delete(...)   | for delete data row from table                              | void   |
    | SQL__truncate(...) | for clear all data on the table                             | void   |
    | SQL__query(...)    | for execute raw query like Create new Table or Etc | ?      |
7. For details, you can look at the [sqlite_helper.js](https://github.com/dyazincahya/sqlite-helper-nativescript/blob/main/sqlite_helper.js) file directly


## Sample Code

### TABLE
Assummed I have a **users** table like this :
``` sql
CREATE TABLE "users" (
	"id"	INTEGER NOT NULL UNIQUE,
	"fullname"	TEXT NOT NULL,
	"about"	TEXT DEFAULT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
)
```

#### CREATE new TABLE USERS
Before you can do something, make sure you already create the table. for create table in SQLite, you can use method ```SQL_query``` from ```sqlite_helper.js```, example like this :
``` javascript
import { SQL__query } from "~/sqlite_helper";

SQL__query(`CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER NOT NULL UNIQUE,
	"fullname"	TEXT NOT NULL,
	"about"	TEXT DEFAULT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
)`);
```

When you make create table query, make sure you use ```IF NOT EXISTS``` in your query. This is useful to avoid double execution of your query.


#### GET all USERS
``` sql
SQL__select(tableName)
```
I want to get all user data from the table
``` javascript
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
``` javascript
import { SQL__select } from "~/sqlite_helper";

SQL__select("users", "*", "WHERE fullname='john duo'").then((res) => {
   console.log(res);
   console.log(res.length);
});
```

#### CREATE new USER
``` sql
SQL__insert(tableName, data)
```
I want to create new user with fullname is Kang Cahya and about is Designer
``` javascript
import { SQL__insert } from "~/sqlite_helper";

SQL__insert("users", [
   { field: "fullname", value: "Kang Cahya" },
   { field: "about", value: "Designer" }
]);
```

#### UPDATE data USER by ID
``` sql
SQL__update(tableName, data, id, conditionalQuery)
```
I want to update field ABOUT by user ID number 3
``` javascript
import { SQL__insert } from "~/sqlite_helper";

SQL__update("users", [{ field: "about", value: "Tester" }], 3);
```

#### UPDATE data USER with WHERE condition
``` sql
SQL__update(tableName, data, id, conditionalQuery)
```
I want to update field about by user ID number 3
``` javascript
import { SQL__insert } from "~/sqlite_helper";

SQL__update("users", [{ field: "about", value: "Tester" }], null, "WHERE id='3'");
```

## My Nativescript App using SQLite Helper
[WA Sender](https://github.com/x-labs-86/wa-sender)

## More info about Sqlite
[Sqlite Tutorial by Tutorialspoint](https://www.tutorialspoint.com/sqlite/index.htm)
