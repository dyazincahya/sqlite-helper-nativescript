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
    | SQL_query(...)    | for execute raw query, here you can execute Join Query, Etc | void   |
5. For details, you can look at the [sql_helper.js](https://github.com/dyazincahya/example-code-sqlite-nativescript/blob/main/sql_helper.js) file directly

## Sample Code
``` javascript
import { SQL__insert } from "~/sql_helper";

try {
    SQL__insert(
        "users",
        "fullname, about",
        "?, ?",
        ["Kang Cahya", "Coder"]
    );
} catch (error) {
    console.log(error);
}
```

## More info about Sqlite
[Sqlite Tutorial by Tutorialspoint](https://www.tutorialspoint.com/sqlite/index.htm)
