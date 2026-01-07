# MSSP Database Schema

This document outlines the table structures for the `mssp.db` SQLite database as defined in the backend scripts.

---

## `users` Table

This table stores information about all users, including admins, superadmins, and the main superadmin.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | Primary Key | Unique identifier for the user. |
| `username` | STRING | Unique, Not Nullable | The login username. |
| `password` | STRING | Not Nullable | The hashed password for the user. |
| `role` | STRING | Not Nullable | The user's role (e.g., 'admin', 'superadmin', 'main-superadmin'). |
| `name` | STRING | | The user's full name. |
| `email` | STRING | Unique | The user's email address. |
| `organization` | STRING | | The organization the user belongs to. |
| `city` | STRING | | The city where the user is located. |
| `state` | STRING | | The state where the user is located. |
| `blocked` | BOOLEAN | Default: `false` | Flag to indicate if the user's account is blocked. |
| `mfa_secret` | STRING | | The secret key for Multi-Factor Authentication. |
| `created_at` | DATETIME | | Timestamp of when the record was created. |
| `updated_at` | DATETIME | | Timestamp of when the record was last updated. |

---

## `clients` Table

This table stores information about the clients being monitored.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | Primary Key | Unique identifier for the client. |
| `name` | STRING | Not Nullable | The name of the client. |
| `url` | STRING | Not Nullable | The dashboard URL for the client. |
| `description` | TEXT | | A brief description of the client. |
| `admin_id` | INTEGER | Foreign Key -> `users.id` | **(Legacy)** Associates a client with a single admin. See note below. |
| `graylog_host` | STRING | | Hostname for the client's Graylog instance. |
| `graylog_username` | STRING | | Username for the client's Graylog instance. |
| `graylog_password` | STRING | | Password for the client's Graylog instance. |
| `graylog_stream_id` | STRING | | Stream ID for the client's Graylog instance. |
| `log_api_host` | STRING | | Hostname for the client's Log API. |
| `log_api_username` | STRING | | Username for the client's Log API. |
| `log_api_password` | STRING | | Password for the client's Log API. |
| `created_at` | DATETIME | | Timestamp of when the record was created. |
| `updated_at` | DATETIME | | Timestamp of when the record was last updated. |

---

## `client_admins` Table

This table creates a many-to-many relationship between users and clients, allowing multiple admins to be assigned to a single client, or a single admin to manage multiple clients.

**Note:** This table is used by the application logic but is **missing** from the `scripts/init-db.js` initialization script. This is a bug in the database setup script.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `client_id` | INTEGER | Foreign Key -> `clients.id` | The ID of the client. |
| `user_id` | INTEGER | Foreign Key -> `users.id` | The ID of the user (admin). |

