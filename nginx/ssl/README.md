# SSL Certificates

Place your SSL certificates here:

- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key

## For Development (Self-Signed)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## For Production (Let's Encrypt)

Use certbot to obtain certificates:

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d your-domain.com \
  -d www.your-domain.com

# Certificates will be in /etc/letsencrypt/live/your-domain.com/
# Copy them to this directory or update nginx.conf to point to /etc/letsencrypt
```

## Auto-Renewal

Add to crontab:

```bash
0 0 1 * * certbot renew --quiet && docker-compose exec nginx nginx -s reload
```
