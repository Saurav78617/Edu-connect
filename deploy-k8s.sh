#!/bin/bash

# EduConnect Kubernetes Deployment Script

echo "========================================="
echo "🚀 EduConnect Kubernetes Deployment"
echo "========================================="

# 1. Setup Namespace
echo "1️⃣  Creating namespace..."
kubectl create namespace educonnect --dry-run=client -o yaml | kubectl apply -f -

# 2. Update secrets in manifest
echo "2️⃣  Please update k8s-manifest.yaml with your secrets:"
echo "   - GEMINI_API_KEY"
echo "   - JWT_SECRET"
echo "   - POSTGRES_PASSWORD"
echo "   - EMAIL credentials"
echo "   - RAZORPAY keys"
echo "   - GOOGLE_CLIENT_ID"
read -p "Press Enter after updating secrets..."

# 3. Apply ConfigMap and Secrets
echo "3️⃣  Applying ConfigMaps and Secrets..."
kubectl apply -f k8s-manifest.yaml

# 4. Wait for PostgreSQL to be ready
echo "4️⃣  Waiting for PostgreSQL to start..."
kubectl wait --for=condition=ready pod -l app=postgres -n educonnect --timeout=300s

# 5. Apply migrations
echo "5️⃣  Running Prisma migrations..."
kubectl run prisma-migrate \
  --image=your-registry/educonnect:latest \
  --rm -i --restart=Never \
  -n educonnect \
  -- npx prisma db push --skip-generate

# 6. Apply main deployment
echo "6️⃣  Deploying EduConnect application..."
kubectl apply -f k8s-manifest.yaml

# 7. Check deployment status
echo "7️⃣  Checking deployment status..."
kubectl rollout status deployment/educonnect-deployment -n educonnect --timeout=5m
kubectl rollout status deployment/postgres-deployment -n educonnect --timeout=5m

# 8. Get service info
echo "8️⃣  Service Information:"
kubectl get svc -n educonnect

# 9. Get Ingress info
echo "9️⃣  Ingress Information:"
kubectl get ingress -n educonnect

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "📋 Useful Commands:"
echo "   View logs:          kubectl logs -f deployment/educonnect-deployment -n educonnect"
echo "   Scale app:          kubectl scale deployment educonnect-deployment -n educonnect --replicas=5"
echo "   Get pods:           kubectl get pods -n educonnect"
echo "   Describe pod:       kubectl describe pod <pod-name> -n educonnect"
echo "   Port forward:       kubectl port-forward svc/educonnect-service 3000:3000 -n educonnect"
echo "   Check HPA:          kubectl get hpa -n educonnect"
echo ""
