# Technical Analysis of the MSSP Project

## 1. Project Overview

The MSSP (Managed Security Service Provider) project is a web application designed to provide a centralized dashboard for monitoring and managing client log data from various sources, including Graylog and custom log APIs. The application is divided into a Node.js/Express backend and a static vanilla JavaScript frontend.

## 2. Backend Analysis

The backend is a Node.js application using the Express.js framework. Its primary responsibility is to serve the frontend, provide a REST API for data access and management, and act as a secure proxy to downstream client log services.

### 2.1. Architecture: "Configuration-as-Database"

The most significant and unusual architectural characteristic of the backend is its "configuration-as-database" approach. Instead of a traditional database, the application uses a set of JavaScript files in the `config/` directory (`admins.js`, `clients.js`, `superadmin.js`) and the root `.env` file to store all application state. This includes:

-   User credentials (usernames, passwords for admins and superadmins).
-   Client configurations (URLs, API credentials for Graylog and other log services).
-   MFA secrets for all users.

The application reads from these files on startup and, more critically, **modifies them at runtime** to persist changes. For example, when a new user is added or a client's configuration is updated, the backend code directly writes to these JavaScript files. New MFA secrets are appended to the `.env` file during the user's first-time setup.

### 2.2. Core Functionality

-   **Multi-tenant Log Data Proxy:** The application's core purpose is to act as a secure proxy. It uses credentials stored in `config/clients.js` to fetch log data from external client services. This prevents sensitive client credentials from being exposed to the frontend or the end-user, which is a good security practice.
-   **API Endpoints:** The backend exposes a REST API with routes for:
    -   **Authentication:** `/api/auth/` (login, logout, MFA setup, auth check).
    -   **Client Data:** `/api/clients/` (fetching client lists and log data).
    -   **Administration:** `/api/admin/` (managing admins, superadmins, and clients).
    -   **News:** `/api/news/` (scraping news for the dashboard ticker).

### 2.3. Authentication and Authorization

The application implements a strict, role-based access control (RBAC) model.

-   **Authentication:**
    -   Authentication is handled via JSON Web Tokens (JWTs), which are stored in `httpOnly` cookies for better security against XSS attacks.
    -   Multi-Factor Authentication (MFA) using TOTP (Time-based One-Time Passwords) is **mandatory** for all users. The `speakeasy` library is used for this.

-   **Authorization:**
    -   A hierarchical RBAC model is enforced via middleware (`middleware/auth.js`).
    -   The roles are:
        -   `main-superadmin`: Can manage superadmins.
        -   `superadmin`: Can manage admins and all client configurations.
        -   `admin`: Can only view assigned clients and their log data.
    -   The middleware effectively protects API routes, ensuring that only users with the appropriate roles can access sensitive management functions.

## 3. Frontend Analysis

The frontend is a static single-page application (SPA) built with vanilla HTML, CSS, and JavaScript. It consumes the REST API provided by the backend to deliver a dynamic and interactive user experience.

### 3.1. Structure

-   **`index.html` & `main.js`:** This serves as the initial entry point. `main.js` immediately checks the user's authentication status and redirects them to either the login page or the dashboard, preventing unauthenticated access.
-   **`login.html` & `auth.js`:** This page provides the login interface. `auth.js` manages the entire authentication flow, including handling username/password submission, the mandatory MFA setup process (displaying QR codes and verifying TOTP codes), and subsequent logins using TOTP.
-   **`dashboard.html` & `dashboard.js`:** This is the core of the application.
    -   It features a highly dynamic, role-based UI. Different views and controls are rendered based on whether the user is an `admin`, `superadmin`, or `main-superadmin`.
    -   It displays a grid of "client cards," each representing a monitored client. These cards show real-time log statistics fetched periodically from the backend.
    -   It includes extensive management features, presented in modals, for adding, editing, and deleting clients and users.
    -   It features a news ticker at the bottom of the page, which fetches data from the backend's news scraping endpoint.

### 3.2. Frontend-Backend Interaction

The frontend communicates with the backend exclusively through the REST API. Key interactions include:

-   **Authentication:** Sending credentials to `/api/auth/login` and handling the MFA flow.
-   **Data Fetching:** Making `GET` requests to `/api/clients` to load the dashboard, `/api/clients/:id/logs` for real-time log counts, and `/api/news/scrape` for the news ticker.
-   **Data Management:** Sending `POST`, `PUT`, and `DELETE` requests to `/api/admin/*` endpoints to manage users and clients.

All authenticated API requests are sent with `credentials: 'include'` to ensure the JWT cookie is sent with each request, allowing the backend to verify the user's session.
