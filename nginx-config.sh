#!/bin/bash

# Script para configurar Nginx para o Sistema de Cotação
# Autor: Sistema de Cotação

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Configurações
PROJECT_DIR="/var/www/orcamentos"
NGINX_SITE="orcamentos"
DOMAIN="seu-dominio.com"  # Altere para seu domínio

log "Configurando Nginx para o Sistema de Cotação..."

# Verificar se nginx está instalado
if ! command -v nginx &> /dev/null; then
    error "Nginx não está instalado"
    log "Instalando nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Criar configuração do nginx
log "Criando configuração do nginx..."

cat > /tmp/nginx-orcamentos << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirecionar para HTTPS (descomente se tiver SSL)
    # return 301 https://\$server_name\$request_uri;
    
    # Logs
    access_log /var/log/nginx/orcamentos_access.log;
    error_log /var/log/nginx/orcamentos_error.log;
    
    # Frontend React (build)
    location / {
        root $PROJECT_DIR/client/build;
        try_files \$uri \$uri/ /index.html;
        
        # Headers para cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Copiar configuração para nginx
sudo cp /tmp/nginx-orcamentos /etc/nginx/sites-available/$NGINX_SITE

# Criar link simbólico se não existir
if [ ! -L "/etc/nginx/sites-enabled/$NGINX_SITE" ]; then
    sudo ln -s /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
    log "Link simbólico criado"
fi

# Remover site default se existir
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    warn "Site default removido"
fi

# Verificar configuração do nginx
log "Verificando configuração do nginx..."
if sudo nginx -t; then
    log "✅ Configuração do nginx está válida"
else
    error "❌ Erro na configuração do nginx"
    exit 1
fi

# Recarregar nginx
log "Recarregando nginx..."
sudo systemctl reload nginx

# Verificar status do nginx
if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx está rodando"
else
    error "❌ Nginx não está rodando"
    sudo systemctl start nginx
fi

# Configurar firewall (se ufw estiver ativo)
if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
    log "Configurando firewall..."
    sudo ufw allow 'Nginx Full'
    log "Portas 80 e 443 liberadas no firewall"
fi

log "=== CONFIGURAÇÃO NGINX CONCLUÍDA ==="
echo ""
echo "🌐 Configuração criada: /etc/nginx/sites-available/$NGINX_SITE"
echo "📁 Frontend servido de: $PROJECT_DIR/client/build"
echo "🔗 API proxy para: http://localhost:3001"
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Altere o DOMAIN no script para seu domínio real"
echo "2. Configure SSL/HTTPS se necessário"
echo "3. Acesse: http://$DOMAIN"
echo ""
log "✅ Nginx configurado com sucesso!" 