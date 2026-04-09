# SQLite Helper Nativescript

This `helper` can helping you when you using SQLite in Nativescript. It provides high-level CRUD operations, Soft Delete management, and optimized bulk transactions.

## Dependency

Before you using this helper, you must be install plugin [nativescript-community/sqlite](https://github.com/nativescript-community/sqlite), cause this helper running on this plugin.

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
│   └── database/
│       └── sqlite-helper.js          <-- For JS projects
│       └── sqlite_helper.ts          <-- For TS projects (recommended)
```

## Instructions

1. Download `sqlite-helper.js` (or the `.ts` version) and save it to your `app/database` folder.
2. (Optional) Create a seed database using [SQLite Browser](https://sqlitebrowser.org).
3. Place your `.db` file in `app/assets/db/`.
4. Open the helper file and update the `config` object:

```javascript
const config = {
  databaseName: "my_app.db", 
  debug: true, 
  softDelete: true, // Enable Soft Delete (is_deleted column required)
  paths: {
    documentsFolder: knownFolders.documents(),
    assetsFolder: "assets/db",
  },
};
```

### Soft Delete Feature
When `softDelete: true` is enabled:
- **SELECT**: Automatically appends `WHERE is_deleted = 0`.
- **INSERT/UPDATE**: Automatically ensures `is_deleted = 0` (Active).
- **DELETE**: Instead of physical deletion, it performs an update: `SET is_deleted = 1`.

> [!IMPORTANT]
> To use Soft Delete, every table in your database must have an `is_deleted` column (INTEGER, default 0).

## Available Methods

| Method | Description | Return |
|-------------------|-------------------------------------------------------------|--------|
| SQL__select(...) | Get data from table (Auto filter `is_deleted=0`) | Array |
| SQL__selectRaw(...) | Execute advance query (JOIN, etc.) | Array |
| SQL__insert(...) | Insert data (Single row or bulk Array) | void |
| SQL__update(...) | Update data (Supports single ID or Array ID) | void |
| SQL__delete(...) | Soft Delete (if enabled) or Physical Delete | void |
| SQL__hardDelete(...) | **Physical Delete** ignoring soft delete setting | void |
| SQL__restore(...) | Restore soft-deleted records (`is_deleted = 0`) | void |
| SQL__truncate(...) | Clear all data on the table | void |
| SQL__query(...) | Execute raw query like Create Table | ? |
| SQL__transaction(...) | Transaction with **Helper Object** (Soft Delete Aware) | Promise |
| SQL__transactionNative(...) | Transaction with **Native DB Handle** (Raw SQL) | Promise |
| SQL__executeBatch(...) | Batch operations with **Command Objects** | Promise |
| SQL__executeBatchNative(...) | Batch operations with **Raw SQL Strings** | Promise |

---

## Sample Code

### Bulk Delete (Array of IDs)
All delete and update functions now support passing an array of IDs.
```javascript
import { SQL__delete } from "~/database/sqlite-helper";

// Delete multiple IDs at once (Soft Delete if enabled)
await SQL__delete("users", [1, 5, 22]);
```

### Select Data
```javascript
import { SQL__select, SQL__selectRaw } from "~/database/sqlite-helper";

// Get all active users (auto filter is_deleted=0)
const users = await SQL__select("users");

// Get with condition
const admins = await SQL__select("users", "id, fullname", "WHERE role = 'admin' AND age > 20");

// Raw Select with JOIN
const query = `
  SELECT b.id, b.kasbon_name, u.fullname 
  FROM bukukasbon b
  JOIN users u ON b.user_id = u.id
  WHERE b.is_deleted = 0
`;
const results = await SQL__selectRaw(query);
```

### Update Data (Single & Bulk)
```javascript
import { SQL__update } from "~/database/sqlite-helper";

// Update single ID
await SQL__update("users", [{ field: "fullname", value: "New Name" }], 1);

// Update multiple IDs (Bulk)
await SQL__update("users", [{ field: "role", value: "moderator" }], [5, 6, 7]);

// Update with custom condition
await SQL__update("users", [{ field: "status", value: "inactive" }], null, "WHERE last_login < '2023-01-01'");
```

### Restore & Hard Delete
```javascript
import { SQL__restore, SQL__hardDelete } from "~/database/sqlite-helper";

// Restore deleted users
await SQL__restore("users", [10, 11]);

// Permanently remove data
await SQL__hardDelete("logs", null, "WHERE created_at < '2023-01-01'");
```

### High-level Transaction (Soft Delete Aware)
The new `SQL__transaction` provides a `helper` object that has the same API as the main functions.
```javascript
import { SQL__transaction } from "~/database/sqlite-helper";

await SQL__transaction(async (helper) => {
  // All these follow Soft Delete logic automatically
  await helper.insert("users", [{ field: "fullname", value: "New User" }]);
  await helper.delete("old_table", 5);
  
  const activeUsers = await helper.select("users");
});
```

### Native Transaction (Raw SQL)
Use this if you need full control over the SQL strings.
```javascript
import { SQL__transactionNative } from "~/database/sqlite-helper";

await SQL__transactionNative(async (db) => {
  await db.execute("DELETE FROM users WHERE id = ?", [1]); 
});
```

### Object-based Batch
Execute multiple operations efficiently using an array of objects.
```javascript
import { SQL__executeBatch } from "~/database/sqlite-helper";

await SQL__executeBatch([
  { type: "insert", table: "users", data: [{ field: "name", value: "Budi" }] },
  { type: "delete", table: "users", id: 10 },
  { type: "restore", table: "products", id: [50, 51] }
]);
```

### Native Batch (Raw SQL)
```javascript
import { SQL__executeBatchNative } from "~/database/sqlite-helper";

await SQL__executeBatchNative([
  "DELETE FROM logs WHERE level = 'debug'",
  ["INSERT INTO users (fullname, is_deleted) VALUES (?, ?)", ["Native User", 0]],
  "VACUUM"
]);
```

### Bulk Insert (Optimized)
Pass an array of objects to `SQL__insert` for fast transactional insertion.
```javascript
import { SQL__insert } from "~/database/sqlite-helper";

const manyUsers = [
  [{ field: "fullname", value: "User A" }],
  [{ field: "fullname", value: "User B" }]
];

await SQL__insert("users", manyUsers);
```
