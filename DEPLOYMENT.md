# Deployment Guide for Water Quality Monitor

This guide will help you deploy the Water Quality Monitor application on an Ubuntu server.

## Prerequisites

- Ubuntu server (20.04 LTS or later recommended)
- Git installed
- SSH access to the server
- Domain name (optional but recommended)

## Server Setup

1. **Initial Server Setup**

   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Install required packages
   sudo apt install -y curl git
   ```
2. **Install Node.js**

   ```bash
   # Add NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

   # Install Node.js
   sudo apt install -y nodejs
   ```
3. **Install Nginx**

   ```bash
   sudo apt install -y nginx
   ```
4. **Install PM2**

   ```bash
   sudo npm install -g pm2
   ```

## Application Deployment

1. **Clone the Repository**

   ```bash
   # Create application directory
   sudo mkdir -p /var/www/water-quality-monitor
   sudo chown -R $USER:$USER /var/www/water-quality-monitor

   # Navigate to the directory
   cd /var/www/water-quality-monitor

   # Clone the repository
   git clone <your-repository-url> .
   ```
2. **Install Dependencies**

   ```bash
   npm install
   ```
3. **Build the Application**

   ```bash
   npm run build
   ```
4. **Configure Nginx**

   ```bash
   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/water-quality-monitor
   ```

   Add the following configuration:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # Replace with your domain

       root /var/www/water-quality-monitor/build;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```
5. **Enable the Site**

   ```bash
   # Create symbolic link
   sudo ln -sf /etc/nginx/sites-available/water-quality-monitor /etc/nginx/sites-enabled/

   # Remove default site
   sudo rm -f /etc/nginx/sites-enabled/default

   # Test Nginx configuration
   sudo nginx -t

   # Restart Nginx
   sudo systemctl restart nginx
   ```
6. **Start the Application**

   ```bash
   # Start with PM2
   pm2 start npm --name "water-quality-monitor" -- start
   pm2 save
   ```

## Environment Variables

1. Create a `.env` file in the application directory:

   ```bash
   nano /var/www/water-quality-monitor/.env
   ```
2. Add your environment variables:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MQTT_BROKER_URL=your_mqtt_broker_url
   ```

## SSL Configuration (Optional but Recommended)

1. Install Certbot:

   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
2. Get SSL certificate:

   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Maintenance

### Updating the Application

```bash
cd /var/www/water-quality-monitor
git pull
npm install
npm run build
pm2 restart water-quality-monitor
```

### Checking Logs

```bash
# Application logs
pm2 logs water-quality-monitor

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoring

```bash
# View PM2 status
pm2 status

# Monitor resources
pm2 monit
```

## Troubleshooting

1. **Check Nginx Status**

   ```bash
   sudo systemctl status nginx
   ```
2. **Check Application Status**

   ```bash
   pm2 status
   ```
3. **Check Logs**

   ```bash
   pm2 logs water-quality-monitor
   ```
4. **Common Issues**

   - If the site is not accessible, check firewall settings:
     ```bash
     sudo ufw status
     sudo ufw allow 80
     sudo ufw allow 443
     ```
   - If you get permission errors:
     ```bash
     sudo chown -R $USER:$USER /var/www/water-quality-monitor
     ```

## Security Considerations

1. **Firewall Configuration**

   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   ```
2. **Regular Updates**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. **SSL Certificate Renewal**

   ```bash
   sudo certbot renew --dry-run
   ```
