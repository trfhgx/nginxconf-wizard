# Example: React SPA with Backend API

This example shows a configuration for a Single Page Application with a separate API backend.

## Configuration

- **Pattern**: SPA + API
- **Domain**: app.example.com
- **Frontend**: React SPA
- **Backend**: Node.js API on localhost:3000
- **API Path**: /api
- **SSL**: Let's Encrypt
- **HTTP/2**: Enabled
- **CORS**: Enabled
- **Compression**: Enabled

## Use Case

Perfect for:
- React / Vue / Angular SPAs
- Mobile app backends
- JAMstack applications
- Decoupled frontend/backend architectures

## Generated nginx.conf

See the SPA pattern template for the full configuration. Key features include:

- API proxy at `/api` → `http://localhost:3000`
- CORS headers for cross-origin requests
- SPA routing (fallback to index.html)
- WebSocket support
- Rate limiting on API endpoints

## Project Structure

```
/var/www/app.example.com/
└── html/
    ├── index.html
    ├── static/
    │   ├── css/
    │   ├── js/
    │   └── media/
    └── favicon.ico
```

## Backend Setup

Your backend runs separately on localhost:3000 and handles:
- API routes (/api/*)
- Authentication
- Database queries
- Business logic

## Deployment

```bash
# 1. Deploy frontend build
npm run build
sudo cp -r build/* /var/www/app.example.com/html/

# 2. Deploy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/app.example.com.conf
sudo ln -s /etc/nginx/sites-available/app.example.com.conf /etc/nginx/sites-enabled/

# 3. Start backend server (using PM2)
pm2 start server.js --name api

# 4. Get SSL certificate
sudo certbot --nginx -d app.example.com

# 5. Reload nginx
sudo systemctl reload nginx
```
