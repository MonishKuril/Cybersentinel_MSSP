# MSSP Project Setup Guide

This guide will walk you through the steps to set up and run the MSSP project on your local machine.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v14 or later)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)

## 1. Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone <repository-url>
cd mssp-project
```

## 2. Backend Setup

The backend is a Node.js/Express server that uses a SQLite database.

### 2.1. Install Dependencies

Navigate to the `backend` directory and install the required npm packages:

```bash
cd backend
npm install
```

### 2.2. Configure Environment Variables

Create a `.env` file in the `backend` directory. This file will store your application's secrets and configuration.

```
PORT=7000
JWT_SECRET=your_jwt_secret
MAIN_SUPERADMIN_USERNAME=mainadmin
MAIN_SUPERADMIN_PASSWORD=your_super_password
```

Replace `your_jwt_secret` and `your_super_password` with strong, unique values.

### 2.3. Initialize the Database

Run the following command to create the SQLite database file (`mssp.db`) and set up the necessary tables:

```bash
npm run db:init
```

### 2.4. (Optional) Migrate Old Data

If you have existing data in the `config` directory from a previous version of the application, you can migrate it to the new database with this command:

```bash
npm run db:migrate
```

### 2.5. Start the Backend Server

You can start the backend server in development mode (which will automatically restart on file changes) or production mode.

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The backend server should now be running on `http://localhost:7000`.

## 3. Frontend Setup

The frontend is a React application.

### 3.1. Install Dependencies

Navigate to the `frontend` directory and install the required npm packages:

```bash
cd ../frontend
npm install
```

### 3.2. Start the Frontend Development Server

Run the following command to start the React development server:

```bash
npm start
```

The frontend application should now be running on `http://localhost:3000` and will automatically open in your default browser. The application is configured to proxy API requests to the backend server, so you should be able to log in and use the application.

## 4. Building for Production

To create a production-ready build of the frontend, run the following command in the `frontend` directory:

```bash
npm run build
```

This will create a `build` directory with the optimized, static files for your application. The backend server is already configured to serve these files, so if you want to run the application in a production-like environment, you would:

1.  Build the frontend: `cd frontend && npm run build`
2.  Start the backend: `cd ../backend && npm start`
3.  Access the application at `http://localhost:7000`.
