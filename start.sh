#!/bin/bash
set -e

# Global variables
FORCE_DEPLOY=false
SKIP_FRONTEND=false

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force-deploy|-f)
                FORCE_DEPLOY=true
                shift
                ;;
            --skip-frontend|-s)
                SKIP_FRONTEND=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown parameter: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help information
show_help() {
    echo "ZeroLock Project Startup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -f, --force-deploy    Force redeploy all canisters"
    echo "  -s, --skip-frontend   Skip frontend development server startup"
    echo "  -h, --help           Show this help information"
    echo ""
    echo "Examples:"
    echo "  $0                    # Normal startup (smart deployment)"
    echo "  $0 --force-deploy    # Force redeploy all components"
    echo "  $0 --skip-frontend   # Deploy only, don't start frontend server"
}

echo "Starting ZeroLock project..."

# Check required tools
check_requirements() {
    echo -e " Checking environment requirements..."
    
    if ! command -v dfx &> /dev/null; then
        echo -e " DFX not installed, please install DFX SDK first"
        exit 1
    fi
    
    if ! command -v cargo &> /dev/null; then
        echo -e " Rust not installed, please install Rust first"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e " Node.js not installed, please install Node.js first"
        exit 1
    fi
    
    echo -e " Environment check passed"
}

# Install dependencies
install_dependencies() {
    echo -e " Installing frontend dependencies..."
    
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "Frontend dependencies not installed, installing..."
        cd frontend
        npm install
        cd ..
        echo -e " Frontend dependencies installed successfully"
    else
        echo -e " Frontend dependencies already exist"
    fi
}

# Build backend
build_backend() {
    echo -e " Building backend..."
    cargo build --target wasm32-unknown-unknown 
    echo -e " Backend build completed"
}

# Start IC network
start_ic_network() {
    echo -e " Checking Internet Computer local network..."
    
    if ! dfx ping > /dev/null 2>&1; then
        echo -e "IC network not running, starting..."
        dfx start --background
        
        # Wait for network startup
        echo -e " Waiting for network startup..."
        for i in {1..30}; do
            if dfx ping > /dev/null 2>&1; then
                echo -e " IC network started successfully"
                break
            fi
            sleep 1
            echo -n "."
        done
        
        if ! dfx ping > /dev/null 2>&1; then
            echo -e " IC network startup failed"
            exit 1
        fi
    else
        echo -e " IC network is already running"
    fi
}

# Check if backend deployment is needed
check_backend_changes() {
    # If force deploy, directly return needs deployment
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        return 0
    fi
    
    # Check if backend canister exists
    if ! dfx canister status zerolock_backend > /dev/null 2>&1; then
        return 0  # Needs deployment
    fi
    
    # Check if source code has changes
    local wasm_file="target/wasm32-unknown-unknown/debug/zerolock.wasm"
    if [[ ! -f "$wasm_file" ]]; then
        return 0  # wasm file doesn't exist, needs deployment
    fi
    
    # Check if files in src directory are newer than wasm file
    if find src/ -name "*.rs" -newer "$wasm_file" | grep -q .; then
        return 0  # New source code changes detected
    fi
    
    # Check if Cargo.toml has changes
    if [[ "Cargo.toml" -nt "$wasm_file" ]]; then
        return 0  # Dependency configuration has changes
    fi
    
    return 1  # No deployment needed
}

# Check if frontend deployment is needed
check_frontend_changes() {
    # 如果强制部署，直接返回需要部署
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        return 0
    fi
    
    # Check if frontend canister exists
    if ! dfx canister status zerolock_frontend > /dev/null 2>&1; then
        return 0  # 需要部署
    fi
    
    # Check if frontend source code has changes (simple check, can be optimized as needed)
    local dist_dir="frontend/dist"
    if [[ ! -d "$dist_dir" ]]; then
        return 0  # dist directory doesn't exist, needs deployment
    fi
    
    # Check if frontend source code is newer than dist directory
    if find frontend/src/ -name "*" -newer "$dist_dir" | grep -q .; then
        return 0  # New frontend code changes detected
    fi
    
    return 1  # No deployment needed
}

# Smart deploy Canisters
deploy_canisters() {
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        echo -e " Force deploying all Canisters..."
    else
        echo -e " Smart deploying Canisters (checking code changes)..."
    fi
    
    # Check if canisters need to be created
    if ! dfx canister id zerolock_backend > /dev/null 2>&1; then
        echo -e "Creating Canisters..."
        dfx canister create --all
    fi
    
    # Smart deploy backend
    if check_backend_changes; then
        if [[ "$FORCE_DEPLOY" == "true" ]]; then
            echo -e " [Force Mode] Deploying backend Canister..."
        else
            echo -e " [Change Detection] Backend code changes detected, deploying backend Canister..."
        fi
        dfx deploy zerolock_backend
    else
        echo -e " [Skip] No backend code changes, skipping deployment"
    fi
    
    # Smart deploy frontend
    if check_frontend_changes; then
        if [[ "$FORCE_DEPLOY" == "true" ]]; then
            echo -e " [Force Mode] Deploying frontend Canister..."
        else
            echo -e " [Change Detection] Frontend code changes detected, deploying frontend Canister..."
        fi
        dfx deploy zerolock_frontend
    else
        echo -e " [Skip] No frontend code changes, skipping deployment"
    fi
    
    # Deploy Internet Identity (if not exists)
    if ! dfx canister id internet_identity > /dev/null 2>&1; then
        echo -e "Deploying Internet Identity..."
        dfx deploy internet_identity || {
            echo -e "Internet Identity deployment failed, using default configuration"
        }
    else
        echo -e " [Skip] Internet Identity already exists"
    fi
    
    echo -e " Canisters deployment completed"
}

# Update environment variables
update_env_vars() {
    echo -e "Updating environment variables..."
    
    # Get canister IDs
    BACKEND_ID=$(dfx canister id zerolock_backend)
    FRONTEND_ID=$(dfx canister id zerolock_frontend)
    
    # Try to get Internet Identity ID
    if dfx canister id internet_identity > /dev/null 2>&1; then
        II_ID=$(dfx canister id internet_identity)
    else
        II_ID="umunu-kh777-77774-qaaca-cai"  # Use current configured ID
    fi
    
    # Create environment variables file
    cat > frontend/.env << EOF
# ZeroLock Frontend Environment Variables

# DFX Network Configuration
VITE_DFX_NETWORK=local
VITE_IC_HOST=http://localhost:4943

# Internet Identity Configuration
VITE_INTERNET_IDENTITY_CANISTER_ID=${II_ID}
VITE_INTERNET_IDENTITY_URL=http://localhost:4943/?canisterId=${II_ID}

# Backend Canister Configuration
VITE_ZEROLOCK_BACKEND_CANISTER_ID=${BACKEND_ID}

# App Configuration
VITE_APP_NAME=ZeroLock
VITE_APP_VERSION=1.0.0
EOF
    
    echo -e " Environment variables updated successfully"
    echo -e " Canister IDs:"
    echo -e "   Backend: ${BACKEND_ID}"
    echo -e "   Frontend: ${FRONTEND_ID}"
    echo -e "   Internet Identity: ${II_ID}"
}

# Start frontend development server
start_frontend() {
    echo -e " Starting frontend development server..."
    
    cd frontend
    
    # Check if port is occupied
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "Port 3000 is occupied, trying to use another port..."
        npm run dev -- --port 3001
    else
        npm run dev
    fi
}

# Main function
main() {
    # Parse command line arguments
    parse_args "$@"
    
    echo -e " ZeroLock Project Startup Script"
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        echo -e " Mode: Force redeploy"
    else
        echo -e " Mode: Smart deployment (deploy only when code changes)"
    fi
    echo -e "==========================================="
    
    check_requirements
    install_dependencies
    build_backend
    start_ic_network
    deploy_canisters
    update_env_vars
    
    echo -e " Project startup preparation completed!"
    echo -e "==========================================="
    
    if [[ "$SKIP_FRONTEND" == "true" ]]; then
        echo -e " Skipping frontend development server startup"
        echo -e " Tip: To manually start frontend, run: cd frontend && npm run dev"
    else
        echo -e "Starting frontend development server..."
        echo -e " Tip: Press Ctrl+C to stop the server"
        echo -e "==========================================="
        start_frontend
    fi
}

# Error handling
trap 'echo -e " Error occurred during startup process"; exit 1' ERR

# Run main function
main "$@"
