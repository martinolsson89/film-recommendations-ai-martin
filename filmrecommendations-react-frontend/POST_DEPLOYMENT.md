# Post-Deployment Steps

After deploying your React frontend to Azure Static Web Apps, follow these steps to complete the setup:

## 1. Get Your Static Web App URL

After deployment, your Static Web App will have a URL like:
- `https://<app-name>.azurestaticapps.net`

You can find this in:
- Azure Portal → Your Static Web App → Overview → URL
- GitHub Actions deployment logs (will print the URL)

## 2. Update Backend CORS Configuration

Update `FilmRecomendations.WebApi/Program.cs` to include your new Static Web App URL:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",  // Local development
            "https://YOUR-NEW-STATIC-WEB-APP-URL.azurestaticapps.net",  // New React frontend
            "https://kind-smoke-050d18e03.6.azurestaticapps.net")  // Legacy frontend (if still needed)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

Replace `YOUR-NEW-STATIC-WEB-APP-URL` with your actual Static Web App URL.

## 3. Redeploy Backend

After updating the CORS configuration, redeploy your backend:

```bash
# Using the existing GitHub Actions workflow
git add FilmRecomendations.WebApi/Program.cs
git commit -m "Update CORS for new React frontend"
git push origin main
```

The existing workflow (`.github/workflows/main_film-recommendations-backend.yml`) will automatically deploy the updated backend.

## 4. Test the Connection

1. Visit your Static Web App URL
2. Open browser DevTools (F12) → Console
3. Test authentication:
   - Try registering a new account
   - Try logging in
   - Check for CORS errors (should be none)

4. Test API calls:
   - Search for movies
   - View movie details
   - Test watchlist functionality

## 5. Update Environment Variables (if needed)

If you want to use different backend URLs for different environments:

### In Azure Static Web App:
1. Go to Azure Portal → Your Static Web App → Configuration
2. Add environment variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://film-recommendations-backend-cda7a6gybwabbhey.swedencentral-01.azurewebsites.net`

### In GitHub Secrets:
The workflow already references `secrets.VITE_API_BASE_URL`, so make sure it's set in:
- GitHub Repo → Settings → Secrets and variables → Actions
- Add secret: `VITE_API_BASE_URL`

## 6. Monitor Deployment

Watch the GitHub Actions workflow:
1. Go to your GitHub repository
2. Click "Actions" tab
3. Find the "Azure Static Web Apps CI/CD - React Frontend" workflow
4. Click on the running workflow to see logs

## 7. Optional: Custom Domain

If you want a custom domain:
1. Azure Portal → Static Web App → Custom domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records with your domain provider
4. Update backend CORS to include custom domain

## Troubleshooting

### CORS Errors
- Verify backend CORS includes your Static Web App URL
- Check backend has been redeployed with updated CORS
- Ensure no typos in URLs (trailing slashes matter!)

### API Not Connecting
- Check `VITE_API_BASE_URL` environment variable
- Verify backend URL is accessible (test in browser)
- Check browser console for error messages

### Build Failures
- Review GitHub Actions logs
- Check all dependencies in `package.json`
- Verify TypeScript compilation succeeds locally

### 404 on Routes
- Verify `staticwebapp.config.json` is in the root of your app
- Check the `navigationFallback` configuration

## Clean Up Old Resources (Optional)

If you no longer need the legacy frontend:
- Azure Portal → Static Web App → `film-recommendations-frontend`
- Consider keeping it as a backup or delete if not needed
- Remove from backend CORS if deleted
