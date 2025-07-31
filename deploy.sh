#!/bin/bash
set -e

echo "ZeroLock Quick Deployment Script"
echo "==========================================="

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Show help information
show_help() {
    echo "ZeroLock Quick Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --backend-only        Deploy backend only"
    echo "  --frontend-only       Deploy frontend only"
    echo "  --identity-only       Deploy Internet Identity canister only"
    echo "  --force               Force redeploy"
    echo "  --help               Show this help information"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy all components"
    echo "  $0 --backend-only     # Deploy backend only"
    echo "  $0 --frontend-only    # Deploy frontend only"
    echo "  $0 --identity-only    # Deploy Internet Identity only"
    echo "  $0 --force            # Force redeploy all components"
}

# Parse command line arguments
BACKEND_ONLY=false
FRONTEND_ONLY=false
IDENTITY_ONLY=false
FORCE_DEPLOY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --identity-only)
            IDENTITY_ONLY=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown parameter '$1'${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check if DFX is running
if ! dfx ping > /dev/null 2>&1; then
    echo -e "${RED}Error: IC network not running, please run 'dfx start' first${NC}"
    exit 1
fi

# Build backend (if needed)
if [[ "$FRONTEND_ONLY" != "true" ]]; then
    echo -e "${BLUE}Building backend...${NC}"
    cargo build --target wasm32-unknown-unknown
fi

# Create canisters (if not exist)
if ! dfx canister id zerolock_backend > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating Canisters...${NC}"
    dfx canister create --all
fi

# Deploy backend
if [[ "$FRONTEND_ONLY" != "true" && "$IDENTITY_ONLY" != "true" ]]; then
    echo -e "${GREEN}Deploying backend Canister...${NC}"
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        dfx deploy zerolock_backend --mode reinstall
    else
        dfx deploy zerolock_backend
    fi
fi

# Deploy Internet Identity
if [[ "$IDENTITY_ONLY" == "true" ]] || [[ "$BACKEND_ONLY" != "true" && "$FRONTEND_ONLY" != "true" && "$IDENTITY_ONLY" != "true" ]]; then
    echo -e "${GREEN}Deploying Internet Identity Canister...${NC}"
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        dfx deploy internet_identity --mode reinstall
    else
        dfx deploy internet_identity
    fi
fi

# Deploy frontend
if [[ "$BACKEND_ONLY" != "true" && "$IDENTITY_ONLY" != "true" ]]; then
    echo -e "${GREEN}Deploying frontend Canister...${NC}"
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        dfx deploy zerolock_frontend --mode reinstall
    else
        dfx deploy zerolock_frontend
    fi
fi

# Show Canister IDs
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "==========================================="
echo -e "Canister IDs:"
if [[ "$FRONTEND_ONLY" != "true" ]]; then
    echo -e "  Backend: $(dfx canister id zerolock_backend)"
fi
if [[ "$BACKEND_ONLY" != "true" ]]; then
    echo -e "  Frontend: $(dfx canister id zerolock_frontend)"
fi
echo -e "==========================================="