#!/bin/bash

# Barnebys Backend Kubernetes Undeployment Script
set -e

echo "🗑️  Starting Barnebys Backend undeployment..."

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

# Delete resources in reverse order
echo "🚪 Deleting Ingress..."
kubectl delete -f ingress.yaml --ignore-not-found=true

echo "📈 Deleting Horizontal Pod Autoscaler..."
kubectl delete -f hpa.yaml --ignore-not-found=true

echo "🛡️  Deleting Pod Disruption Budget..."
kubectl delete -f pdb.yaml --ignore-not-found=true

echo "🌐 Deleting Services..."
kubectl delete -f service.yaml --ignore-not-found=true

echo "📋 Deleting Deployment..."
kubectl delete -f deployment.yaml --ignore-not-found=true

echo "🔐 Deleting Secret..."
kubectl delete -f secret.yaml --ignore-not-found=true

echo "⚙️  Deleting ConfigMap..."
kubectl delete -f configmap.yaml --ignore-not-found=true

echo "📦 Deleting namespace..."
kubectl delete -f namespace.yaml --ignore-not-found=true

echo "✅ Undeployment completed successfully!"
echo "🧹 All Barnebys Backend resources have been removed from the cluster."
