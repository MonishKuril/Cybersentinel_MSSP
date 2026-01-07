# Docker & Docker Compose Deployment Guide

This guide provides instructions for deploying the CyberSentinel MSSP Dashboard using Docker and Docker Compose. This is the recommended method for a consistent, portable, and scalable production environment.

## 1. Prerequisites

Before you begin, ensure your server has the following installed:
- **Docker:** [Get Docker Engine](https://docs.docker.com/engine/install/ubuntu/)
- **Docker Compose:** [Install Docker Compose](https://docs.docker.com/compose/install/)

Verify the installations:
```bash
docker --version
docker-compose --version
```

## 2. Initial Setup

### 2.1. Clone the Repository
If you haven't already, clone the project repository to your server.
```bash
git clone https://github.com/your-username/mssp-dashboard.git
cd mssp-dashboard
```
*(Replace the URL with your actual repository URL.)*

### 2.2. Configure Backend Environment
The backend service requires an environment file to store secrets.
Create a `.env` file in the `backend` directory by copying the example file.
```bash
cp backend/.env.example backend/.env
```
Edit the file and provide strong, unique values for the secrets (`JWT_SECRET`, `SESSION_SECRET`, etc.).
```bash
nano backend/.env
```

## 3. Database Initialization

The database and the main superadministrator account must be created before starting the application for the first time. Docker Compose makes this easy to do with a one-off command.

Run the interactive database initialization script:
```bash
docker-compose run --rm backend npm run db:init
```

**Explanation:**
- `docker-compose run`: Executes a one-time command on a service.
- `--rm`: Removes the container after the command completes, keeping things clean.
- `backend`: The name of the service to run the command in.
- `npm run db:init`: The command to execute inside the `backend` container.

Follow the interactive prompts to set the username and password for the main superadmin.

## 4. Application Deployment

Once the database is initialized, you can bring the entire application online.

### 4.1. Build and Start Services
From the root of the project directory, run the following command:
```bash
docker-compose up --build -d
```

**Explanation:**
- `up`: Builds, (re)creates, starts, and attaches to containers for a service.
- `--build`: Forces Docker to build the images before starting the containers. This is important on the first run or after you've made changes to the `Dockerfile` or source code.
- `-d` (Detached mode): Runs containers in the background and prints new container names.

### 4.2. Check Application Status
To see the running services, use the `ps` command:
```bash
docker-compose ps
```
You should see both the `mssp_backend` and `mssp_frontend` services with a status of `Up` or `running`.

Your CyberSentinel MSSP Dashboard is now running! You can access it by navigating to your server's IP address or domain name in a web browser.

## 5. Managing the Application

Here are the common commands for managing your running application.

### View Logs
To view the logs from all running services in real-time:
```bash
docker-compose logs -f
```
To view the logs for a specific service (e.g., the backend):
```bash
docker-compose logs -f backend
```

### Stop the Application
To stop all running services:
```bash
docker-compose down
```
This will stop and remove the containers and the network created by `docker-compose up`. Your database file (`backend/mssp.db`) will persist because it is mapped to a volume on your host machine.

### Restart Services
To restart your application:
```bash
docker-compose restart
```

---
This Docker-based workflow simplifies deployment and ensures that your application runs in a predictable and isolated environment.
