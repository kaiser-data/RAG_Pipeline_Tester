# Azure Cloud Deployment Guide

This guide provides step-by-step instructions for deploying the RAG Compare application to Azure Cloud using Docker containers.

## Prerequisites

- Azure account with active subscription
- Azure CLI installed (`az`) - [Install Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Docker installed locally for testing
- Git repository with the application code

## Local Testing

Before deploying to Azure, test the Docker setup locally:

```bash
# 1. Create .env file with your API keys
cp backend/.env.example backend/.env
# Edit backend/.env and add your API keys

# 2. Build and run with docker-compose
docker-compose up --build

# 3. Access the application
# Frontend: http://localhost
# Backend: http://localhost:8000
# API docs: http://localhost:8000/docs

# 4. Stop containers
docker-compose down
```

## Azure Deployment Options

### Option 1: Azure Container Instances (ACI) - Simple & Fast

Best for: Development, testing, small-scale production

#### Step 1: Login to Azure

```bash
az login
az account set --subscription "Your-Subscription-Name"
```

#### Step 2: Create Resource Group

```bash
# Choose a region close to your users
az group create \
  --name rag-compare-rg \
  --location eastus
```

#### Step 3: Create Azure Container Registry (ACR)

```bash
# Create registry
az acr create \
  --resource-group rag-compare-rg \
  --name ragcompareacr \
  --sku Basic \
  --admin-enabled true

# Login to registry
az acr login --name ragcompareacr
```

#### Step 4: Build and Push Images

```bash
# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name ragcompareacr --query loginServer --output tsv)

# Build and push backend
docker build -t $ACR_LOGIN_SERVER/rag-backend:latest ./backend
docker push $ACR_LOGIN_SERVER/rag-backend:latest

# Build and push frontend
docker build -t $ACR_LOGIN_SERVER/rag-frontend:latest ./frontend
docker push $ACR_LOGIN_SERVER/rag-frontend:latest
```

#### Step 5: Create Azure File Share for Persistent Storage

```bash
# Create storage account
az storage account create \
  --resource-group rag-compare-rg \
  --name ragcomparestorage \
  --location eastus \
  --sku Standard_LRS

# Get storage key
STORAGE_KEY=$(az storage account keys list \
  --resource-group rag-compare-rg \
  --account-name ragcomparestorage \
  --query '[0].value' --output tsv)

# Create file shares
az storage share create --name uploads --account-name ragcomparestorage --account-key $STORAGE_KEY
az storage share create --name chromadb --account-name ragcomparestorage --account-key $STORAGE_KEY
az storage share create --name faissdb --account-name ragcomparestorage --account-key $STORAGE_KEY
```

#### Step 6: Deploy Backend Container

```bash
# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name ragcompareacr --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name ragcompareacr --query passwords[0].value --output tsv)

# Deploy backend
az container create \
  --resource-group rag-compare-rg \
  --name rag-backend \
  --image $ACR_LOGIN_SERVER/rag-backend:latest \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label rag-compare-backend \
  --ports 8000 \
  --cpu 2 \
  --memory 4 \
  --environment-variables \
    HOST=0.0.0.0 \
    PORT=8000 \
    OPENAI_API_KEY="your-key-here" \
    ALLOWED_ORIGINS="https://rag-compare-frontend.eastus.azurecontainer.io" \
  --azure-file-volume-account-name ragcomparestorage \
  --azure-file-volume-account-key $STORAGE_KEY \
  --azure-file-volume-share-name uploads \
  --azure-file-volume-mount-path /app/uploads
```

#### Step 7: Deploy Frontend Container

```bash
# Get backend URL
BACKEND_URL=$(az container show \
  --resource-group rag-compare-rg \
  --name rag-backend \
  --query ipAddress.fqdn --output tsv)

# Deploy frontend
az container create \
  --resource-group rag-compare-rg \
  --name rag-frontend \
  --image $ACR_LOGIN_SERVER/rag-frontend:latest \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label rag-compare-frontend \
  --ports 80 \
  --cpu 1 \
  --memory 2 \
  --environment-variables \
    VITE_API_URL="http://$BACKEND_URL:8000"
```

#### Step 8: Access Your Application

```bash
# Get frontend URL
az container show \
  --resource-group rag-compare-rg \
  --name rag-frontend \
  --query ipAddress.fqdn --output tsv

# Output: rag-compare-frontend.eastus.azurecontainer.io
```

### Option 2: Azure App Service - Managed Platform

Best for: Production workloads, auto-scaling, managed infrastructure

#### Step 1-3: Same as Option 1

#### Step 4: Create App Service Plan

```bash
az appservice plan create \
  --name rag-compare-plan \
  --resource-group rag-compare-rg \
  --is-linux \
  --sku B2
```

#### Step 5: Deploy Backend Web App

```bash
az webapp create \
  --resource-group rag-compare-rg \
  --plan rag-compare-plan \
  --name rag-compare-backend-app \
  --deployment-container-image-name $ACR_LOGIN_SERVER/rag-backend:latest

# Configure ACR credentials
az webapp config container set \
  --name rag-compare-backend-app \
  --resource-group rag-compare-rg \
  --docker-custom-image-name $ACR_LOGIN_SERVER/rag-backend:latest \
  --docker-registry-server-url https://$ACR_LOGIN_SERVER \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD

# Configure environment variables
az webapp config appsettings set \
  --resource-group rag-compare-rg \
  --name rag-compare-backend-app \
  --settings \
    OPENAI_API_KEY="your-key-here" \
    PORT=8000
```

#### Step 6: Deploy Frontend Web App

```bash
az webapp create \
  --resource-group rag-compare-rg \
  --plan rag-compare-plan \
  --name rag-compare-frontend-app \
  --deployment-container-image-name $ACR_LOGIN_SERVER/rag-frontend:latest

az webapp config container set \
  --name rag-compare-frontend-app \
  --resource-group rag-compare-rg \
  --docker-custom-image-name $ACR_LOGIN_SERVER/rag-frontend:latest \
  --docker-registry-server-url https://$ACR_LOGIN_SERVER \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD

# Get backend URL
BACKEND_URL=$(az webapp show \
  --name rag-compare-backend-app \
  --resource-group rag-compare-rg \
  --query defaultHostName --output tsv)

az webapp config appsettings set \
  --resource-group rag-compare-rg \
  --name rag-compare-frontend-app \
  --settings VITE_API_URL="https://$BACKEND_URL"
```

### Option 3: Azure Kubernetes Service (AKS) - Enterprise Scale

Best for: Large-scale production, high availability, complex orchestration

*Note: AKS deployment is more complex and requires Kubernetes knowledge. See [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/) for detailed instructions.*

## Environment Variables

### Required Backend Variables

- `OPENAI_API_KEY`: OpenAI API key for GPT models
- `ANTHROPIC_API_KEY`: (Optional) Anthropic API key for Claude models
- `COHERE_API_KEY`: (Optional) Cohere API key
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

### Optional Backend Variables

- `MAX_UPLOAD_SIZE`: Maximum upload file size in bytes (default: 10485760)
- `UPLOAD_DIR`: Upload directory path (default: /app/uploads)

## Monitoring and Management

### View Container Logs

```bash
# Backend logs
az container logs \
  --resource-group rag-compare-rg \
  --name rag-backend

# Frontend logs
az container logs \
  --resource-group rag-compare-rg \
  --name rag-frontend
```

### Update Containers

```bash
# Rebuild and push new images
docker build -t $ACR_LOGIN_SERVER/rag-backend:latest ./backend
docker push $ACR_LOGIN_SERVER/rag-backend:latest

# Restart container to pull new image
az container restart \
  --resource-group rag-compare-rg \
  --name rag-backend
```

### Delete Resources

```bash
# Delete entire resource group (including all resources)
az group delete --name rag-compare-rg --yes --no-wait
```

## Security Best Practices

1. **API Keys**: Store sensitive keys in Azure Key Vault
   ```bash
   az keyvault create --name rag-compare-vault --resource-group rag-compare-rg
   az keyvault secret set --vault-name rag-compare-vault --name openai-key --value "your-key"
   ```

2. **HTTPS**: Configure custom domain with SSL certificate
   - Use Azure Front Door or Application Gateway
   - Enable HTTPS redirect

3. **Network Security**: Configure network security groups and firewall rules
   ```bash
   az network nsg create --resource-group rag-compare-rg --name rag-nsg
   ```

4. **Monitoring**: Enable Azure Monitor and Application Insights
   ```bash
   az monitor app-insights component create \
     --app rag-compare-insights \
     --location eastus \
     --resource-group rag-compare-rg
   ```

## Cost Optimization

- **ACI**: Pay only for running time (good for dev/test)
- **App Service**: Fixed cost per plan tier, multiple apps per plan
- **AKS**: Best for large-scale, but higher management overhead
- **Storage**: Use Standard_LRS tier for cost-effective storage

## Troubleshooting

### Container Won't Start

```bash
# Check container events
az container show \
  --resource-group rag-compare-rg \
  --name rag-backend \
  --query containers[0].instanceView.events

# Check logs
az container logs --resource-group rag-compare-rg --name rag-backend
```

### Connection Issues

- Verify CORS settings in backend environment variables
- Check network security group rules
- Ensure frontend has correct backend URL

### Performance Issues

- Increase CPU/memory allocation
- Enable container insights for monitoring
- Consider upgrading to App Service or AKS for auto-scaling

## Additional Resources

- [Azure Container Instances Documentation](https://docs.microsoft.com/en-us/azure/container-instances/)
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Container Registry Documentation](https://docs.microsoft.com/en-us/azure/container-registry/)
- [Docker Documentation](https://docs.docker.com/)
