#!/bin/bash

# AZPIN-X Setup & Build Script
# Bu script projenin son halini çəkər və imajları Portainer üçün build edər.

echo "🚀 AZPIN-X Quraşdırma başlayır..."

# 1. Kodları yenilə
echo "📥 Kodlar yenilənir (git pull)..."
git pull origin main

# 2. Backend build
echo "📦 Backend imajı build olunur (Force Rebuild)..."
docker build --no-cache -t azpin-backend:latest -f Dockerfile.backend .

# 3. Frontend build
echo "📦 Frontend imajı build olunur (Force Rebuild)..."
docker build --no-cache -t azpin-frontend:latest -f Dockerfile.frontend .

echo ""
echo "✅ UĞURLU! İmajlar qəti şəkildə yeniləndi."
echo "------------------------------------------------"
echo "İndi Portainer-ə daxil olun:"
echo "1. Stack bölməsində 'Update the stack' seçin."
echo "2. 'Re-create containers' (və ya 'Pull latest image') toggle-ını mütləq AÇIN."
echo "3. 'Update' düyməsinə basın."
echo "------------------------------------------------"
