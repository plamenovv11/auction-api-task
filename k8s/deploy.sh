#!/bin/bash

# Barnebys Backend Kubernetes Deployment Script
set -e

echo "🚀 Starting Barnebys Backend deployment..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if we're connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster. Please connect first."
    exit 1
fi

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Create ConfigMap
echo "⚙️  Creating ConfigMap..."
kubectl apply -f configmap.yaml

# Create Secret
echo "🔐 Creating Secret..."
kubectl apply -f secret.yaml

# Create Deployment
echo "📋 Creating Deployment..."
kubectl apply -f deployment.yaml

# Create Services
echo "🌐 Creating Services..."
kubectl apply -f service.yaml

# Create Ingress (optional - requires ingress controller)
echo "🚪 Creating Ingress..."
kubectl apply -f ingress.yaml

# Create HPA
echo "📈 Creating Horizontal Pod Autoscaler..."
kubectl apply -f hpa.yaml

# Create Pod Disruption Budget
echo "🛡️  Creating Pod Disruption Budget..."
kubectl apply -f pdb.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/barnebys-backend -n barnebys

# Show deployment status
echo "📊 Deployment status:"
kubectl get pods -n barnebys
kubectl get services -n barnebys
kubectl get ingress -n barnebys

echo "✅ Deployment completed successfully!"
echo "🌍 Your application should be accessible at: http://api.barnebys.local"
echo "📝 Note: You may need to configure DNS or add entries to /etc/hosts"
