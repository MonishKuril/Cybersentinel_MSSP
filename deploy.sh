#!/bin/bash

# Development Deployment Script for MSSP Project
# This script automates the setup, build, and execution of the fullstack application for development.

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PID_FILE="$SCRIPT_DIR/mssp_server.pid"
LOG_FILE="$SCRIPT_DIR/mssp_server.log"
ERROR_LOG="$SCRIPT_DIR/mssp_server_error.log"

# --- Colors for beautiful output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- Helper Functions ---
print_message() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN} MSSP Development Deployer      ${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to get the server's IP address dynamically
get_server_ip() {
    # Try multiple methods to get the server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')  # Get first IP from hostname -I
    if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ] || [ "$SERVER_IP" = "::1" ]; then
        SERVER_IP=$(ip route get 1.1.1.1 | awk '{print $7; exit}')  # Get IP via route to external IP
    fi
    if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "127.0.0.1" ] || [ "$SERVER_IP" = "::1" ]; then
        SERVER_IP=$(curl -s ifconfig.me)  # Get public IP as fallback
    fi
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="localhost"  # Final fallback
    fi
    echo "$SERVER_IP"
}

is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

check_prerequisites() {
    if ! command -v node &> /dev/null; then
        print_message "❌ Node.js is not installed. Please install it to continue." $RED
        return 1
    fi
    if ! command -v npm &> /dev/null; then
        print_message "❌ npm is not installed. Please install it to continue." $RED
        return 1
    fi
    return 0
}

# --- Core Functions ---

setup_and_build() {
    print_message "▶️  Starting project setup and build..." $BLUE

    # 1. Install Backend Dependencies
    print_message "📦 Installing backend dependencies..." $YELLOW
    cd "$BACKEND_DIR"
    if ! npm install; then
        print_message "❌ Failed to install backend dependencies." $RED
        exit 1
    fi
    print_message "✅ Backend dependencies installed." $GREEN

    # 2. Install Frontend Dependencies
    print_message "📦 Installing frontend dependencies..." $YELLOW
    cd "$FRONTEND_DIR"
    if ! npm install; then
        print_message "❌ Failed to install frontend dependencies." $RED
        exit 1
    fi
    print_message "✅ Frontend dependencies installed." $GREEN

    # 3. Build Frontend
    print_message "🏗️  Building the React frontend..." $YELLOW
    if ! npm run build; then
        print_message "❌ Failed to build frontend." $RED
        exit 1
    fi
    print_message "✅ Frontend built successfully." $GREEN

    cd "$SCRIPT_DIR"

    # 4. Initialize Database (if it doesn't exist)
    if [ ! -f "$BACKEND_DIR/mssp.db" ]; then
        print_message "🗄️  Database not found. Initializing..." $YELLOW
        cd "$BACKEND_DIR"
        npm run db:init
        if [ $? -ne 0 ]; then
            print_message "❌ Failed to initialize database." $RED
            exit 1
        fi
        print_message "✅ Database initialized." $GREEN
        cd "$SCRIPT_DIR"
    else
        print_message "✅ Database already exists. Skipping initialization." $GREEN
    fi
}

start_server() {
    print_header
    print_message "🚀 Starting the MSSP development server..." $BLUE

    if is_running; then
        print_message "⚠️  Server is already running (PID: $(cat $PID_FILE))." $YELLOW
        return
    fi

    if ! check_prerequisites; then exit 1; fi

    # Run setup if build directory doesn't exist
    if [ ! -d "$FRONTEND_DIR/build" ]; then
        setup_and_build
    fi

    print_message "🔥 Firing up the backend server..." $YELLOW
    cd "$BACKEND_DIR"

    # Get the server IP dynamically
    SERVER_IP=$(get_server_ip)

    # Update the app.js file to use the dynamic IP instead of 0.0.0.0
    # First, backup the original file if not already backed up
    if [ ! -f "$BACKEND_DIR/app.js.backup" ]; then
        cp "$BACKEND_DIR/app.js" "$BACKEND_DIR/app.js.backup"
    fi

    # Keep listening on '0.0.0.0' to accept connections from any interface
    # But update the logger message to show the actual server IP

    # Update helmet configuration for development to prevent HTTPS enforcement
    # Replace the helmet configuration to disable security features that cause HTTPS issues

    # Start the server in the background
    nohup npm start > "$LOG_FILE" 2> "$ERROR_LOG" &

    BACKEND_PID=$!
    echo $BACKEND_PID > "$PID_FILE"

    sleep 3 # Give it a moment to start

    if is_running; then
        PORT=$(grep -E "^PORT=" ".env" | cut -d '=' -f2 | tr -d '[:space:]' || echo "7000")
        print_message "✅ Server started successfully!" $GREEN
        print_message "   - PID: $(cat $PID_FILE)" $GREEN
        print_message "   - Port: $PORT" $GREEN
        print_message "   - Access URL: https://$SERVER_IP:$PORT" $CYAN
        print_message "   - Development mode (with SSL)" $YELLOW
    else
        print_message "❌ Server failed to start. Check error logs:" $RED
        print_message "   - $ERROR_LOG" $RED
        tail -n 10 "$ERROR_LOG"
    fi
}

stop_server() {
    print_header
    print_message "🛑 Stopping the MSSP server..." $BLUE

    if ! is_running; then
        print_message "⚠️  Server is not running." $YELLOW
        return
    fi

    PID=$(cat "$PID_FILE")
    print_message "🔪 Killing process $PID..." $YELLOW
    kill $PID
    sleep 2

    if is_running; then
        print_message "⚠️  Process did not stop gracefully. Forcing kill..." $YELLOW
        kill -9 $PID
    fi

    # Restore the original app.js file if it was backed up

    rm -f "$PID_FILE"
    print_message "✅ Server stopped." $GREEN

    print_message "💡 Note: If experiencing HTTPS issues, clear browser cache or try a different browser." $YELLOW
}

show_status() {
    print_header
    if is_running; then
        PID=$(cat "$PID_FILE")
        PORT=$(grep -E "^PORT=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '[:space:]' || echo "7000")
        SERVER_IP=$(get_server_ip)
        print_message "✅ Server Status: RUNNING" $GREEN
        print_message "   - PID: $PID" $NC
        print_message "   - Port: $PORT" $NC
        print_message "   - IP: $SERVER_IP" $NC
        print_message "   - Access URL: https://$SERVER_IP:$PORT" $NC
        print_message "   - Log File: $LOG_FILE" $NC
        print_message "   - Error Log: $ERROR_LOG" $NC
        print_message "   - Development mode (with SSL)" $YELLOW
    else
        print_message "❌ Server Status: STOPPED" $RED
    fi
}

# Function to show development info
show_dev_info() {
    print_header
    SERVER_IP=$(get_server_ip)
    PORT=$(grep -E "^PORT=" "$BACKEND_DIR/.env" | cut -d '=' -f2 | tr -d '[:space:]' || echo "7000")
    print_message "🔧 Development Server Info:" $BLUE
    print_message "   - Server IP: $SERVER_IP" $NC
    print_message "   - Port: $PORT" $NC
    print_message "   - Access URL: https://$SERVER_IP:$PORT" $NC
    print_message "   - Mode: Development (with SSL)" $YELLOW
    print_message "   - Backend: Node.js/Express" $NC
    print_message "   - Frontend: React SPA" $NC
}

# --- Main Script Logic ---
case "$1" in
    setup)
        print_header
        check_prerequisites && setup_and_build
        ;;
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 2
        start_server
        ;;
    status)
        show_status
        ;;
    dev-info)
        show_dev_info
        ;;
    *)
        echo "Usage: $0 {setup|start|stop|restart|status|dev-info}"
        echo "  setup     : Install dependencies and build frontend"
        echo "  start     : Start the development server"
        echo "  stop      : Stop the server"
        echo "  restart   : Restart the server"
        echo "  status    : Show server status"
        echo "  dev-info  : Show development server information"
        exit 1
        ;;
esac

exit 0
