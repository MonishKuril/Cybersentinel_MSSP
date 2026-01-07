# Security Analysis and Mitigation Plan

This document details critical security vulnerabilities found in the MSSP project and provides a clear plan for how to remediate them. These flaws require immediate attention to protect the integrity of the application and the sensitive data it handles.

## 1. CRITICAL: Insecure Storage and Runtime Modification of Configuration Files

This is the most severe security flaw in the application. The backend is designed to modify its own configuration and environment files at runtime, which is an extremely dangerous practice.

### 1.1. Vulnerability: Storing MFA Secrets in `.env`

-   **Description:** When a new user sets up Multi-Factor Authentication (MFA), their TOTP secret is directly appended to the `.env` file. The `.env` file is intended for static configuration and should **never** be modified by the running application.
-   **Impact:**
    -   **High-Risk Data Exposure:** `env` files are often less protected than databases. If the server is misconfigured or a file-reading vulnerability is discovered, an attacker could potentially download the `.env` file and gain access to the MFA secrets of all users.
    -   **Race Conditions and Corruption:** Appending to a file is not an atomic operation. If two users try to set up MFA at the same time, it could lead to a race condition that corrupts the `.env` file, potentially taking the entire application offline.
-   **Remediation:**
    1.  **Stop Modifying `.env`:** Immediately remove the code (`fs.appendFileSync`) that writes to the `.env` file from the `routes/auth.js` and `routes/admin.js` files.
    2.  **Move Secrets to Database:** As outlined in the `improvement_plan.md`, all user-specific data, including MFA secrets, must be moved to a secure database. The secrets should be stored in an encrypted format in the `users` table, associated with the user record.

### 1.2. Vulnerability: Storing Credentials and State in `.js` Files

-   **Description:** The `config/` directory contains JavaScript files (`admins.js`, `clients.js`, `superadmin.js`) that store user credentials (passwords), client API keys, and other sensitive state. The application's administrative routes directly write to these files to "persist" data.
-   **Impact:**
    -   **Code Injection:** The application writes JavaScript code to files that are then loaded by Node.js. While the current implementation seems to write simple JSON-like objects, a bug could introduce a code injection vulnerability. If an attacker could influence the data being written (e.g., through a cleverly crafted admin name), they might be able to inject malicious code that gets executed by the server.
    -   **Data Corruption and Instability:** Similar to the `.env` issue, writing to these files is not transactional and can lead to data loss or file corruption, causing application instability.
-   **Remediation:**
    1.  **Replace File Writes with Database Operations:** All functions that write to the `config/` directory (e.g., `writeAdminsToFile`) must be rewritten to perform standard `CREATE`, `UPDATE`, and `DELETE` operations on the new database.
    2.  **Use an ORM/Query Builder:** Use a library like Sequelize or Knex.js to interact with the database. These libraries provide built-in mechanisms to prevent SQL injection, which will be the new primary threat after moving to a database.

## 2. HIGH: Lack of Password Hashing

-   **Description:** The application currently stores user passwords in plain text within the configuration files.
-   **Impact:** If an attacker gains access to the `config/` files, they will have the cleartext passwords of all admins and superadmins. They can then use these credentials to log in and gain full control of the system.
-   **Remediation:**
    1.  **Implement Password Hashing:** Use a strong, one-way hashing algorithm like **bcrypt** or **Argon2** to hash all user passwords before storing them in the database.
    2.  **Update Login Logic:** Modify the login function to hash the incoming password from the user and compare it to the stored hash. **Never** un-hash the stored password.
    3.  **Create a Migration Path:** Since current passwords are in plain text, you will need a migration strategy. One common approach is to force all users to reset their passwords after the update. Alternatively, during a user's next login, you can verify their plain-text password, and if it's correct, immediately hash it and save it back to the database, then delete the plain-text version.

## 3. MEDIUM: Unsanitized Data in File Paths (Potential Path Traversal)

-   **Description:** While not currently exploited, the pattern of writing to files based on constructed paths could be a risk. If any part of a filename were to be influenced by user input, it could lead to a path traversal vulnerability. For example, if a function were to save a file to `path.join(__dirname, '..', 'data', userInput)`, an attacker could provide `userInput` like `../../../some/other/path` to write files outside the intended directory.
-   **Impact:** An attacker could overwrite critical files, view sensitive information, or execute arbitrary code.
-   **Remediation:**
    1.  **Adopt a Database:** The primary fix is to move away from file-based storage entirely.
    2.  **Sanitize All Inputs:** As a general security principle, any user-provided input that is used in file paths, shell commands, or database queries must be rigorously sanitized and validated.

## Summary of Actions

1.  **Immediate Priority:**
    -   Begin the process of integrating a database (SQLite is a good first step).
    -   Implement `bcrypt` for password hashing on the new `users` table.
    -   Create a migration script to move existing users to the database, hashing their passwords in the process.

2.  **Second Priority:**
    -   Rewrite all administrative functions to use the database instead of writing to `.js` files.
    -   Move MFA secrets into the `users` table in the database, encrypted at rest.

3.  **Ongoing:**
    -   Ensure all user-provided data is validated and sanitized before use, especially when passed to any I/O functions or external processes.
