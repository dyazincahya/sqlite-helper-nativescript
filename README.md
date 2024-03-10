# Example Sqlite Nativescript
Example code about how to usage Nativescript Sqlite (NS 8 or newer)

> in this example I use the plugin [nativescript-community/sqlite](https://github.com/nativescript-community/sqlite)

## Instructions
1. Download file [sql_helper.js](https://github.com/dyazincahya/example-code-sqlite-nativescript/blob/main/sql_helper.js) and save that file on ```app``` folder Your Nativescript Project
2. On file ```sql_helper.js``` adjust code in line 3 ```openOrCreate("your_database.db")``` and change with your database name
3. import file sql_helper.js on your module, like :
   ``` javascript
   import { SQL__select, SQL__insert, SQL__update, SQL__delete, SQL__truncate, SQL__query } from "~/sql_helper";
   ```
4. Avaliable methode on ```sql_helper.js```
    | Method            | Description                                                 | Return |
    |-------------------|-------------------------------------------------------------|--------|
    | SQL_select(...)   | get data from table                                         | Array  |
    | SQL_insert(...)   | for insert data to table                                    | void   |
    | SQL_update(...)   | for update data to table                                    | void   |
    | SQL_delete(...)   | for delete data row from table                              | void   |
    | SQL_truncate(...) | for clear all data on the table                             | void   |
    | SQL_query(...)    | for execute raw query, here you can execute Join Query, Etc | ?      |
5. For details, you can look at the [sql_helper.js](https://github.com/dyazincahya/example-code-sqlite-nativescript/blob/main/sql_helper.js) file directly

## Sample Code

#### TABLE
Assummed I have a **user** table like this :
``` sql
CREATE TABLE "users" (
	"id"	INTEGER NOT NULL UNIQUE,
	"fullname"	TEXT NOT NULL,
	"about"	TEXT DEFAULT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
)
```

#### GET all USERS
``` sql
SQL__select(tableName)
```
I want to get all user data from the table
``` javascript
import { SQL__select } from "~/sql_helper";

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
import { SQL__select } from "~/sql_helper";

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
import { SQL__insert } from "~/sql_helper";

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
import { SQL__insert } from "~/sql_helper";

SQL__update("users", [{ field: "about", value: "Tester" }], 3);
```

#### UPDATE data USER with WHERE condition
``` sql
SQL__update(tableName, data, id, conditionalQuery)
```
I want to update field about by user ID number 3
``` javascript
import { SQL__insert } from "~/sql_helper";

SQL__update("users", [{ field: "about", value: "Tester" }], null, "WHERE id='3'");
```

## More info about Sqlite
[Sqlite Tutorial by Tutorialspoint](https://www.tutorialspoint.com/sqlite/index.htm)
