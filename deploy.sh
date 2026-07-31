#!/bin/bash

# Cybersentinel MSSP - Unified Deployment Script
# Automates: Repo setup, Dependencies, SSL, Database, and Server Lifecycle.

# --- Configuration ---
REPO_URL="https://github.com/MonishKuril/Cybersentinel_MSSP.git"
REPO_DIR="Cybersentinel_MSSP"
SERVER_PORT=7000
FRONTEND_DEV_PORT=3000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# --- Helpers ---
print_msg() { 
    echo -e "${2:-}${1}${NC}" 
}

print_header() { 
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}   Cybersentinel MSSP Manager            ${NC}"
    echo -e "${CYAN}=========================================${NC}"
}

# --- Core Logic ---

# 1. Environment Check & Navigation
ensure_env() {
    # Am I inside the project?
    if [ -d "backend" ] && [ -d "frontend" ]; then
        print_msg "✅ Detected project root." $GREEN
        PROJECT_ROOT="."
    elif [ -d "$REPO_DIR" ]; then
        print_msg "📂 Found project directory: $REPO_DIR" $YELLOW
        PROJECT_ROOT="./$REPO_DIR"
    else
        print_msg "⬇️  Cloning repository..." $BLUE
        git clone "$REPO_URL"
        if [ $? -ne 0 ]; then 
            print_msg "❌ Clone failed." $RED
            exit 1
        fi
        PROJECT_ROOT="./$REPO_DIR"
    fi
    
    cd "$PROJECT_ROOT" || exit 1
    
    # Define paths relative to valid root
    BACKEND_DIR="./backend"
    FRONTEND_DIR="./frontend"
    PID_FILE="mssp_server.pid"
    LOG_FILE="mssp_server.log"
    ERR_FILE="mssp_server_error.log"
}

# 2. SSL Generation
generate_ssl() {
    print_msg "🔐 Checking SSL Configuration..." $BLUE
    SSL_DIR="$BACKEND_DIR/ssl"
    mkdir -p "$SSL_DIR"
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        print_msg "⚠️  SSL Certificates missing. Generating self-signed certs..." $YELLOW
        openssl req -x509 -newkey rsa:4096 -keyout "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Cybersentinel/OU=Security/CN=localhost" 2>/dev/null
        print_msg "✅ SSL Certificates generated in $SSL_DIR" $GREEN
    else
        print_msg "✅ SSL Certificates present." $GREEN
    fi
}

# 3. Port Management
kill_port() {
    PORT=$1
    # Try finding PID using lsof
    PID=$(lsof -t -i:$PORT 2>/dev/null)
    
    # If lsof fails/returns empty, try fuser
    if [ -z "$PID" ] && command -v fuser &> /dev/null; then
        PID=$(fuser $PORT/tcp 2>/dev/null)
    fi

    if [ -n "$PID" ]; then
        print_msg "🔪 Killing process $PID on port $PORT..." $YELLOW
        kill -9 $PID
        sleep 1
    fi
}

# 4. Installation & Build
install_and_build() {
    print_msg "📦 Installing Dependencies & Building..." $BLUE
    
    # Backend
    print_msg "   - Backend dependencies..." $NC
    cd "$BACKEND_DIR" && npm install >/dev/null 2>&1
    if [ $? -ne 0 ]; then 
        print_msg "❌ Backend install failed" $RED
        exit 1
    fi
    
    # Database Setup (idempotent - safe to run on every install/redeploy,
    # so schema changes reach existing installs too, not just brand-new ones)
    print_msg "   - Applying database schema..." $NC
    npm run db:setup

    # SIEM SSO signing key (idempotent - generates once, never rotates an
    # existing key on redeploy; prints the public key to hand to SIEM operators)
    print_msg "   - Configuring SIEM SSO keys..." $NC
    node scripts/generate-sso-keypair.js
    cd - >/dev/null

    # Frontend
    print_msg "   - Frontend dependencies..." $NC
    cd "$FRONTEND_DIR" && npm install >/dev/null 2>&1
    if [ $? -ne 0 ]; then 
        print_msg "❌ Frontend install failed" $RED
        exit 1
    fi
    
    print_msg "   - Building Frontend (React)..." $NC
    npm run build >/dev/null 2>&1
    if [ $? -ne 0 ]; then 
        print_msg "❌ Frontend build failed" $RED
        exit 1
    fi
    cd - >/dev/null
    
    print_msg "✅ Build Complete." $GREEN
}

# 5. Server Control
start_server() {
    print_header
    ensure_env
    
    # Clean ports
    kill_port $SERVER_PORT
    kill_port $FRONTEND_DEV_PORT # Cleanup dev port just in case

    print_msg "🚀 Starting Server..." $BLUE
    cd "$BACKEND_DIR"
    
    # Start in background
    nohup npm start > "../$LOG_FILE" 2> "../$ERR_FILE" &
    PID=$!
    cd - >/dev/null
    
    echo $PID > "$PID_FILE"
    sleep 3
    
    if ps -p $PID > /dev/null; then
        IP=$(hostname -I | awk '{print $1}')
        print_msg "✅ Server is RUNNING" $GREEN
        print_msg "   - PID:  $PID" $NC
        print_msg "   - URL:  https://$IP:$SERVER_PORT" $CYAN
        print_msg "   - Logs: $LOG_FILE" $NC
    else
        print_msg "❌ Server failed to start. Check $ERR_FILE" $RED
        cat "$ERR_FILE"
    fi
}

stop_server() {
    print_header
    ensure_env
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        print_msg "🛑 Stopping server (PID: $PID)..." $YELLOW
        kill -9 $PID 2>/dev/null
        rm "$PID_FILE"
        print_msg "✅ Stopped." $GREEN
    else
        print_msg "⚠️  No PID file found. Checking ports..." $YELLOW
        kill_port $SERVER_PORT
    fi
}

status_server() {
    print_header
    ensure_env
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null; then
            print_msg "✅ Server is RUNNING (PID: $PID)" $GREEN
        else
            print_msg "❌ PID file exists but process is dead." $RED
        fi
    else
        print_msg "⚪ Server is STOPPED" $NC
    fi
}

# --- CLI Router ---
case "$1" in
    install)
        print_header
        ensure_env
        generate_ssl
        install_and_build
        ;;
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    status)
        status_server
        ;;
    *)
        # Default behavior: Install/Verify -> Start
        print_header
        ensure_env
        generate_ssl
        install_and_build
        start_server
        ;;
esac

exit 0
