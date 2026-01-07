# Deployment Guide for MSSP Application using `deploy.sh`

This guide provides instructions for deploying and managing the MSSP application on a fresh Ubuntu server using the provided `deploy.sh` script.

**IMPORTANT SECURITY WARNING:**
The `deploy.sh` script is configured to install Node.js from an **insecure HTTP source** and bypasses GPG signature verification as per your request. This is **highly insecure** and should **NEVER** be used in a production environment where security is a concern. It exposes your system to potential man-in-the-middle attacks and software tampering. Use at your own risk.

## Commands Overview

The `deploy.sh` script provides several commands to manage the application lifecycle:

*   `sudo ./deploy.sh install`: **(For new servers)** Installs all system dependencies (Nginx, Node.js, PM2), sets up the project, and starts the application. This is a one-time command.
*   `./deploy.sh setup`: Installs project dependencies (`npm install`) for both frontend and backend and builds the frontend.
*   `sudo ./deploy.sh start`: Starts the backend server with PM2 and ensures Nginx is configured and running.
*   `sudo ./deploy.sh stop`: Stops the backend server managed by PM2.
*   `sudo ./deploy.sh restart`: Restarts the backend server.
*   `sudo ./deploy.sh status`: Shows the status of the backend server in PM2.
*   `sudo ./deploy.sh logs`: Displays live logs from the backend server.

---

## 1. First-Time Deployment on a New Server

Follow these steps on your fresh Ubuntu server after cloning the repository.

1.  **Navigate to the project directory:**
    ```bash
    cd /path/to/your/MSSP/project
    ```

2.  **Make the `deploy.sh` script executable:**
    ```bash
    chmod +x deploy.sh
    ```

3.  **Run the `install` command:**
    This single command will perform all necessary actions to get your application running from scratch.
    ```bash
    sudo ./deploy.sh install
    ```

After the script finishes, your application will be live. You can access it by navigating to your server's IP address in a web browser.

---

## 2. Managing the Application

Once the initial installation is complete, you can manage the application using the following commands.

#### Checking Status
To see if the backend process (`mssp-backend`) is running, along with its CPU and memory usage:
```bash
sudo ./deploy.sh status
```

#### Viewing Logs
To view real-time logs from the backend application, which is essential for debugging:
```bash
sudo ./deploy.sh logs
```
(Press `Ctrl+C` to exit the log view).

#### Restarting the Application
If you've made changes to the backend code, you'll need to restart it:
```bash
sudo ./deploy.sh restart
```
*Note: If you only change frontend code, you just need to run `./deploy.sh setup` again to rebuild the frontend, followed by `sudo ./deploy.sh restart` to be safe, although just clearing your browser cache might work.*

#### Stopping the Application
To stop the backend process completely:
```bash
sudo ./deploy.sh stop
```

---

## 3. Troubleshooting

*   **"Permission denied" when running `./deploy.sh`**: Ensure you've made the script executable (`chmod +x deploy.sh`). Note that commands like `install`, `start`, `stop`, and `restart` require `sudo`.
*   **Application not accessible**:
    *   Check the app status with `sudo ./deploy.sh status` to ensure `mssp-backend` is `online`.
    *   Check Nginx status with `sudo systemctl status nginx`.
    *   Verify your server's firewall (e.g., `ufw`) allows traffic on port 80 (`sudo ufw allow 'Nginx HTTP'`).
    *   Check backend error logs with `sudo ./deploy.sh logs`.
    *   Check Nginx error logs at `/var/log/nginx/error.log`.