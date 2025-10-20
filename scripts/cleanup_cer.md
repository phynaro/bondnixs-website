# 1. Remove corrupted certificate
rm -rf /etc/letsencrypt/live/bondnixs.co.th
rm -rf /etc/letsencrypt/archive/bondnixs.co.th
rm -rf /etc/letsencrypt/renewal/bondnixs.co.th.conf

# 2. Verify clean state
certbot certificates

# 3. Generate fresh certificate
certbot certonly --standalone -d www.bondnixs.co.th --email admin@bondnixs.co.th --agree-tos --non-interactive

# 4. Copy certificates
cp /etc/letsencrypt/live/www.bondnixs.co.th/fullchain.pem ssl/
cp /etc/letsencrypt/live/www.bondnixs.co.th/privkey.pem ssl/

# 5. Set permissions
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem

# 6. Start services
docker compose -f docker-compose.prod.yml up -d

# 7. Test
curl -I https://www.bondnixs.co.th