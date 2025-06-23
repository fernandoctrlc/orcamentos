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

// Servir arquivos estáticos do build do React
app.use(express.static(path.join(__dirname, '../client/build')));

// Configuração do banco de dados SQLite
const dbPath = path.join(__dirname, 'corretores.db');
const db = new sqlite3.Database(dbPath);

// Criar tabelas se não existirem
db.serialize(() => {
  // Tabela de corretores
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

  // Tabela de acomodações
  db.run(`CREATE TABLE IF NOT EXISTS acomodacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    registro_ans TEXT,
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabela de modalidades
  db.run(`CREATE TABLE IF NOT EXISTS modalidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabela de cidades
  db.run(`CREATE TABLE IF NOT EXISTS cidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    estado TEXT NOT NULL,
    codigo_ibge TEXT,
    observacoes TEXT,
    consultas_eletivas DECIMAL(10,2),
    consultas_urgencias DECIMAL(10,2),
    exames_simples DECIMAL(10,2),
    exames_complexos DECIMAL(10,2),
    terapias_especiais DECIMAL(10,2),
    demais_terapias DECIMAL(10,2),
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabela de operadoras
  db.run(`CREATE TABLE IF NOT EXISTS operadoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_completo TEXT NOT NULL UNIQUE,
    vigencias TEXT,
    data_cadastro TEXT NOT NULL,
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Rota de teste
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Backend rodando com sucesso!' });
});

// ===== ROTAS PARA CORRETORES =====
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

// ===== ROTAS PARA ACOMODAÇÕES =====
// Rota para cadastrar acomodação
app.post('/api/acomodacoes', (req, res) => {
  const { nome, registro_ans } = req.body;
  
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome da acomodação é obrigatório' });
  }
  
  const sql = 'INSERT INTO acomodacoes (nome, registro_ans) VALUES (?, ?)';
  
  db.run(sql, [nome.trim(), registro_ans ? registro_ans.trim() : null], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Acomodação com este nome já existe' });
      }
      return res.status(500).json({ error: 'Erro ao cadastrar acomodação' });
    }
    
    res.status(201).json({ 
      message: 'Acomodação cadastrada com sucesso!',
      id: this.lastID 
    });
  });
});

// Rota para listar acomodações
app.get('/api/acomodacoes', (req, res) => {
  const sql = 'SELECT id, nome, registro_ans FROM acomodacoes ORDER BY nome';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar acomodações' });
    }
    
    res.json({ acomodacoes: rows });
  });
});

// Rota para buscar acomodação por ID
app.get('/api/acomodacoes/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, nome, registro_ans FROM acomodacoes WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar acomodação' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Acomodação não encontrada' });
    }
    
    res.json({ acomodacao: row });
  });
});

// Rota para atualizar acomodação
app.put('/api/acomodacoes/:id', (req, res) => {
  const { id } = req.params;
  const { nome, registro_ans } = req.body;
  
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome da acomodação é obrigatório' });
  }
  
  const sql = 'UPDATE acomodacoes SET nome = ?, registro_ans = ? WHERE id = ?';
  
  db.run(sql, [nome.trim(), registro_ans ? registro_ans.trim() : null, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Acomodação com este nome já existe' });
      }
      return res.status(500).json({ error: 'Erro ao atualizar acomodação' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Acomodação não encontrada' });
    }
    
    res.json({ message: 'Acomodação atualizada com sucesso!' });
  });
});

// Rota para deletar acomodação
app.delete('/api/acomodacoes/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM acomodacoes WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar acomodação' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Acomodação não encontrada' });
    }
    
    res.json({ message: 'Acomodação deletada com sucesso!' });
  });
});

// ===== ROTAS PARA MODALIDADES =====
// Rota para cadastrar modalidade
app.post('/api/modalidades', (req, res) => {
  const { nome } = req.body;
  
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome da modalidade é obrigatório' });
  }
  
  const sql = 'INSERT INTO modalidades (nome) VALUES (?)';
  
  db.run(sql, [nome.trim()], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Modalidade com este nome já existe' });
      }
      return res.status(500).json({ error: 'Erro ao cadastrar modalidade' });
    }
    
    res.status(201).json({ 
      message: 'Modalidade cadastrada com sucesso!',
      id: this.lastID 
    });
  });
});

// Rota para listar modalidades
app.get('/api/modalidades', (req, res) => {
  const sql = 'SELECT id, nome FROM modalidades ORDER BY nome';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar modalidades' });
    }
    
    res.json({ modalidades: rows });
  });
});

// Rota para buscar modalidade por ID
app.get('/api/modalidades/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, nome FROM modalidades WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar modalidade' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Modalidade não encontrada' });
    }
    
    res.json({ modalidade: row });
  });
});

// Rota para atualizar modalidade
app.put('/api/modalidades/:id', (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome da modalidade é obrigatório' });
  }
  
  const sql = 'UPDATE modalidades SET nome = ? WHERE id = ?';
  
  db.run(sql, [nome.trim(), id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Modalidade com este nome já existe' });
      }
      return res.status(500).json({ error: 'Erro ao atualizar modalidade' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Modalidade não encontrada' });
    }
    
    res.json({ message: 'Modalidade atualizada com sucesso!' });
  });
});

// Rota para deletar modalidade
app.delete('/api/modalidades/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM modalidades WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar modalidade' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Modalidade não encontrada' });
    }
    
    res.json({ message: 'Modalidade deletada com sucesso!' });
  });
});

// ===== ROTAS PARA CIDADES =====
// Rota para cadastrar cidade
app.post('/api/cidades', (req, res) => {
  const { nome, estado, codigo_ibge, observacoes, consultas_eletivas, consultas_urgencias, exames_simples, exames_complexos, terapias_especiais, demais_terapias } = req.body;

  if (!nome || !estado) {
    return res.status(400).json({ error: 'Nome e estado são obrigatórios' });
  }

  const sql = `INSERT INTO cidades (nome, estado, codigo_ibge, observacoes, consultas_eletivas, consultas_urgencias, exames_simples, exames_complexos, terapias_especiais, demais_terapias) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    nome.trim(),
    estado.trim(),
    codigo_ibge ? codigo_ibge.trim() : null,
    observacoes ? observacoes.trim() : null,
    consultas_eletivas ? parseFloat(consultas_eletivas) : null,
    consultas_urgencias ? parseFloat(consultas_urgencias) : null,
    exames_simples ? parseFloat(exames_simples) : null,
    exames_complexos ? parseFloat(exames_complexos) : null,
    terapias_especiais ? parseFloat(terapias_especiais) : null,
    demais_terapias ? parseFloat(demais_terapias) : null
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao cadastrar cidade' });
    }
    res.status(201).json({ message: 'Cidade cadastrada com sucesso!', id: this.lastID });
  });
});

// Rota para listar cidades
app.get('/api/cidades', (req, res) => {
  const sql = `SELECT id, nome, estado, codigo_ibge, observacoes, consultas_eletivas, consultas_urgencias, exames_simples, exames_complexos, terapias_especiais, demais_terapias FROM cidades ORDER BY nome, estado`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar cidades' });
    }
    res.json({ cidades: rows });
  });
});

// Rota para buscar cidade por ID
app.get('/api/cidades/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT id, nome, estado, codigo_ibge, observacoes, consultas_eletivas, consultas_urgencias, exames_simples, exames_complexos, terapias_especiais, demais_terapias FROM cidades WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar cidade' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }
    res.json({ cidade: row });
  });
});

// Rota para atualizar cidade
app.put('/api/cidades/:id', (req, res) => {
  const { id } = req.params;
  const { nome, estado, codigo_ibge, observacoes, consultas_eletivas, consultas_urgencias, exames_simples, exames_complexos, terapias_especiais, demais_terapias } = req.body;

  if (!nome || !estado) {
    return res.status(400).json({ error: 'Nome e estado são obrigatórios' });
  }

  const sql = `UPDATE cidades SET nome = ?, estado = ?, codigo_ibge = ?, observacoes = ?, consultas_eletivas = ?, consultas_urgencias = ?, exames_simples = ?, exames_complexos = ?, terapias_especiais = ?, demais_terapias = ? WHERE id = ?`;
  db.run(sql, [
    nome.trim(),
    estado.trim(),
    codigo_ibge ? codigo_ibge.trim() : null,
    observacoes ? observacoes.trim() : null,
    consultas_eletivas ? parseFloat(consultas_eletivas) : null,
    consultas_urgencias ? parseFloat(consultas_urgencias) : null,
    exames_simples ? parseFloat(exames_simples) : null,
    exames_complexos ? parseFloat(exames_complexos) : null,
    terapias_especiais ? parseFloat(terapias_especiais) : null,
    demais_terapias ? parseFloat(demais_terapias) : null,
    id
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar cidade' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }
    res.json({ message: 'Cidade atualizada com sucesso!' });
  });
});

// Rota para deletar cidade
app.delete('/api/cidades/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM cidades WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar cidade' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cidade não encontrada' });
    }
    
    res.json({ message: 'Cidade deletada com sucesso!' });
  });
});

// ===== ROTAS PARA OPERADORAS =====
// Rota para cadastrar operadora
app.post('/api/operadoras', (req, res) => {
  const { nome_completo, vigencias, data_cadastro } = req.body;
  
  if (!nome_completo || nome_completo.trim() === '') {
    return res.status(400).json({ error: 'Nome completo da operadora é obrigatório' });
  }
  
  if (!data_cadastro || data_cadastro.trim() === '') {
    return res.status(400).json({ error: 'Data de cadastro é obrigatória' });
  }
  
  const sql = 'INSERT INTO operadoras (nome_completo, vigencias, data_cadastro) VALUES (?, ?, ?)';
  
  db.run(sql, [
    nome_completo.trim(), 
    vigencias ? vigencias.trim() : null, 
    data_cadastro.trim()
  ], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Operadora com este nome já existe' });
      }
      return res.status(500).json({ error: 'Erro ao cadastrar operadora' });
    }
    
    res.status(201).json({ 
      message: 'Operadora cadastrada com sucesso!',
      id: this.lastID 
    });
  });
});

// Rota para listar operadoras
app.get('/api/operadoras', (req, res) => {
  const sql = 'SELECT id, nome_completo, vigencias, data_cadastro FROM operadoras ORDER BY nome_completo';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar operadoras' });
    }
    
    res.json({ operadoras: rows });
  });
});

// Rota para buscar operadora por ID
app.get('/api/operadoras/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, nome_completo, vigencias, data_cadastro FROM operadoras WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar operadora' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Operadora não encontrada' });
    }
    
    res.json({ operadora: row });
  });
});

// Rota para atualizar operadora
app.put('/api/operadoras/:id', (req, res) => {
  const { id } = req.params;
  const { nome_completo, vigencias, data_cadastro } = req.body;
  
  if (!nome_completo || nome_completo.trim() === '') {
    return res.status(400).json({ error: 'Nome completo da operadora é obrigatório' });
  }
  
  if (!data_cadastro || data_cadastro.trim() === '') {
    return res.status(400).json({ error: 'Data de cadastro é obrigatória' });
  }
  
  const sql = 'UPDATE operadoras SET nome_completo = ?, vigencias = ?, data_cadastro = ? WHERE id = ?';
  
  db.run(sql, [
    nome_completo.trim(), 
    vigencias ? vigencias.trim() : null, 
    data_cadastro.trim(), 
    id
  ], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Operadora com este nome já existe' });
      }
      return res.status(500).json({ error: 'Erro ao atualizar operadora' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Operadora não encontrada' });
    }
    
    res.json({ message: 'Operadora atualizada com sucesso!' });
  });
});

// Rota para deletar operadora
app.delete('/api/operadoras/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM operadoras WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar operadora' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Operadora não encontrada' });
    }
    
    res.json({ message: 'Operadora deletada com sucesso!' });
  });
});

// Rota catch-all para React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 