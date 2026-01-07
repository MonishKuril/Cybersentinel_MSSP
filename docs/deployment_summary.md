# MSSP Project Deployment Guide

This document provides instructions on how to use the `deploy.sh` script to set up, build, and run the MSSP project on a server.

## 1. Overview

The `deploy.sh` script is an all-in-one utility designed to automate the complete deployment process of the MSSP application. It handles:

-   Verifying system prerequisites (Node.js, npm).
-   Installing all backend and frontend dependencies.
-   Creating an optimized production build of the React frontend.
-   Initializing the database on the first run.
-   Starting and stopping the backend server as a background process.

## 2. Prerequisites

Before running the script, ensure your server has the following installed:

-   `node` (v14 or later)
-   `npm`

The script will check for these and exit if they are not found.

## 3. Making the Script Executable

Before you can run the script, you must give it execute permissions. On your Ubuntu server, run the following command from the project's root directory:

```bash
chmod +x deploy.sh
```

## 4. Available Commands

The script accepts several commands to manage the application lifecycle.

### `setup`

This command performs all the necessary setup and build steps without starting the server.

-   **Usage:** `./deploy.sh setup`
-   **Actions:**
    1.  Installs all `npm` dependencies for both the `frontend` and `backend`.
    2.  Runs the `npm run build` command for the frontend to create the production-ready `build` directory.
    3.  Checks if the database (`backend/mssp.db`) exists. If not, it runs the `npm run db:init` script to create and initialize it.

### `start`

This command starts the backend server as a background process. If this is the first time running the command and the project has not been built, it will automatically run the `setup` steps first.

-   **Usage:** `./deploy.sh start`
-   **Actions:**
    -   Checks if the server is already running.
    -   Starts the Node.js backend server using `nohup` to ensure it keeps running even if you close your terminal.
    -   Creates a `mssp_server.pid` file in the root directory to keep track of the process ID.
    -   Redirects server output to `mssp_server.log` and errors to `mssp_server_error.log`.

### `stop`

This command stops the running backend server.

-   **Usage:** `./deploy.sh stop`
-   **Actions:**
    -   Reads the process ID from the `mssp_server.pid` file.
    -   Sends a kill signal to the process to terminate it.
    -   Cleans up the `.pid` file.

### `restart`

This is a convenience command that stops and then immediately starts the server.

-   **Usage:** `./deploy.sh restart`
-   **Actions:**
    -   Executes the `stop` command.
    -   Waits for 2 seconds.
    -   Executes the `start` command.

### `status`

This command checks and reports the current status of the backend server.

-   **Usage:** `./deploy.sh status`
-   **Actions:**
    -   Checks if the process ID in `mssp_server.pid` corresponds to a running process.
    -   Reports whether the server is `RUNNING` or `STOPPED` and provides useful information like the PID and log file locations.
