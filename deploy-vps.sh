#!/bin/bash

# Script de Deploy Completo para VPS - Sistema de Cotação
# Autor: Sistema de Cotação
# Data: $(date)

set -e  # Para o script se houver erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# Configurações
PROJECT_DIR="/var/www/orcamentos"
BACKUP_DIR="/var/www/backups"
LOG_FILE="/var/log/deploy-orcamentos.log"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Função para fazer backup
backup_database() {
    log "Fazendo backup do banco de dados..."
    if [ -f "$PROJECT_DIR/server/corretores.db" ]; then
        BACKUP_FILE="$BACKUP_DIR/corretores_$(date +%Y%m%d_%H%M%S).db"
        cp "$PROJECT_DIR/server/corretores.db" "$BACKUP_FILE"
        log "Backup criado: $BACKUP_FILE"
    else
        warn "Banco de dados não encontrado, pulando backup"
    fi
}

# Função para verificar dependências
check_dependencies() {
    log "Verificando dependências..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não está instalado"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        error "npm não está instalado"
        exit 1
    fi
    
    # Verificar PM2
    if ! command -v pm2 &> /dev/null; then
        warn "PM2 não está instalado, instalando..."
        npm install -g pm2
    fi
    
    # Verificar git
    if ! command -v git &> /dev/null; then
        error "git não está instalado"
        exit 1
    fi
    
    log "Todas as dependências estão instaladas"
}

# Função para atualizar código
update_code() {
    log "Atualizando código do repositório..."
    cd $PROJECT_DIR
    
    # Verificar se é um repositório git
    if [ ! -d ".git" ]; then
        error "Diretório não é um repositório git"
        exit 1
    fi
    
    # Fazer pull das mudanças
    git pull origin main
    
    if [ $? -eq 0 ]; then
        log "Código atualizado com sucesso"
    else
        error "Erro ao atualizar código"
        exit 1
    fi
}

# Função para instalar dependências do servidor
install_server_deps() {
    log "Instalando dependências do servidor..."
    cd $PROJECT_DIR/server
    
    # Limpar cache do npm se necessário
    npm cache clean --force 2>/dev/null || true
    
    # Instalar dependências
    npm install
    
    if [ $? -eq 0 ]; then
        log "Dependências do servidor instaladas"
    else
        error "Erro ao instalar dependências do servidor"
        exit 1
    fi
}

# Função para instalar dependências do cliente
install_client_deps() {
    log "Instalando dependências do cliente..."
    cd $PROJECT_DIR/client
    
    # Limpar cache do npm se necessário
    npm cache clean --force 2>/dev/null || true
    
    # Instalar dependências
    npm install
    
    if [ $? -eq 0 ]; then
        log "Dependências do cliente instaladas"
    else
        error "Erro ao instalar dependências do cliente"
        exit 1
    fi
}

# Função para fazer build do frontend
build_frontend() {
    log "Fazendo build do frontend..."
    cd $PROJECT_DIR/client
    
    # Limpar build anterior
    rm -rf build/
    
    # Fazer build
    npm run build
    
    if [ $? -eq 0 ]; then
        log "Build do frontend concluído"
        
        # Verificar se o build foi criado
        if [ -d "build" ]; then
            log "Build criado em: $(pwd)/build"
        else
            error "Build não foi criado"
            exit 1
        fi
    else
        error "Erro ao fazer build do frontend"
        exit 1
    fi
}

# Função para configurar permissões
setup_permissions() {
    log "Configurando permissões..."
    cd $PROJECT_DIR
    
    # Definir permissões corretas
    sudo chown -R www-data:www-data .
    sudo chmod -R 755 .
    sudo chmod -R 777 server/  # Para o banco SQLite
    
    log "Permissões configuradas"
}

# Função para reiniciar serviços
restart_services() {
    log "Reiniciando serviços..."
    
    # Parar processo existente se houver
    pm2 stop orcamentos-server 2>/dev/null || warn "Processo não estava rodando"
    pm2 delete orcamentos-server 2>/dev/null || warn "Processo não existia"
    
    # Iniciar novo processo
    cd $PROJECT_DIR
    pm2 start server/server.js --name orcamentos-server
    
    if [ $? -eq 0 ]; then
        log "Servidor iniciado com PM2"
        
        # Salvar configuração PM2
        pm2 save
        
        # Configurar para iniciar com o sistema (se não estiver configurado)
        pm2 startup 2>/dev/null || warn "PM2 startup já configurado"
        
    else
        error "Erro ao iniciar servidor"
        exit 1
    fi
}

# Função para verificar se o servidor está funcionando
check_server() {
    log "Verificando se o servidor está funcionando..."
    
    # Aguardar um pouco para o servidor inicializar
    sleep 3
    
    # Testar API
    if curl -s http://localhost:3001/api/hello > /dev/null; then
        log "✅ Servidor está funcionando"
        log "API respondeu com sucesso"
    else
        error "❌ Servidor não está respondendo"
        log "Verificando logs do PM2..."
        pm2 logs orcamentos-server --lines 10
        exit 1
    fi
}

# Função para mostrar status final
show_status() {
    log "=== STATUS FINAL ==="
    
    echo ""
    echo "📊 Status dos processos PM2:"
    pm2 status
    
    echo ""
    echo "🌐 Teste da API:"
    curl -s http://localhost:3001/api/hello | jq . 2>/dev/null || curl -s http://localhost:3001/api/hello
    
    echo ""
    echo "📁 Diretório do projeto: $PROJECT_DIR"
    echo "📦 Build do frontend: $PROJECT_DIR/client/build/"
    echo "🗄️  Banco de dados: $PROJECT_DIR/server/corretores.db"
    
    echo ""
    log "✅ Deploy concluído com sucesso!"
    log "🌍 Acesse o sistema no navegador"
}

# Função principal
main() {
    echo "🚀 Iniciando deploy do Sistema de Cotação..."
    echo "📁 Diretório: $PROJECT_DIR"
    echo "⏰ Data/Hora: $(date)"
    echo ""
    
    # Verificar se o diretório existe
    if [ ! -d "$PROJECT_DIR" ]; then
        error "Diretório do projeto não existe: $PROJECT_DIR"
        exit 1
    fi
    
    # Executar etapas do deploy
    check_dependencies
    backup_database
    update_code
    install_server_deps
    install_client_deps
    build_frontend
    setup_permissions
    restart_services
    check_server
    show_status
    
    echo ""
    log "🎉 Deploy finalizado com sucesso!"
}

# Executar função principal
main "$@" 