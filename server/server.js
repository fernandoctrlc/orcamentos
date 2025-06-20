const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuração do banco de dados SQLite
const dbPath = path.join(__dirname, 'corretores.db');
const db = new sqlite3.Database(dbPath);

// Criar tabela de corretores se não existir
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS corretores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    dataCadastro TEXT NOT NULL,
    dataDesligamento TEXT,
    tipoUsuario TEXT NOT NULL DEFAULT 'usuario',
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Rota de teste
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Backend rodando com sucesso!' });
});

// Rota para cadastrar corretor
app.post('/api/corretores', (req, res) => {
  const { nome, email, telefone, cpf, senha, dataCadastro, dataDesligamento, tipoUsuario } = req.body;
  
  const sql = `INSERT INTO corretores (nome, email, telefone, cpf, senha, dataCadastro, dataDesligamento, tipoUsuario) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [nome, email, telefone, cpf, senha, dataCadastro, dataDesligamento || null, tipoUsuario], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'CPF ou E-mail já cadastrado' });
      }
      return res.status(500).json({ error: 'Erro ao cadastrar corretor' });
    }
    
    res.status(201).json({ 
      message: 'Corretor cadastrado com sucesso!',
      id: this.lastID 
    });
  });
});

// Rota para listar corretores
app.get('/api/corretores', (req, res) => {
  const sql = 'SELECT id, nome, email, telefone, cpf, dataCadastro, dataDesligamento, tipoUsuario FROM corretores ORDER BY nome';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar corretores' });
    }
    
    res.json({ corretores: rows });
  });
});

// Rota para buscar corretor por ID
app.get('/api/corretores/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, nome, email, telefone, cpf, dataCadastro, dataDesligamento, tipoUsuario FROM corretores WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar corretor' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Corretor não encontrado' });
    }
    
    res.json({ corretor: row });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 