#!/bin/bash

echo "🧪 GACP Platform - API Integration Testing"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_GATEWAY="http://localhost:3000"
AUTH_SERVICE="http://localhost:3001"
CERT_SERVICE="http://localhost:3002"

print_test() {
    echo -e "\n${BLUE}🧪 Testing: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Test health endpoints
print_test "Health Check Endpoints"

test_health() {
    local service_name=$1
    local url=$2
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response "$url/health")
    
    if [ "$response" = "200" ]; then
        print_pass "$service_name health check"
        cat /tmp/response | jq . 2>/dev/null || cat /tmp/response
    else
        print_fail "$service_name health check (HTTP $response)"
    fi
}

test_health "API Gateway" "$API_GATEWAY"
test_health "Auth Service" "$AUTH_SERVICE"
test_health "Certification Service" "$CERT_SERVICE"

# Test user registration
print_test "User Registration"

TEST_USER='{
  "email": "test@gacp.example.com",
  "password": "TestPassword123!",
  "firstName": "ทดสอบ",
  "lastName": "ระบบ",
  "phoneNumber": "0812345678",
  "organizationType": "farmer"
}'

response=$(curl -s -w "%{http_code}" -o /tmp/register_response \
  -H "Content-Type: application/json" \
  -d "$TEST_USER" \
  "$API_GATEWAY/api/auth/register")

if [ "$response" = "201" ] || [ "$response" = "409" ]; then
    if [ "$response" = "201" ]; then
        print_pass "User registration successful"
    else
        print_info "User already exists (expected for repeat tests)"
    fi
    cat /tmp/register_response | jq . 2>/dev/null || cat /tmp/register_response
else
    print_fail "User registration failed (HTTP $response)"
    cat /tmp/register_response
fi

# Test user login
print_test "User Login"

LOGIN_DATA='{
  "email": "test@gacp.example.com",
  "password": "TestPassword123!"
}'

response=$(curl -s -w "%{http_code}" -o /tmp/login_response \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA" \
  "$API_GATEWAY/api/auth/login")

if [ "$response" = "200" ]; then
    print_pass "User login successful"
    TOKEN=$(cat /tmp/login_response | jq -r '.token' 2>/dev/null)
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        print_info "JWT Token obtained: ${TOKEN:0:50}..."
        export AUTH_TOKEN="$TOKEN"
    else
        print_fail "No token in login response"
    fi
    cat /tmp/login_response | jq . 2>/dev/null || cat /tmp/login_response
else
    print_fail "User login failed (HTTP $response)"
    cat /tmp/login_response
fi

# Test protected endpoint
if [ -n "$AUTH_TOKEN" ]; then
    print_test "Protected Endpoint Access"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/profile_response \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$API_GATEWAY/api/users/profile")
    
    if [ "$response" = "200" ]; then
        print_pass "Protected endpoint access successful"
        cat /tmp/profile_response | jq . 2>/dev/null || cat /tmp/profile_response
    else
        print_fail "Protected endpoint access failed (HTTP $response)"
        cat /tmp/profile_response
    fi
    
    # Test certification service endpoints
    print_test "Certification Service - Applications List"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/applications_response \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$API_GATEWAY/api/certification/applications")
    
    if [ "$response" = "200" ]; then
        print_pass "Applications list endpoint successful"
        cat /tmp/applications_response | jq . 2>/dev/null || cat /tmp/applications_response
    else
        print_fail "Applications list endpoint failed (HTTP $response)"
        cat /tmp/applications_response
    fi
    
    # Test creating application
    print_test "Certification Service - Create Application"
    
    APPLICATION_DATA='{
      "applicantInfo": {
        "organizationName": "ฟาร์มทดสอบ",
        "ownerName": "ทดสอบ ระบบ",
        "contactEmail": "test@gacp.example.com",
        "contactPhone": "0812345678",
        "address": {
          "street": "123 ถนนทดสอบ",
          "district": "เขตทดสอบ",
          "province": "กรุงเทพฯ",
          "postalCode": "10100"
        }
      },
      "farmInfo": {
        "farmName": "ฟาร์มสมุนไพรทดสอบ",
        "farmArea": 5.5,
        "location": {
          "coordinates": [100.5018, 13.7563],
          "address": {
            "street": "123 ถนนทดสอบ",
            "district": "เขตทดสอบ",
            "province": "กรุงเทพฯ",
            "postalCode": "10100"
          }
        }
      },
      "cropInfo": {
        "crops": [{
          "scientificName": "Curcuma longa",
          "commonName": "ขมิ้นชัน",
          "variety": "พันธุ์ท้องถิ่น",
          "plantingArea": 3.0,
          "expectedYield": 1500,
          "harvestSeason": "เดือน 10-12",
          "usedFor": "medicine"
        }],
        "totalCropArea": 3.0
      }
    }'
    
    response=$(curl -s -w "%{http_code}" -o /tmp/create_app_response \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$APPLICATION_DATA" \
      "$API_GATEWAY/api/certification/applications")
    
    if [ "$response" = "201" ]; then
        print_pass "Application creation successful"
        cat /tmp/create_app_response | jq . 2>/dev/null || cat /tmp/create_app_response
    else
        print_fail "Application creation failed (HTTP $response)"
        cat /tmp/create_app_response
    fi
    
    # Test token verification
    print_test "Token Verification"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/verify_response \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$API_GATEWAY/api/auth/verify")
    
    if [ "$response" = "200" ]; then
        print_pass "Token verification successful"
        cat /tmp/verify_response | jq . 2>/dev/null || cat /tmp/verify_response
    else
        print_fail "Token verification failed (HTTP $response)"
        cat /tmp/verify_response
    fi
    
    # Test logout
    print_test "User Logout"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/logout_response \
      -X POST \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$API_GATEWAY/api/auth/logout")
    
    if [ "$response" = "200" ]; then
        print_pass "User logout successful"
        cat /tmp/logout_response | jq . 2>/dev/null || cat /tmp/logout_response
    else
        print_fail "User logout failed (HTTP $response)"
        cat /tmp/logout_response
    fi
else
    print_fail "Skipping protected endpoint tests - no auth token"
fi

# Test error handling
print_test "Error Handling"

# Test invalid login
response=$(curl -s -w "%{http_code}" -o /tmp/invalid_login_response \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid@example.com", "password": "wrongpassword"}' \
  "$API_GATEWAY/api/auth/login")

if [ "$response" = "401" ]; then
    print_pass "Invalid login properly rejected"
else
    print_fail "Invalid login should return 401"
fi

# Test invalid token
response=$(curl -s -w "%{http_code}" -o /tmp/invalid_token_response \
  -H "Authorization: Bearer invalid.token.here" \
  "$API_GATEWAY/api/users/profile")

if [ "$response" = "401" ]; then
    print_pass "Invalid token properly rejected"
else
    print_fail "Invalid token should return 401"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
print_info "Basic functionality tested ✅"
print_info "Authentication flow tested ✅"
print_info "Authorization tested ✅"
print_info "Error handling tested ✅"
print_info "Service communication tested ✅"

echo ""
print_info "🎉 Integration testing completed!"

# Cleanup
rm -f /tmp/*_response