# EduConnect + Kubernetes: Complete Guide

## 📊 Architecture Comparison

### Current Setup (Docker Compose)
```
Single Server (localhost:3000)
├─ React Frontend (Vite)
├─ Express Backend
├─ SQLite Database (file-based)
└─ Socket.io (real-time)

Problem: ❌ Everything on 1 machine
- Node failure = total outage
- No horizontal scaling
- SQLite concurrency issues with multiple instances
```

### Kubernetes Setup
```
Kubernetes Cluster (Multi-node)
├─ 3-10 EduConnect App Pods (load balanced)
│  ├─ Stateless instances
│  ├─ Auto-scaling (3-10 pods)
│  └─ Auto-restart on failure
├─ PostgreSQL Pod (1 replica, persistent)
├─ Ingress (external access)
├─ Service (internal networking)
└─ ConfigMaps + Secrets (configuration)

Benefits: ✅ Enterprise-grade
- Zero downtime deployments
- Automatic scaling
- Self-healing
- Multi-node high availability
```

---

## 🔄 Key Changes Required

### 1. Database Migration: SQLite → PostgreSQL
**Why?** SQLite is file-based; multiple pods = data corruption

**Current Dockerfile:**
```dockerfile
RUN apk add sqlite  # SQLite
ENV DATABASE_URL=file:/data/bridge.db
```

**New Dockerfile (Kubernetes):**
```dockerfile
# PostgreSQL via Kubernetes deployment
ENV DATABASE_URL=postgresql://educonnect:password@postgres-service:5432/educonnect
```

**Update Prisma schema:**
```prisma
// Before:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// After:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

### 2. Configuration Management

**Docker Compose:**
```yaml
environment:
  - JWT_SECRET=secret
  - DATABASE_URL=file:/data/bridge.db
```

**Kubernetes (ConfigMap + Secret):**
```yaml
# Non-sensitive data
ConfigMap:
  DATABASE_URL: postgresql://...
  NODE_ENV: production

# Sensitive data (encrypted)
Secret:
  JWT_SECRET: xxxx
  EMAIL_PASS: xxxx
  RAZORPAY_KEY: xxxx
```

---

### 3. Persistence

**Docker Compose:**
```yaml
volumes:
  - edu-connect-data:/data
```

**Kubernetes:**
```yaml
PersistentVolumeClaim:
  storage: 20Gi  # For PostgreSQL
  accessModes: ReadWriteOnce
```

---

### 4. Service Discovery

**Docker Compose:**
```yaml
services:
  db:
    container_name: postgres
  app:
    links:
      - db  # hostname: "db"
```

**Kubernetes:**
```yaml
Service: postgres-service
Pods access via: postgres-service:5432 (DNS)
```

---

## 📈 Scaling in Kubernetes

### Before (Docker)
```
Students: 100
Servers: 1
Usage: 100%
Action: CRASH ❌
```

### After (Kubernetes)
```
Students: 100    → 3 pods (default)
Students: 1000   → 5 pods (auto-scaled)
Students: 10000  → 10 pods (max limit)

CPU usage: 70% → trigger scale-up
CPU usage: 20% → trigger scale-down

Zero downtime during scaling ✅
```

### HPA Configuration
```yaml
minReplicas: 3          # Always 3 pods running
maxReplicas: 10         # Max 10 pods
targetCPU: 70%          # Scale up if CPU > 70%
targetMemory: 80%       # Scale up if memory > 80%
```

---

## 🔒 Security in Kubernetes

### Network Isolation
```yaml
NetworkPolicy:
  - Only ingress-nginx can reach app
  - Only app can reach PostgreSQL
  - DNS egress allowed (for external APIs)
```

### Pod Security
```yaml
securityContext:
  runAsNonRoot: true     # No root privileges
  runAsUser: 1000        # Run as 'node' user
  readOnlyRootFilesystem: false
  allowPrivilegeEscalation: false
```

### Secret Encryption
```
Secrets stored encrypted in etcd
Never committed to git
```

---

## 📋 Deployment Steps

### Step 1: Update Manifest
```bash
# Edit k8s-manifest.yaml
# Replace:
# - your-registry/educonnect:latest → your actual image registry
# - JWT_SECRET, POSTGRES_PASSWORD, API keys
```

### Step 2: Update Prisma
```bash
# Update prisma/schema.prisma
datasource db {
  provider = "postgresql"  # Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 3: Build & Push Docker Image
```bash
docker build -f Dockerfile.k8s -t your-registry/educonnect:latest .
docker push your-registry/educonnect:latest
```

### Step 4: Deploy to Kubernetes
```bash
kubectl apply -f k8s-manifest.yaml

# OR use the script:
chmod +x deploy-k8s.sh
./deploy-k8s.sh
```

### Step 5: Verify
```bash
kubectl get pods -n educonnect
kubectl get svc -n educonnect
kubectl logs -f deployment/educonnect-deployment -n educonnect
```

---

## 🛠️ Common Operations

### Check Deployment Status
```bash
kubectl rollout status deployment/educonnect-deployment -n educonnect
```

### View Logs
```bash
# Last 100 lines
kubectl logs deployment/educonnect-deployment -n educonnect --tail=100

# Follow logs
kubectl logs -f deployment/educonnect-deployment -n educonnect

# Specific pod
kubectl logs pod-name -n educonnect
```

### Scale Manually
```bash
kubectl scale deployment educonnect-deployment -n educonnect --replicas=5
```

### Port Forward (Local Testing)
```bash
kubectl port-forward svc/educonnect-service 3000:3000 -n educonnect
# Now access at localhost:3000
```

### Check HPA Status
```bash
kubectl get hpa -n educonnect
kubectl describe hpa educonnect-hpa -n educonnect
```

### Check Resource Usage
```bash
kubectl top pods -n educonnect
kubectl top nodes
```

---

## 📊 Monitoring & Logging

### Required Tools (to add later)
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **ELK Stack** - Log aggregation
- **AlertManager** - Alerts

### Example Metrics to Monitor
```
- Pod restart count
- CPU/Memory usage
- Request latency
- Error rate
- Pod count (HPA decisions)
```

---

## 🚨 High Availability Features

### 1. PodDisruptionBudget (PDB)
```yaml
minAvailable: 2  # At least 2 pods always running
                 # Prevents accidental downtime during maintenance
```

### 2. Rolling Updates
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1           # 1 extra pod during update
    maxUnavailable: 0     # Never take down pods
```

### 3. LivenessProbe
```yaml
livenessProbe:
  httpGet:
    path: /api/mentors    # Health check endpoint
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10       # Check every 10 seconds
  failureThreshold: 3     # Restart after 3 failures
```

### 4. ReadinessProbe
```yaml
readinessProbe:
  httpGet:
    path: /api/mentors
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5        # Check every 5 seconds
                          # Remove from load balancer if failed
```

---

## 💰 Cost Implications

### Infrastructure Costs
| Setup | Cost | Uptime | Scaling |
|-------|------|--------|---------|
| Docker Compose | ~$20-50/mo | 99% | Manual |
| Kubernetes (managed) | ~$100-300/mo | 99.9% | Auto |
| Kubernetes (self-hosted) | ~$50-200/mo | 99.9% | Auto |

### Where to Deploy
- **Managed Kubernetes:** AWS EKS, GCP GKE, Azure AKS
- **Self-hosted:** DigitalOcean, Linode, on-premises

---

## 🔄 Data Migration: SQLite → PostgreSQL

```bash
# 1. Export data from SQLite
sqlite3 bridge.db ".dump" > backup.sql

# 2. Create migration script
# Convert SQLite dump to PostgreSQL format (tools available)

# 3. Import to PostgreSQL
psql -U educonnect -d educonnect < backup.sql
```

---

## ✅ Checklist Before Going Live

- [ ] Update `prisma/schema.prisma` (sqlite → postgresql)
- [ ] Update `Dockerfile.k8s` with your image registry
- [ ] Add health check endpoint to Express (`/health`)
- [ ] Update `k8s-manifest.yaml` with actual secrets
- [ ] Build and push Docker image
- [ ] Test locally with `docker-compose`
- [ ] Deploy to Kubernetes cluster
- [ ] Verify all pods are running
- [ ] Test Socket.io connections across pods
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Setup log aggregation (ELK/Loki)
- [ ] Configure backup strategy for PostgreSQL
- [ ] Setup CI/CD pipeline to auto-deploy

---

## 🆘 Troubleshooting

### Pods not starting
```bash
kubectl describe pod pod-name -n educonnect
kubectl logs pod-name -n educonnect
```

### PostgreSQL connection issues
```bash
kubectl exec -it postgres-pod-name -n educonnect -- psql -U educonnect -d educonnect
```

### Socket.io issues (multiple pods)
```
Problem: Session on Pod-1, but connection on Pod-2
Solution: Add Redis or use socket.io-redis adapter
```

### Ingress not working
```bash
kubectl get ingress -n educonnect
kubectl describe ingress educonnect-ingress -n educonnect
```

---

## 📚 Next Steps

1. **Add Health Check Endpoint** to Express
2. **Database Migration Tool** (SQLite → PostgreSQL)
3. **CI/CD Pipeline** (GitHub Actions / GitLab CI)
4. **Monitoring Stack** (Prometheus + Grafana)
5. **Logging Stack** (ELK / Loki + Promtail)
6. **Backup Strategy** (PostgreSQL backups)
7. **Disaster Recovery** (Multi-region setup)

---

**Need help?** Check Kubernetes docs at https://kubernetes.io/docs/
