# SQLite Helper Nativescript
This ```helper``` can helping you when you using SQLite in Nativescript


## Dependency
Before you using this helper, you must be install plugin [nativescript-community/sqlite](https://github.com/nativescript-community/sqlite), cause this helper running on this plugin.


## Requirement
- [Nativescript 8 or newer](https://nativescript.org/)
- [nativescript-community/sqlite](https://github.com/nativescript-community/sqlite)


## Instructions
1. Download file [sqlite_helper.js](https://github.com/dyazincahya/sqlite-helper-nativescript/blob/main/sqlite_helper.js) and save that file here : ```\YOUR_NATIVESCRIPT_PROJECT\app```
2. In the ```sqlite_helper.js``` file, find ```openOrCreate("your_database.db")``` code and change with your database name
3. Then put the ```your_database.db``` on ```\YOUR_NATIVESCRIPT_PROJECT\app```
4. In the ```sqlite_helper.js``` file, find ```showError``` variable then set it to ```true``` if you want to see all errors that occur during development on your sqlite
5. import file sql_helper.js on your module, like :
   ``` javascript
   import { SQL__select, SQL__selectRaw, SQL__insert, SQL__update, SQL__delete, SQL__truncate, SQL__query } from "~/sqlite_helper";
   ```
6. Avaliable methode on ```sql_helper.js```
    | Method            | Description                                                 | Return |
    |-------------------|-------------------------------------------------------------|--------|
    | SQL_select(...)   | get data from table                                         | Array  |
    | SQL__selectRaw(...) | execute advance query select, like JOIN Query or ETC for get data from table | Array | 
    | SQL_insert(...)   | for insert data to table                                    | void   |
    | SQL_update(...)   | for update data to table                                    | void   |
    | SQL_delete(...)   | for delete data row from table                              | void   |
    | SQL_truncate(...) | for clear all data on the table                             | void   |
    | SQL_query(...)    | for execute raw query, here you can execute Join Query, Etc | ?      |
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
import { SQL_query } from "~/sqlite_helper";

SQL_query(`CREATE TABLE IF NOT EXISTS "users" (
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

## More info about Sqlite
[Sqlite Tutorial by Tutorialspoint](https://www.tutorialspoint.com/sqlite/index.htm)
