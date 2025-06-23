#!/bin/bash

echo "🚀 Iniciando deploy do Sistema de Cotação..."

# Navegar para o diretório do projeto
# cd /var/www/orcamentos

echo "📁 Diretório atual: $(pwd)"

# Fazer backup do banco
echo "💾 Fazendo backup do banco..."
cp server/corretores.db server/corretores_backup_$(date +%Y%m%d_%H%M%S).db 2>/dev/null || echo "Banco não existe ainda"

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Instalar dependências do servidor
echo "📦 Instalando dependências do servidor..."
cd server
npm install

# Instalar dependências do cliente
echo "📦 Instalando dependências do cliente..."
cd ../client
npm install

# Build do frontend
echo "🔨 Fazendo build do frontend..."
npm run build

# Voltar para diretório raiz
cd ..

# Parar processo existente se houver
echo "🛑 Parando processo existente..."
pm2 stop orcamentos-server 2>/dev/null || echo "Processo não existe"
pm2 delete orcamentos-server 2>/dev/null || echo "Processo não existe"

# Iniciar novo processo
echo "▶️ Iniciando servidor..."
pm2 start server/server.js --name orcamentos-server

# Salvar configuração PM2
pm2 save

echo "✅ Deploy concluído!"
echo "📊 Status dos processos:"
pm2 status

echo "🌐 Testando API..."
curl -s http://localhost:3001/api/hello || echo "API não respondeu"

echo "📋 Logs do servidor:"
pm2 logs orcamentos-server --lines 5 