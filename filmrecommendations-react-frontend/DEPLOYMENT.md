# Azure Static Web Apps Deployment Guide - React Frontend

## Overview
This guide explains how to deploy the React frontend to Azure Static Web Apps, keeping it separate from the .NET backend API.

## Prerequisites
- Azure account with active subscription
- GitHub repository with the code
- Azure CLI installed (optional, for manual deployment)

## Deployment Options

### Option 1: Automated Deployment via GitHub Actions (Recommended)

#### Step 1: Create Azure Static Web App Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search for "Static Web App"
3. Fill in the details:
   - **Subscription**: Your subscription
   - **Resource Group**: `rg-film-recommendations` (use existing)
   - **Name**: `film-recommendations-react-frontend` (or your preferred name)
   - **Plan Type**: Free (or Standard if needed)
   - **Region**: West Europe (or your preferred region)
   - **Source**: GitHub
   - **GitHub Account**: Authorize and select your account
   - **Organization**: martinolsson89
   - **Repository**: film-recommendations-ai-martin
   - **Branch**: `main` (or `frontend-refactor` initially)
   - **Build Presets**: React
   - **App location**: `/filmrecommendations-react-frontend`
   - **Output location**: `dist`

4. Click "Review + Create" → "Create"

#### Step 2: Configure GitHub Secrets

After creation, Azure will automatically add the deployment token to your GitHub repository secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN_<RANDOM>`.

You need to rename or add these secrets in your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add/Update these secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN_REACT_FRONTEND`: Copy the deployment token from Azure Portal (Settings → Configuration → Deployment token)
   - `VITE_API_BASE_URL`: `https://film-recommendations-backend-cda7a6gybwabbhey.swedencentral-01.azurewebsites.net`

#### Step 3: Deploy

Once the secrets are configured, any push to `main` or `frontend-refactor` branch will automatically trigger deployment via GitHub Actions.

The workflow file is located at: `.github/workflows/azure-static-web-apps-react-frontend.yml`

### Option 2: Manual Deployment via SWA CLI

#### Prerequisites
- Azure Static Web Apps CLI installed globally: `npm install -g @azure/static-web-apps-cli`
- Azure CLI installed and logged in: `az login`

#### Steps

1. **Build the application**:
   ```bash
   cd filmrecommendations-react-frontend
   npm run build
   ```

2. **Deploy to Azure**:
   ```bash
   npx swa deploy --env production
   ```

3. Follow the prompts to:
   - Select your subscription
   - Select or create a Static Web App resource
   - Confirm deployment

## Environment Variables

The application uses environment variables for configuration:

- **Development** (`.env.development`):
  - `VITE_API_BASE_URL`: Backend API URL (defaults to Azure backend)

- **Production** (configured in Azure):
  - Set in Azure Portal → Static Web App → Configuration → Environment variables
  - Or via GitHub Secrets (automatically injected during build)

## Configuration Files

### `staticwebapp.config.json`
- Handles SPA routing (all routes redirect to index.html)
- Configures Content Security Policy
- Sets up CORS for backend API

### `swa-cli.config.json`
- Local development configuration for SWA CLI
- Defines build commands and output locations

## CORS Configuration

Make sure your backend API allows requests from the Static Web App domain:

In your .NET backend (`Program.cs`), ensure CORS policy includes your Static Web App URL:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",  // Local dev
            "https://your-static-web-app-url.azurestaticapps.net"  // Production
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});
```

## Testing

### Local Testing with SWA CLI
```bash
cd filmrecommendations-react-frontend
npx swa start
```

This will start the app at `http://localhost:4280` (SWA CLI emulator)

### Production Testing
After deployment, Azure will provide a URL like:
`https://<app-name>.azurestaticapps.net`

## Monitoring and Logs

- View deployment logs in GitHub Actions
- View application insights in Azure Portal → Static Web App → Application Insights
- View deployment history in Azure Portal → Static Web App → Deployments

## Custom Domain (Optional)

To add a custom domain:
1. Go to Azure Portal → Static Web App → Custom domains
2. Click "Add" → "Custom domain on other DNS"
3. Follow the instructions to add CNAME records to your DNS provider

## Troubleshooting

### Build Failures
- Check GitHub Actions logs for detailed error messages
- Ensure all dependencies are listed in `package.json`
- Verify Node.js version compatibility

### API Connection Issues
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS configuration on backend
- Verify backend is running and accessible

### Routing Issues
- Ensure `staticwebapp.config.json` has proper fallback configuration
- Test routes locally with `npx swa start`

## Costs

Azure Static Web Apps Free Tier includes:
- 100 GB bandwidth per month
- 0.5 GB storage
- Custom domains and SSL
- Authentication providers

This should be sufficient for most small to medium applications.

## Next Steps

After deployment:
1. ✅ Test all routes and functionality
2. ✅ Verify API connections work
3. ✅ Set up custom domain (optional)
4. ✅ Configure Application Insights for monitoring
5. ✅ Set up staging environments for testing before production
