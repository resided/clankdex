#!/bin/bash

# Claudex + Clanker Deployment Script

set -e

echo "🎮 Claudex + Clanker Deployment"
echo "================================"
echo ""
echo "This deploys:"
echo "  1. ClaudexRegistry (tracks creatures)"
echo "  2. Backend with Clanker SDK"
echo "  3. Frontend miniapp"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required tools
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed.${NC}"; exit 1; }

echo -e "${BLUE}Select network:${NC}"
select network in "baseSepolia (testnet)" "base (mainnet)"; do
    case $network in
        "baseSepolia (testnet)") 
            export NETWORK="sepolia"
            export RPC_URL="https://sepolia.base.org"
            break
            ;;
        "base (mainnet)") 
            export NETWORK="mainnet"
            export RPC_URL="https://mainnet.base.org"
            break
            ;;
    esac
done

echo ""
echo -e "${YELLOW}Using network: $NETWORK${NC}"
echo ""

# Function to deploy contracts
deploy_contracts() {
    echo -e "${BLUE}Deploying ClaudexRegistry...${NC}"
    cd contracts
    
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Creating .env from example...${NC}"
        cp .env.example .env
    fi
    
    # Update .env with selected network
    if grep -q "BASE_RPC_URL" .env; then
        sed -i '' "s|BASE_RPC_URL=.*|BASE_RPC_URL=$RPC_URL|g" .env 2>/dev/null || sed -i "s|BASE_RPC_URL=.*|BASE_RPC_URL=$RPC_URL|g" .env
    fi
    
    echo -e "${YELLOW}Please ensure your PRIVATE_KEY is set in contracts/.env${NC}"
    read -p "Press enter to continue..."
    
    npm install
    npx hardhat compile
    
    echo "Deploying ClaudexRegistry..."
    npx hardhat run scripts/deploy-registry.js --network $([ "$NETWORK" = "mainnet" ] && echo "base" || echo "baseSepolia")
    
    echo -e "${GREEN}Contracts deployed!${NC}"
    echo -e "${YELLOW}Copy the registry address to your frontend .env${NC}"
    cd ..
}

# Function to setup backend
setup_backend() {
    echo -e "${BLUE}Setting up backend...${NC}"
    cd backend
    
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Creating .env from example...${NC}"
        cp .env.example .env
    fi
    
    # Update backend .env
    sed -i '' "s|NETWORK=.*|NETWORK=$NETWORK|g" .env 2>/dev/null || sed -i "s|NETWORK=.*|NETWORK=$NETWORK|g" .env
    sed -i '' "s|RPC_URL=.*|RPC_URL=$RPC_URL|g" .env 2>/dev/null || sed -i "s|RPC_URL=.*|RPC_URL=$RPC_URL|g" .env
    
    echo -e "${YELLOW}Please edit backend/.env with:${NC}"
    echo "  - DEPLOYER_PRIVATE_KEY"
    echo "  - PINATA_JWT (for IPFS uploads)"
    echo "  - CLADEX_ADMIN (your admin address)"
    read -p "Press enter to continue..."
    
    npm install
    
    echo -e "${GREEN}Backend ready!${NC}"
    echo ""
    echo "To start the backend:"
    echo "  cd backend && npm run dev"
    cd ..
}

# Function to setup frontend
setup_frontend() {
    echo -e "${BLUE}Setting up frontend...${NC}"
    cd frontend
    
    if [ ! -f .env.local ]; then
        echo -e "${YELLOW}Creating .env.local from example...${NC}"
        cp .env.example .env.local
    fi
    
    echo -e "${YELLOW}Please edit frontend/.env.local with:${NC}"
    echo "  - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
    echo "  - NEXT_PUBLIC_REGISTRY_ADDRESS (from contract deployment)"
    read -p "Press enter to continue..."
    
    npm install
    
    echo -e "${GREEN}Frontend ready!${NC}"
    echo ""
    echo "To start the frontend:"
    echo "  cd frontend && npm run dev"
    cd ..
}

# Main menu
echo ""
echo "What would you like to do?"
select option in "Full Deploy (All)" "Deploy Contracts Only" "Setup Backend Only" "Setup Frontend Only" "Exit"; do
    case $option in
        "Full Deploy (All)")
            deploy_contracts
            setup_backend
            setup_frontend
            break
            ;;
        "Deploy Contracts Only")
            deploy_contracts
            break
            ;;
        "Setup Backend Only")
            setup_backend
            break
            ;;
        "Setup Frontend Only")
            setup_frontend
            break
            ;;
        "Exit")
            exit 0
            ;;
    esac
done

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Features:"
echo "  • Wallet DNA analysis"
echo "  • Pixel creature generation"
echo "  • Clanker bonding curve launch"
echo "  • 70% creator rewards"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Happy creature hunting! 🎮🚀"
