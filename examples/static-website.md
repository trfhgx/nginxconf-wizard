# Example: Static Website with SSL

This example shows a typical configuration for a static website with Let's Encrypt SSL.

## Configuration

- **Pattern**: Static-Only
- **Domain**: example.com (with www alias)
- **SSL**: Let's Encrypt
- **HTTP/2**: Enabled
- **Compression**: Enabled
- **Security Headers**: Enabled
- **Caching**: Enabled

## Generated nginx.conf

```nginx
# Nginx Configuration for example.com
# Pattern: Static-Only
# Generated: 2025-11-13T10:00:00.000Z

# HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name example.com www.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;

    # SSL Protocols and Ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # SSL Session
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Document Root
    root /var/www/example.com/html;
    index index.html index.htm;

    # Access and Error Logs
    access_log /var/log/nginx/example.com/access.log combined;
    error_log /var/log/nginx/example.com/error.log warn;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    # Main Location
    location / {
        try_files $uri $uri/ =404;

        # Gzip Compression
        gzip on;
        gzip_vary on;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
    }

    # Cache Static Assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

## Deployment Steps

```bash
# 1. Copy files to server
sudo cp nginx.conf /etc/nginx/sites-available/example.com.conf
sudo ln -s /etc/nginx/sites-available/example.com.conf /etc/nginx/sites-enabled/

# 2. Create document root
sudo mkdir -p /var/www/example.com/html
sudo mkdir -p /var/log/nginx/example.com

# 3. Test configuration
sudo nginx -t

# 4. Obtain SSL certificate
sudo certbot --nginx -d example.com -d www.example.com

# 5. Reload nginx
sudo systemctl reload nginx
```
