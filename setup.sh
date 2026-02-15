#!/bin/bash

# AZPIN-X Setup & Build Script
# Bu script projenin son halini çəkər və imajları Portainer üçün build edər.

echo "🚀 AZPIN-X Quraşdırma başlayır..."

# 1. Kodları yenilə
echo "📥 Kodlar yenilənir (git pull)..."
git pull origin main

# 2. Backend build
echo "📦 Backend imajı build olunur..."
docker build -t azpin-backend:latest -f Dockerfile.backend .

# 3. Frontend build
echo "📦 Frontend imajı build olunur..."
docker build -t azpin-frontend:latest -f Dockerfile.frontend .

echo ""
echo "✅ UĞURLU! İmajlar hazırdır."
echo "------------------------------------------------"
echo "İndi Portainer-ə daxil olun və Stack-i 'Update' edin."
echo "Qeyd: portainer-stack.yml daxilində pull_policy: never olduğu üçün"
echo "Portainer artıq birbaşa bu yerli imajları istifadə edəcək."
echo "------------------------------------------------"
