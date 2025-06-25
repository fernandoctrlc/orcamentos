const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodeHtmlToImage = require('node-html-to-image');

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
    idades TEXT NOT NULL, -- JSON string
    valor_total DECIMAL(10,2) NOT NULL,
    data_orcamento TEXT NOT NULL,
    corretor_id INTEGER NOT NULL,
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

// ===== ROTAS PARA TABELA DE PREÇOS =====
// Cadastrar preço
app.post('/api/precos', (req, res) => {
  const {
    cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id,
    validade_inicio, validade_fim,
    valor_00_18, valor_19_23, valor_24_28, valor_29_33, valor_34_38,
    valor_39_43, valor_44_48, valor_49_53, valor_54_58, valor_59_mais
  } = req.body;

  if (!cidade_id || !operadora_id || !tipo_coparticipacao || !acomodacao_id || !modalidade_id || !validade_inicio || !validade_fim) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const sql = `INSERT INTO precos (
    cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id, validade_inicio, validade_fim,
    valor_00_18, valor_19_23, valor_24_28, valor_29_33, valor_34_38, valor_39_43, valor_44_48, valor_49_53, valor_54_58, valor_59_mais
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [
    cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id, validade_inicio, validade_fim,
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
  const sql = `SELECT p.*, c.nome as cidade_nome, o.nome_completo as operadora_nome, a.nome as acomodacao_nome, m.nome as modalidade_nome
    FROM precos p
    JOIN cidades c ON p.cidade_id = c.id
    JOIN operadoras o ON p.operadora_id = o.id
    JOIN acomodacoes a ON p.acomodacao_id = a.id
    JOIN modalidades m ON p.modalidade_id = m.id
    ORDER BY c.nome, o.nome_completo, m.nome, a.nome, validade_inicio`;
  db.all(sql, [], (err, rows) => {
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
    cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id,
    validade_inicio, validade_fim,
    valor_00_18, valor_19_23, valor_24_28, valor_29_33, valor_34_38,
    valor_39_43, valor_44_48, valor_49_53, valor_54_58, valor_59_mais
  } = req.body;

  if (!cidade_id || !operadora_id || !tipo_coparticipacao || !acomodacao_id || !modalidade_id || !validade_inicio || !validade_fim) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const sql = `UPDATE precos SET cidade_id = ?, operadora_id = ?, tipo_coparticipacao = ?, acomodacao_id = ?, modalidade_id = ?, validade_inicio = ?, validade_fim = ?,
    valor_00_18 = ?, valor_19_23 = ?, valor_24_28 = ?, valor_29_33 = ?, valor_34_38 = ?, valor_39_43 = ?, valor_44_48 = ?, valor_49_53 = ?, valor_54_58 = ?, valor_59_mais = ?
    WHERE id = ?`;
  db.run(sql, [
    cidade_id, operadora_id, tipo_coparticipacao, acomodacao_id, modalidade_id, validade_inicio, validade_fim,
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
  const { tabela_preco_id, nome, telefone, idades, corretor_id } = req.body;
  if (!tabela_preco_id || !nome || !telefone || !idades || !Array.isArray(idades) || idades.length === 0 || !corretor_id || isNaN(Number(corretor_id))) {
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
    const sql = `INSERT INTO orcamentos (tabela_preco_id, nome, telefone, idades, valor_total, data_orcamento, corretor_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [
      tabela_preco_id,
      nome.trim(),
      telefone.trim(),
      JSON.stringify(idades),
      valor_total,
      data_orcamento,
      corretor_id
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
  const sql = `SELECT o.*, p.cidade_id, p.tipo_coparticipacao, p.acomodacao_id, p.modalidade_id, p.validade_inicio, p.validade_fim
    FROM orcamentos o
    JOIN precos p ON o.tabela_preco_id = p.id
    ORDER BY o.data_orcamento DESC, o.id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar orçamentos' });
    }
    // Parse idades
    rows.forEach(row => { row.idades = JSON.parse(row.idades); });
    res.json({ orcamentos: rows });
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

// Endpoint para gerar orçamento em PNG
app.post('/api/orcamento-png', async (req, res) => {
  const { nome, telefone, tabela, idadesValores, vendedor_nome, vendedor_telefone, tabela_preco_id } = req.body;

  // Calcular o total
  let total = 0;
  if (Array.isArray(idadesValores)) {
    total = idadesValores.reduce((acc, item) => {
      let valor = item.valor;
      if (typeof valor === 'string') valor = parseFloat(valor.replace(',', '.'));
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
  }

  // Buscar coparticipações da cidade vinculada à tabela de preço
  let coparticipacoesHtml = '';
  if (tabela_preco_id) {
    try {
      // Buscar tabela de preço
      const tabelaPreco = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM precos WHERE id = ?', [tabela_preco_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      if (tabelaPreco && tabelaPreco.cidade_id) {
        // Buscar cidade vinculada
        const cidade = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM cidades WHERE id = ?', [tabelaPreco.cidade_id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        if (cidade) {
          coparticipacoesHtml = `
            <div style='margin: 24px 0 0 0; padding: 16px; background: #f4f7fa; border-radius: 10px; border: 1.5px solid #1976d2;'>
              <h3 style='color:#1976d2; margin:0 0 8px 0; font-size:18px;'>Coparticipações da Cidade (${cidade.nome} - ${cidade.estado})</h3>
              <ul style='list-style:none; padding:0; margin:0; font-size:15px;'>
                <li><strong>Consultas Eletivas:</strong> R$ ${cidade.consultas_eletivas ? Number(cidade.consultas_eletivas).toFixed(2).replace('.', ',') : '-'}</li>
                <li><strong>Consultas Urgências:</strong> R$ ${cidade.consultas_urgencias ? Number(cidade.consultas_urgencias).toFixed(2).replace('.', ',') : '-'}</li>
                <li><strong>Exames Simples:</strong> R$ ${cidade.exames_simples ? Number(cidade.exames_simples).toFixed(2).replace('.', ',') : '-'}</li>
                <li><strong>Exames Complexos:</strong> R$ ${cidade.exames_complexos ? Number(cidade.exames_complexos).toFixed(2).replace('.', ',') : '-'}</li>
                <li><strong>Terapias Especiais:</strong> R$ ${cidade.terapias_especiais ? Number(cidade.terapias_especiais).toFixed(2).replace('.', ',') : '-'}</li>
                <li><strong>Demais Terapias:</strong> R$ ${cidade.demais_terapias ? Number(cidade.demais_terapias).toFixed(2).replace('.', ',') : '-'}</li>
              </ul>
            </div>
          `;
        }
      }
    } catch (err) {
      // Se der erro, não exibe coparticipações
      coparticipacoesHtml = '';
    }
  }

  const html = `
    <div style="background: #fff; padding: 0; margin: 0;">
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9f9f9; padding: 32px 24px; border-radius: 16px; border: 2px solid #1976d2; width: 520px; box-shadow: 0 4px 16px rgba(25,118,210,0.08); margin: 5mm auto; display: block;">
        <div style='text-align:center; margin-bottom: 16px;'>
          <img src="data:image/png;base64,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6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1sbnM6SXB0YzR4bXBFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgZXhpZjpEYXRlVGltZU9yaWdpbmFsPSIyMDI1LTA2LTI0VDIxOjUwOjQzKzAwOjAwIiBJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlRmlsZVR5cGU9Imh0dHA6Ly9jdi5pcHRjLm9yZy9uZXdzY29kZXMvZGlnaXRhbHNvdXJjZXR5cGUvY29tcG9zaXRlV2l0aFRyYWluZWRBbGdvcml0aG1pY01lZGlhIiBJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlVHlwZT0iaHR0cDovL2N2LmlwdGMub3JnL25ld3Njb2Rlcy9kaWdpdGFsc291cmNldHlwZS9jb21wb3NpdGVXaXRoVHJhaW5lZEFsZ29yaXRobWljTWVkaWEiIHBob3Rvc2hvcDpDcmVkaXQ9IkVkaXRlZCB3aXRoIEdvb2dsZSBBSSIgcGhvdG9zaG9wOkRhdGVDcmVhdGVkPSIyMDI1LTA2LTI0VDIxOjUwOjQzKzAwOjAwIi8+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgPD94cGFja2V0IGVuZD0idyI/Pqh780QAACAASURBVHic1L17sG7JVR/2+/U+575HI81DjwEkgUCjh8E8BQLKgtgQTEhRcagEAsEoVgqQg4NdmBCqnCBc2JgKYBvbFWRhJy4HOyAjgSFghBElCxQJJIFkPRAaaR5i3s87d+be8/h65Y/u1b36tff+vnPuQFqje77du3v16rVWr7W6e3VuitcgefL8uiH/m6z7147FFeHGPlX717BSL/PKMzyvL9+Pnvt+178fXe02SVo09yPu4avr21WuR3rqUUWbJRct7ZRwr/OzP7//n9X7I67ny1/6acD99H/u+7/x53Udtyk/17+9SLI60v4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wSUoDpXoEYUvS4EbAxCFhMHEeoqkGJE6BvTNcNNoOQQW3BYTB03J0U5lxScvQcS4GDY9GQQo+IidUoUQ78DxONdodDyNBc2IzeIqWANOxrs6F+qAf0OhCG9oSNUlgbxUy4AUzojA+amE3UOsjgyT/ZOiGEDbqT9X/8D5zShk8fEnbMAAADMmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1sbnM6SXB0YzR4bXBFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgZXhpZjpEYXRlVGltZU9yaWdpbmFsPSIyMDI1LTA2LTI0VDIxOjUwOjQzKzAwOjAwIiBJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlRmlsZVR5cGU9Imh0dHA6Ly9jdi5pcHRjLm9yZy9uZXdzY29kZXMvZGlnaXRhbHNvdXJjZXR5cGUvY29tcG9zaXRlV2l0aFRyYWluZWRBbGdvcml0aG1pY01lZGlhIiBJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlVHlwZT0iaHR0cDovL2N2LmlwdGMub3JnL25ld3Njb2Rlcy9kaWdpdGFsc291cmNldHlwZS9jb21wb3NpdGVXaXRoVHJhaW5lZEFsZ29yaXRobWljTWVkaWEiIHBob3Rvc2hvcDpDcmVkaXQ9IkVkaXRlZCB3aXRoIEdvb2dsZSBBSSIgcGhvdG9zaG9wOkRhdGVDcmVhdGVkPSIyMDI1LTA2LTI0VDIxOjUwOj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dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1sbnM6SXB0YzR4bXBFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgZXhpZjpEYXRlVGltZU9yaWdpbmFsPSIyMDI1LTA2LTI0VDIxOjUwOjQzKzAwOjAwIiBJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlRmlsZVR5cGU9Imh0dHA6Ly9jdi5pcHRjLm9yZy9uZXdzY29kZXMvZGlnaXRhbHNvdXJjZXR5cGUvY29tcG9zaXRlV2l0aFRyYWluZWRBbGdvcml0aG1pY01lZGlhIiBJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlVHlwZT0iaHR0cDovL2N2LmlwdGMub3JnL25ld3Njb2Rlcy9kaWdpdGFsc291cmNldHlwZS9jb21wb3NpdGVXaXRoVHJhaW5lZEFsZ29yaXRobWljTWVkaWEiIHBob3Rvc2hvcDpDcmVkaXQ9IkVkaXRlZCB3aXRoIEdvb2dsZSBBSSIgcGhvdG9zaG9wOkRhdGVDcmVhdGVkPSIyMDI1LTA2LTI0VDIxOjUwOjQzKzAwOjAwIi8+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgPD94cGFja2V0IGVuZD0idyI/Pqh780QAACAASURBVHic1L17sG7JVR/2+/U+575HI81DjwEkgUCjh8E8BQLKgtgQTEhRcagEAsEoVgqQg4NdmBCqnCBc2JgKYBvbFWRhJy4HOyAjgSFghBElCxQJJIFkPRAaaR5i3s87d+be8/h65Y/u1b36tff+vnPuQFqje77du3v16rVWr7W6e3VuitcgefL8uiH/m6z7147FFeHGPlX717BSL/PKMzyvL9+Pnvt+178fXe02SVo09yPu4avr21WuR3rqUUWbJRct7ZRwr/OzP7//n9X7I67ny1/6acD99H/u+7/x53Udtyk/17+9SLI6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RHFwSUoDpXoEYUvS4EbAxCFhMHEeoqkGJE6BvTNcNNoOQQW3BYTB03J0U5lxScvQcS4GDY9GQQo+IidUoUQ78DxONdodDyNBc2IzeIqWANOxrs6F+qAf0OhCG9oSNUlgbxUy4AUzojA+amE3UOsjgyT/ZOiGEDbqT9X/8D5zShk8fEnbMAAADMmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1sbnM6SXB0YzR4bXBFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgZXhpZjpEYXRlVGltZU9yaWdpbmFsPSIyMDI1LTA2LTI0VDIxOjUwOjQzKzAwOjAwIiBJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlRmlsZVR5cGU9Imh0dHA6Ly9jdi5pcHRjLm9yZy9uZXdzY29kZXMvZGlnaXRhbHNvdXJjZXR5cGUvY29tcG9zaXRlV2l0aFRyYWluZWRBbGdvcml0aG1pY01lZGlhIiBJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlVHlwZT0iaHR0cDovL2N2LmlwdGMub3JnL25ld3Njb2Rlcy9kaWdpdGFsc291cmNldHlwZS9jb21wb3NpdGVXaXRoVHJhaW5lZEFsZ29yaXRobWljTWVkaWEiIHBob3Rvc2hvcDpDcmVkaXQ9IkVkaXRlZCB3aXRoIEdvb2dsZSBBSSIgcGhvdG9zaG9wOkRhdGVDcmVhdGVkPSIyMDI1LTA2LTI0VDIxOjU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