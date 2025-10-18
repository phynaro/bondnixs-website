#!/bin/bash

# Container Health Check Script for Bondnixs Website
# This script checks the health of all containers and their connectivity

set -e

echo "🏥 Bondnixs Website Container Health Check"
echo "=========================================="
echo ""

# Function to check container status
check_container() {
    local container_name=$1
    local service_name=$2
    
    echo "🔍 Checking $service_name container..."
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name"; then
        local status=$(docker ps --format "{{.Status}}" --filter "name=$container_name")
        echo "✅ $service_name: $status"
        return 0
    else
        echo "❌ $service_name: Not running"
        return 1
    fi
}

# Function to check container logs for errors
check_logs() {
    local container_name=$1
    local service_name=$2
    
    echo "📋 Checking $service_name logs for errors..."
    
    local error_count=$(docker logs "$container_name" 2>&1 | grep -i "error\|failed\|exception" | wc -l)
    
    if [ "$error_count" -gt 0 ]; then
        echo "⚠️  Found $error_count potential errors in $service_name logs"
        echo "🔍 Recent errors:"
        docker logs "$container_name" 2>&1 | grep -i "error\|failed\|exception" | tail -3
    else
        echo "✅ No errors found in $service_name logs"
    fi
    echo ""
}

# Function to test connectivity
test_connectivity() {
    local service_name=$1
    local port=$2
    local path=${3:-"/"}
    
    echo "🌐 Testing $service_name connectivity on port $port..."
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path" | grep -q "200\|301\|302"; then
        echo "✅ $service_name is responding on port $port"
    else
        echo "❌ $service_name is not responding on port $port"
    fi
}

# Check all containers
echo "📦 Container Status Check"
echo "-------------------------"

check_container "bondnixs-website-frontend-1" "Frontend"
check_container "bondnixs-website-backend-1" "Backend"
check_container "bondnixs-website-nginx-1" "Nginx"
check_container "bondnixs-website-postgres-1" "PostgreSQL"
check_container "bondnixs-website-redis-1" "Redis"

echo ""
echo "📋 Log Analysis"
echo "---------------"

# Check logs for each container
for container in "bondnixs-website-frontend-1" "bondnixs-website-backend-1" "bondnixs-website-nginx-1"; do
    if docker ps --format "{{.Names}}" | grep -q "$container"; then
        check_logs "$container" "$(echo $container | cut -d'-' -f2)"
    fi
done

echo ""
echo "🌐 Connectivity Tests"
echo "--------------------"

# Test connectivity
test_connectivity "Frontend" "3000"
test_connectivity "Backend" "5000"
test_connectivity "Nginx" "80"
test_connectivity "Nginx" "443"

echo ""
echo "🔧 SSL Certificate Check"
echo "------------------------"

if [ -f "./ssl/fullchain.pem" ] && [ -f "./ssl/privkey.pem" ]; then
    echo "✅ SSL certificates found"
    echo "📋 Certificate details:"
    openssl x509 -in "./ssl/fullchain.pem" -text -noout | grep -E "(Subject:|Not Before|Not After)" 2>/dev/null || echo "⚠️  Could not read certificate details"
else
    echo "❌ SSL certificates missing"
    echo "💡 Run: ./scripts/setup-ssl.sh"
fi

echo ""
echo "📊 Docker System Info"
echo "--------------------"
echo "🐳 Docker version: $(docker --version)"
echo "📈 Disk usage: $(docker system df --format 'table {{.Type}}\t{{.TotalCount}}\t{{.Size}}' | tail -n +2)"
echo "🧠 Memory usage: $(docker stats --no-stream --format 'table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}' | tail -n +2)"

echo ""
echo "🎯 Recommendations"
echo "------------------"

# Check if containers are running
if ! docker ps --format "{{.Names}}" | grep -q "bondnixs-website-nginx-1"; then
    echo "🚨 Nginx container is not running. Start with: docker-compose up -d nginx"
fi

if ! docker ps --format "{{.Names}}" | grep -q "bondnixs-website-frontend-1"; then
    echo "🚨 Frontend container is not running. Start with: docker-compose up -d frontend"
fi

if ! docker ps --format "{{.Names}}" | grep -q "bondnixs-website-backend-1"; then
    echo "🚨 Backend container is not running. Start with: docker-compose up -d backend"
fi

if [ ! -f "./ssl/fullchain.pem" ] || [ ! -f "./ssl/privkey.pem" ]; then
    echo "🔐 SSL certificates are missing. Run: ./scripts/setup-ssl.sh"
fi

echo ""
echo "✅ Health check completed!"
