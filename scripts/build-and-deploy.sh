#!/bin/bash

# Barnebys Backend - Build and Deploy Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="barnebys-backend"
IMAGE_TAG="latest"
REGISTRY="your-registry.com"  # Change this to your container registry
NAMESPACE="barnebys"

echo -e "${BLUE}🚀 Barnebys Backend - Build and Deploy Script${NC}"
echo "=================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Not connected to a Kubernetes cluster. Please connect first."
        exit 1
    fi
    
    print_status "All prerequisites are met!"
}

# Build Docker image
build_image() {
    print_info "Building Docker image..."
    
    # Build the image
    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    
    if [ $? -eq 0 ]; then
        print_status "Docker image built successfully!"
    else
        print_error "Failed to build Docker image!"
        exit 1
    fi
}

# Tag and push image (if registry is specified)
push_image() {
    if [ "$REGISTRY" != "your-registry.com" ]; then
        print_info "Tagging and pushing image to registry..."
        
        # Tag for registry
        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
        
        # Push to registry
        docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
        
        if [ $? -eq 0 ]; then
            print_status "Image pushed to registry successfully!"
        else
            print_error "Failed to push image to registry!"
            exit 1
        fi
    else
        print_warning "Skipping image push (registry not configured)"
    fi
}

# Deploy to Kubernetes
deploy_to_k8s() {
    print_info "Deploying to Kubernetes..."
    
    # Change to k8s directory
    cd k8s
    
    # Apply all manifests
    kubectl apply -f namespace.yaml
    kubectl apply -f configmap.yaml
    kubectl apply -f secret.yaml
    kubectl apply -f deployment.yaml
    kubectl apply -f service.yaml
    kubectl apply -f ingress.yaml
    kubectl apply -f hpa.yaml
    kubectl apply -f pdb.yaml
    
    # Wait for deployment to be ready
    print_info "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/barnebys-backend -n ${NAMESPACE}
    
    # Show deployment status
    print_info "Deployment status:"
    kubectl get pods -n ${NAMESPACE}
    kubectl get services -n ${NAMESPACE}
    kubectl get ingress -n ${NAMESPACE}
    
    # Go back to root directory
    cd ..
    
    print_status "Deployment completed successfully!"
}

# Main execution
main() {
    check_prerequisites
    build_image
    push_image
    deploy_to_k8s
    
    echo ""
    echo -e "${GREEN}🎉 All done! Your Barnebys Backend is now running in Kubernetes!${NC}"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "  kubectl get pods -n ${NAMESPACE}"
    echo "  kubectl logs -f deployment/barnebys-backend -n ${NAMESPACE}"
    echo "  kubectl port-forward service/barnebys-backend-service 8080:80 -n ${NAMESPACE}"
    echo ""
    echo -e "${BLUE}Access your application:${NC}"
    echo "  Local: http://localhost:8080"
    echo "  Cluster: http://barnebys-backend-service.${NAMESPACE}.svc.cluster.local"
}

# Run main function
main "$@"
