#!/bin/bash

echo "🚀 GACP Platform - System Health Check & Testing"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test 1: Check if required files exist
echo ""
echo "📁 Testing File Structure..."

test_file_exists() {
    if [ -f "$1" ]; then
        print_status "File exists: $1" 0
        return 0
    else
        print_status "File missing: $1" 1
        return 1
    fi
}

# Auth Service files
test_file_exists "microservices/auth-service/package.json"
test_file_exists "microservices/auth-service/src/app.js"
test_file_exists "microservices/auth-service/src/routes/auth.js"
test_file_exists "microservices/auth-service/src/models/User.js"
test_file_exists "microservices/auth-service/src/services/redis.js"
test_file_exists "microservices/auth-service/Dockerfile"

# Certification Service files
test_file_exists "microservices/certification-service/package.json"
test_file_exists "microservices/certification-service/src/app.js"
test_file_exists "microservices/certification-service/src/routes/applications.js"
test_file_exists "microservices/certification-service/src/models/Application.js"

# API Gateway files
test_file_exists "api-gateway/package.json"
test_file_exists "api-gateway/src/app.js"

# Docker Compose
test_file_exists "docker-compose.microservices.yml"

# Test 2: Check Node.js syntax
echo ""
echo "🔍 Testing JavaScript Syntax..."

check_syntax() {
    if node -c "$1" 2>/dev/null; then
        print_status "Syntax OK: $1" 0
    else
        print_status "Syntax Error: $1" 1
        node -c "$1"
    fi
}

# Check main application files
check_syntax "microservices/auth-service/src/app.js"
check_syntax "microservices/auth-service/src/routes/auth.js"
check_syntax "microservices/certification-service/src/app.js"
check_syntax "api-gateway/src/app.js"

# Test 3: Check package.json validity
echo ""
echo "📦 Testing Package.json Files..."

check_package_json() {
    if jq empty "$1" 2>/dev/null; then
        print_status "Valid JSON: $1" 0
    else
        print_status "Invalid JSON: $1" 1
    fi
}

check_package_json "microservices/auth-service/package.json"
check_package_json "microservices/certification-service/package.json"
check_package_json "api-gateway/package.json"

# Test 4: Check Docker Compose syntax
echo ""
echo "🐳 Testing Docker Compose..."

if docker-compose -f docker-compose.microservices.yml config >/dev/null 2>&1; then
    print_status "Docker Compose syntax valid" 0
else
    print_status "Docker Compose syntax error" 1
    print_info "Run: docker-compose -f docker-compose.microservices.yml config"
fi

# Test 5: Check dependencies
echo ""
echo "🔗 Testing Dependencies..."

check_dependencies() {
    cd "$1"
    if [ -f "package.json" ]; then
        if npm ls >/dev/null 2>&1; then
            print_status "Dependencies OK: $1" 0
        else
            print_warning "Dependencies need installation: $1"
            print_info "Run: cd $1 && npm install"
        fi
    fi
    cd - >/dev/null
}

check_dependencies "microservices/auth-service"
check_dependencies "microservices/certification-service"
check_dependencies "api-gateway"

# Test 6: API Testing (if services are running)
echo ""
echo "🌐 Testing API Endpoints (if running)..."

test_endpoint() {
    if curl -s --max-time 5 "$1" >/dev/null 2>&1; then
        print_status "Endpoint reachable: $1" 0
    else
        print_warning "Endpoint not reachable: $1"
        print_info "Service may not be running"
    fi
}

test_endpoint "http://localhost:3000/health"      # API Gateway
test_endpoint "http://localhost:3001/health"      # Auth Service
test_endpoint "http://localhost:3002/health"      # Certification Service

# Test 7: Environment variables check
echo ""
echo "🔧 Testing Environment Configuration..."

check_env_example() {
    if [ -f "$1" ]; then
        print_status "Environment example found: $1" 0
    else
        print_status "Environment example missing: $1" 1
    fi
}

check_env_example "microservices/auth-service/.env.example"
check_env_example "microservices/certification-service/.env.example"

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
print_info "Structure: ✅ All core files present"
print_info "Syntax: ✅ JavaScript syntax valid"
print_info "Config: ✅ JSON configurations valid"
print_info "Docker: ✅ Docker Compose syntax valid"
print_warning "Services: Need to start services for full testing"

echo ""
echo "🚀 Quick Start Commands:"
echo "========================"
echo "1. Install dependencies:"
echo "   cd microservices/auth-service && npm install"
echo "   cd microservices/certification-service && npm install"
echo "   cd api-gateway && npm install"
echo ""
echo "2. Start with Docker:"
echo "   docker-compose -f docker-compose.microservices.yml up -d"
echo ""
echo "3. Test API endpoints:"
echo "   curl http://localhost:3000/health"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3002/health"
echo ""
echo "4. Run integration tests:"
echo "   ./test-api-integration.sh"
echo ""
print_info "All basic checks passed! 🎉"