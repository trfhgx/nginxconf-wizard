# Troubleshooting

## Common Issues

**nginx: [emerg] unknown directive "http3"**
```
Solution: Upgrade Nginx to 1.25+ or disable HTTP/3
nginxconf-wizard generate --preset nextjs --no-http3
```

**Permission denied writing to /etc/nginx/**
```
Solution: Run with sudo or change output directory
nginxconf-wizard generate --output ./nginx.conf
```

**SSL certificate validation failed**
```
Solution: Check certificate paths and permissions
nginxconf-wizard validate nginx.conf --verbose
```

## Getting Help

- [Documentation](docs/README.md)
- [Discord Community](https://discord.gg/example)
- [Issue Tracker](https://github.com/trfhgx/nginxconf-wizard/issues)