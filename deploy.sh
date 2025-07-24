#!/bin/bash
set -e

echo "ZeroLock 快速部署脚本"
echo "==========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "ZeroLock 快速部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --backend-only        仅部署后端"
    echo "  --frontend-only       仅部署前端"
    echo "  --identity-only       仅部署 Internet Identity canister"
    echo "  --force               强制重新部署"
    echo "  --help               显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 部署所有组件"
    echo "  $0 --backend-only     # 仅部署后端"
    echo "  $0 --frontend-only    # 仅部署前端"
    echo "  $0 --identity-only    # 仅部署 Internet Identity"
    echo "  $0 --force            # 强制重新部署所有组件"
}

# 解析命令行参数
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
            echo -e "${RED}错误: 未知参数 '$1'${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 检查 DFX 是否运行
if ! dfx ping > /dev/null 2>&1; then
    echo -e "${RED}错误: IC 网络未运行，请先运行 'dfx start'${NC}"
    exit 1
fi

# 构建后端（如果需要）
if [[ "$FRONTEND_ONLY" != "true" ]]; then
    echo -e "${BLUE}构建后端...${NC}"
    cargo build --target wasm32-unknown-unknown
fi

# 创建 canisters（如果不存在）
if ! dfx canister id zerolock_backend > /dev/null 2>&1; then
    echo -e "${YELLOW}创建 Canisters...${NC}"
    dfx canister create --all
fi

# 部署后端
if [[ "$FRONTEND_ONLY" != "true" && "$IDENTITY_ONLY" != "true" ]]; then
    echo -e "${GREEN}部署后端 Canister...${NC}"
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        dfx deploy zerolock_backend --mode reinstall
    else
        dfx deploy zerolock_backend
    fi
fi

# 部署 Internet Identity
if [[ "$IDENTITY_ONLY" == "true" ]] || [[ "$BACKEND_ONLY" != "true" && "$FRONTEND_ONLY" != "true" && "$IDENTITY_ONLY" != "true" ]]; then
    echo -e "${GREEN}部署 Internet Identity Canister...${NC}"
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        dfx deploy internet_identity --mode reinstall
    else
        dfx deploy internet_identity
    fi
fi

# 部署前端
if [[ "$BACKEND_ONLY" != "true" && "$IDENTITY_ONLY" != "true" ]]; then
    echo -e "${GREEN}部署前端 Canister...${NC}"
    if [[ "$FORCE_DEPLOY" == "true" ]]; then
        dfx deploy zerolock_frontend --mode reinstall
    else
        dfx deploy zerolock_frontend
    fi
fi

# 显示 Canister IDs
echo -e "${GREEN}✅ 部署完成!${NC}"
echo -e "==========================================="
echo -e "Canister IDs:"
if [[ "$FRONTEND_ONLY" != "true" ]]; then
    echo -e "  后端: $(dfx canister id zerolock_backend)"
fi
if [[ "$BACKEND_ONLY" != "true" ]]; then
    echo -e "  前端: $(dfx canister id zerolock_frontend)"
fi
echo -e "==========================================="