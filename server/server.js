const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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

  // Tabela de preços
  db.run(`CREATE TABLE IF NOT EXISTS precos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cidade_id INTEGER NOT NULL,
    operadora_id INTEGER NOT NULL,
    tipo_coparticipacao TEXT NOT NULL CHECK(tipo_coparticipacao IN ('Com Coparticipação', 'Coparticipação Parcial')),
    acomodacao_id INTEGER NOT NULL,
    modalidade_id INTEGER NOT NULL,
    tipo_documento TEXT NOT NULL CHECK(tipo_documento IN ('CPF', 'CNPJ')) DEFAULT 'CPF',
    validade_inicio TEXT NOT NULL,
    validade_fim TEXT NOT NULL,
    valor_00_18 DECIMAL(10,2),
    valor_19_23 DECIMAL(10,2),
    valor_24_28 DECIMAL(10,2),
    valor_29_33 DECIMAL(10,2),
    valor_34_38 DECIMAL(10,2),
    valor_39_43 DECIMAL(10,2),
    valor_44_48 DECIMAL(10,2),
    valor_49_53 DECIMAL(10,2),
    valor_54_58 DECIMAL(10,2),
    valor_59_mais DECIMAL(10,2),
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cidade_id) REFERENCES cidades(id),
    FOREIGN KEY (operadora_id) REFERENCES operadoras(id),
    FOREIGN KEY (acomodacao_id) REFERENCES acomodacoes(id),
    FOREIGN KEY (modalidade_id) REFERENCES modalidades(id)
  )`);

  // Tabela de orçamentos
  db.run(`CREATE TABLE IF NOT EXISTS orcamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tabela_preco_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    tipo_documento TEXT NOT NULL CHECK(tipo_documento IN ('CPF', 'CNPJ')) DEFAULT 'CPF',
    idades TEXT NOT NULL, -- JSON string
    valor_total DECIMAL(10,2) NOT NULL,
    data_orcamento TEXT NOT NULL,
    corretor_id INTEGER NOT NULL,
    estagio TEXT NOT NULL DEFAULT 'leads',
    observacoes TEXT, -- JSON string
    dataCriacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tabela_preco_id) REFERENCES precos(id),
    FOREIGN KEY (corretor_id) REFERENCES corretores(id)
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

// ===== ROTAS PARA PREÇOS =====
// Cadastrar preço
app.post('/api/precos', (req, res) => {
  const { cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id, tipo_documento, validade_inicio, validade_fim, valor_00_18, valor_19_23, valor_24_28, valor_29_33, valor_34_38, valor_39_43, valor_44_48, valor_49_53, valor_54_58, valor_59_mais } = req.body;
  if (!cidade_id || !operadora_id || !tipo_coparticipacao || !acomodacao_id || !modalidade_id || !tipo_documento || !validade_inicio || !validade_fim) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }
  const sql = `INSERT INTO precos (cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id, tipo_documento, validade_inicio, validade_fim, valor_00_18, valor_19_23, valor_24_28, valor_29_33, valor_34_38, valor_39_43, valor_44_48, valor_49_53, valor_54_58, valor_59_mais) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id, tipo_documento, validade_inicio, validade_fim,
    valor_00_18 ? parseFloat(valor_00_18) : null,
    valor_19_23 ? parseFloat(valor_19_23) : null,
    valor_24_28 ? parseFloat(valor_24_28) : null,
    valor_29_33 ? parseFloat(valor_29_33) : null,
    valor_34_38 ? parseFloat(valor_34_38) : null,
    valor_39_43 ? parseFloat(valor_39_43) : null,
    valor_44_48 ? parseFloat(valor_44_48) : null,
    valor_49_53 ? parseFloat(valor_49_53) : null,
    valor_54_58 ? parseFloat(valor_54_58) : null,
    valor_59_mais ? parseFloat(valor_59_mais) : null
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao cadastrar preço' });
    }
    res.status(201).json({ message: 'Preço cadastrado com sucesso!', id: this.lastID });
  });
});

// Listar preços
app.get('/api/precos', (req, res) => {
  const { tipo_documento, cidade_id } = req.query;
  
  let sql = `SELECT p.*, c.nome as cidade_nome, o.nome_completo as operadora_nome, a.nome as acomodacao_nome, m.nome as modalidade_nome
    FROM precos p
    JOIN cidades c ON p.cidade_id = c.id
    JOIN operadoras o ON p.operadora_id = o.id
    JOIN acomodacoes a ON p.acomodacao_id = a.id
    JOIN modalidades m ON p.modalidade_id = m.id`;
  let params = [];
  let conditions = [];
  
  if (tipo_documento) {
    conditions.push('p.tipo_documento = ?');
    params.push(tipo_documento);
  }
  
  if (cidade_id) {
    conditions.push('p.cidade_id = ?');
    params.push(cidade_id);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY c.nome, o.nome_completo, m.nome, a.nome, validade_inicio';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar preços' });
    }
    res.json({ precos: rows });
  });
});

// Buscar preço por ID
app.get('/api/precos/:id', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM precos WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar preço' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Preço não encontrado' });
    }
    res.json({ preco: row });
  });
});

// Atualizar preço
app.put('/api/precos/:id', (req, res) => {
  const { id } = req.params;
  const {
    cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id, tipo_documento,
    validade_inicio, validade_fim,
    valor_00_18, valor_19_23, valor_24_28, valor_29_33, valor_34_38,
    valor_39_43, valor_44_48, valor_49_53, valor_54_58, valor_59_mais
  } = req.body;

  if (!cidade_id || !operadora_id || !tipo_coparticipacao || !acomodacao_id || !modalidade_id || !tipo_documento || !validade_inicio || !validade_fim) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const sql = `UPDATE precos SET cidade_id = ?, operadora_id = ?, tipo_coparticipacao = ?, acomodacao_id = ?, modalidade_id = ?, tipo_documento = ?, validade_inicio = ?, validade_fim = ?,
    valor_00_18 = ?, valor_19_23 = ?, valor_24_28 = ?, valor_29_33 = ?, valor_34_38 = ?, valor_39_43 = ?, valor_44_48 = ?, valor_49_53 = ?, valor_54_58 = ?, valor_59_mais = ?
    WHERE id = ?`;
  db.run(sql, [
    cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id, tipo_documento, validade_inicio, validade_fim,
    valor_00_18 ? parseFloat(valor_00_18) : null,
    valor_19_23 ? parseFloat(valor_19_23) : null,
    valor_24_28 ? parseFloat(valor_24_28) : null,
    valor_29_33 ? parseFloat(valor_29_33) : null,
    valor_34_38 ? parseFloat(valor_34_38) : null,
    valor_39_43 ? parseFloat(valor_39_43) : null,
    valor_44_48 ? parseFloat(valor_44_48) : null,
    valor_49_53 ? parseFloat(valor_49_53) : null,
    valor_54_58 ? parseFloat(valor_54_58) : null,
    valor_59_mais ? parseFloat(valor_59_mais) : null,
    id
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar preço' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Preço não encontrado' });
    }
    res.json({ message: 'Preço atualizado com sucesso!' });
  });
});

// Deletar preço
app.delete('/api/precos/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM precos WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar preço' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Preço não encontrado' });
    }
    res.json({ message: 'Preço deletado com sucesso!' });
  });
});

// ===== ROTAS PARA ORÇAMENTOS =====
// Cadastrar orçamento
app.post('/api/orcamentos', (req, res) => {
  const { tabela_preco_id, nome, telefone, tipo_documento, idades, corretor_id } = req.body;
  if (!tabela_preco_id || !nome || !telefone || !tipo_documento || !idades || !Array.isArray(idades) || idades.length === 0 || !corretor_id || isNaN(Number(corretor_id))) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos e pelo menos uma idade deve ser informada.' });
  }

  // Buscar tabela de preço
  db.get('SELECT * FROM precos WHERE id = ?', [tabela_preco_id], (err, tabela) => {
    if (err || !tabela) {
      return res.status(400).json({ error: 'Tabela de preço não encontrada.' });
    }
    // Calcular valor total
    let valor_total = 0;
    idades.forEach(idade => {
      let faixa = '';
      if (idade <= 18) faixa = 'valor_00_18';
      else if (idade <= 23) faixa = 'valor_19_23';
      else if (idade <= 28) faixa = 'valor_24_28';
      else if (idade <= 33) faixa = 'valor_29_33';
      else if (idade <= 38) faixa = 'valor_34_38';
      else if (idade <= 43) faixa = 'valor_39_43';
      else if (idade <= 48) faixa = 'valor_44_48';
      else if (idade <= 53) faixa = 'valor_49_53';
      else if (idade <= 58) faixa = 'valor_54_58';
      else faixa = 'valor_59_mais';
      valor_total += Number(tabela[faixa] || 0);
    });
    const data_orcamento = new Date().toISOString().split('T')[0];
    const sql = `INSERT INTO orcamentos (tabela_preco_id, nome, telefone, tipo_documento, idades, valor_total, data_orcamento, corretor_id, estagio, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [
      tabela_preco_id,
      nome.trim(),
      telefone.trim(),
      tipo_documento,
      JSON.stringify(idades),
      valor_total,
      data_orcamento,
      corretor_id,
      'leads',
      JSON.stringify([])
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao cadastrar orçamento' });
      }
      res.status(201).json({ message: 'Orçamento cadastrado com sucesso!', id: this.lastID, valor_total });
    });
  });
});

// Listar orçamentos
app.get('/api/orcamentos', (req, res) => {
  const { corretor_id, tipoUsuario } = req.query;
  let sql = `SELECT o.*, p.cidade_id, p.tipo_coparticipacao, p.acomodacao_id, p.modalidade_id, p.validade_inicio, p.validade_fim
    FROM orcamentos o
    JOIN precos p ON o.tabela_preco_id = p.id`;
  let params = [];
  if (tipoUsuario !== 'admin' && corretor_id) {
    sql += ' WHERE o.corretor_id = ?';
    params.push(corretor_id);
  }
  sql += ' ORDER BY o.data_orcamento DESC, o.id DESC';
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar orçamentos' });
    }
    // Parse idades e observacoes
    rows.forEach(row => {
      row.idades = JSON.parse(row.idades);
      row.observacoes = row.observacoes ? JSON.parse(row.observacoes) : [];
    });
    res.json({ orcamentos: rows });
  });
});

// Atualizar estágio e observações do orçamento
app.put('/api/orcamentos/:id', (req, res) => {
  const { id } = req.params;
  const { estagio, observacoes } = req.body;
  if (!estagio || !Array.isArray(observacoes)) {
    return res.status(400).json({ error: 'Estágio e observações são obrigatórios.' });
  }
  const sql = 'UPDATE orcamentos SET estagio = ?, observacoes = ? WHERE id = ?';
  db.run(sql, [estagio, JSON.stringify(observacoes), id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar orçamento' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }
    res.json({ message: 'Orçamento atualizado com sucesso!' });
  });
});

// Buscar orçamento por ID
app.get('/api/orcamentos/:id', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM orcamentos WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar orçamento' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }
    row.idades = JSON.parse(row.idades);
    res.json({ orcamento: row });
  });
});

// Deletar orçamento
app.delete('/api/orcamentos/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM orcamentos WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar orçamento' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }
    res.json({ message: 'Orçamento deletado com sucesso!' });
  });
});

// ===== ROTA DE LOGIN =====
app.post('/api/login', (req, res) => {
  const { cpf, senha } = req.body;
  if (!cpf || !senha) {
    return res.status(400).json({ success: false, error: 'CPF e senha são obrigatórios' });
  }
  const sql = 'SELECT id, nome, telefone, senha FROM corretores WHERE cpf = ?';
  db.get(sql, [cpf], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Erro ao buscar corretor' });
    }
    if (!row || row.senha !== senha) {
      return res.status(401).json({ success: false, error: 'CPF ou senha inválidos' });
    }
    // Token fixo para compatibilidade com o frontend
    const token = 'admin-token';
    res.json({ success: true, token, id: row.id, nome: row.nome, telefone: row.telefone });
  });
});

// Fallback para SPA React: serve index.html para qualquer rota não-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT} (acessível em todas as interfaces)`);
});