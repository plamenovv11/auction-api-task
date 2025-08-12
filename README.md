# Barnebys Backend - Auction Analytics System

A NestJS-based backend system for auction analytics, built with MongoDB and designed for Kubernetes deployment.

## Features

- **Auction Management**: CRUD operations for auction items
- **Analytics Tracking**: Click and impression event tracking
- **Data Import**: Excel file import functionality
- **RESTful API**: Comprehensive API endpoints
- **MongoDB Integration**: Robust data persistence
- **Kubernetes Ready**: Full containerization and orchestration support

## Architecture

- **Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with Helm-like manifests
- **Monitoring**: Built-in health checks and metrics

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl CLI tool
- MongoDB (for local development)

## Quick Start with Docker

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd barnebys-backend
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Access the application**
   - API: http://localhost:3000
   - MongoDB: mongodb://localhost:27017
   - Mongo Express: http://localhost:8081

### Production Build

1. **Build the Docker image**
   ```bash
   docker build -t barnebys-backend:latest .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file env.production barnebys-backend:latest
   ```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster running
- kubectl configured and connected
- Ingress controller installed (nginx-ingress recommended)

### Quick Deployment

1. **Deploy all resources**
   ```bash
   chmod +x k8s/deploy.sh
   ./k8s/deploy.sh
   ```

2. **Or use the comprehensive script**
   ```bash
   chmod +x scripts/build-and-deploy.sh
   ./scripts/build-and-deploy.sh
   ```

### Manual Deployment

1. **Create namespace**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Apply configuration**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secret.yaml
   ```

3. **Deploy application**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

4. **Enable scaling**
   ```bash
   kubectl apply -f k8s/hpa.yaml
   kubectl apply -f k8s/pdb.yaml
   ```

### Undeploy

```bash
chmod +x k8s/undeploy.sh
./k8s/undeploy.sh
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/barnebys` |
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `SESSION_SECRET` | Session encryption key | Required |
| `ANALYTICS_*` | Analytics configuration | See env.example |

### Kubernetes Configuration

- **ConfigMap**: Non-sensitive configuration
- **Secret**: Sensitive data (MongoDB URI, session secret)
- **Resource Limits**: CPU/Memory constraints
- **Health Checks**: Liveness and readiness probes
- **Auto-scaling**: HPA with CPU/Memory metrics

## Monitoring & Health

### Health Endpoints

- `GET /api/v1/health` - General health check
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

### Kubernetes Probes

- **Liveness Probe**: Detects deadlocks and unresponsive states
- **Readiness Probe**: Ensures pod is ready to receive traffic
- **Startup Probe**: Handles slow-starting containers

## Security Features

- **Non-root containers**: Runs as user 1001
- **Resource limits**: Prevents resource exhaustion
- **Network policies**: Isolated network access
- **Secrets management**: Secure credential storage
- **TLS support**: HTTPS with ingress configuration

## Scaling & Performance

### Horizontal Pod Autoscaler

- **Min replicas**: 2
- **Max replicas**: 10
- **CPU threshold**: 70%
- **Memory threshold**: 80%

### Resource Requirements

- **Requests**: 256Mi memory, 250m CPU
- **Limits**: 512Mi memory, 500m CPU

## Database

### MongoDB Collections

- `auction_items`: Auction item data
- `click_events`: User click analytics
- `impression_events`: User impression analytics

### Indexes & Performance

- Text search indexes on title and description
- Time-based indexes for analytics
- TTL indexes for data retention (90 days)

## API Endpoints

### Base URL: `/api/v1`

- **Auction Items**: `GET/POST/PUT/DELETE /auction-items`
- **Analytics**: `POST /analytics/click`, `POST /analytics/impression`
- **Import**: `POST /import/excel`
- **Health**: `GET /health`

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

### Docker Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Production Deployment

### 1. Build and Push Image

```bash
# Build image
docker build -t your-registry.com/barnebys-backend:latest .

# Push to registry
docker push your-registry.com/barnebys-backend:latest
```

### 2. Update Kubernetes Manifests

Edit `k8s/deployment.yaml`:
```yaml
image: your-registry.com/barnebys-backend:latest
```

### 3. Deploy to Cluster

```bash
./scripts/build-and-deploy.sh
```

## Troubleshooting

### Common Issues

1. **Pod not starting**
   ```bash
   kubectl describe pod <pod-name> -n barnebys
   kubectl logs <pod-name> -n barnebys
   ```

2. **Service not accessible**
   ```bash
   kubectl get svc -n barnebys
   kubectl describe svc barnebys-backend-service -n barnebys
   ```

3. **Ingress not working**
   ```bash
   kubectl get ingress -n barnebys
   kubectl describe ingress barnebys-backend-ingress -n barnebys
   ```

### Debug Commands

```bash
# Check pod status
kubectl get pods -n barnebys

# View logs
kubectl logs -f deployment/barnebys-backend -n barnebys

# Port forward for local access
kubectl port-forward service/barnebys-backend-service 8080:80 -n barnebys

# Access MongoDB
kubectl port-forward service/mongodb-service 27017:27017 -n barnebys
```

## Additional Resources

- [NestJS Documentation](https://nestjs.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

**Note**: This application is designed for the Barnebys Backend Coding Test and demonstrates best practices for containerization and Kubernetes deployment.
