#!/bin/bash

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    sudo apt install -y nginx
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Create app directory if it doesn't exist
APP_DIR="/var/www/water-quality-monitor"
if [ ! -d "$APP_DIR" ]; then
    echo "Creating application directory..."
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
fi

# Navigate to app directory
cd $APP_DIR

# Clone the repository if not already cloned
if [ ! -d ".git" ]; then
    echo "Cloning repository..."
    git clone https://github.com/tech-rover/water-quality-monitor.git .
fi

# Pull latest changes
echo "Pulling latest changes..."
git pull

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

# Configure nginx
echo "Configuring nginx..."
sudo tee /etc/nginx/sites-available/water-quality-monitor << EOF
server {
    listen 80;
    server_name waterquality.tech-rover.in;  

    root /var/www/water-quality-monitor/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/water-quality-monitor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Start the application with PM2
echo "Starting application with PM2..."
pm2 delete water-quality-monitor 2>/dev/null || true
pm2 start npm --name "water-quality-monitor" -- start
pm2 save

echo "Deployment completed successfully!" 