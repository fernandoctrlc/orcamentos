import React, { useState, useEffect } from 'react';
import './Cidades.css';
import ListaCidades from './ListaCidades';

function Cidades() {
  const [cidades, setCidades] = useState([]);
  const [formData, setFormData] = useState({ 
    nome: '', 
    estado: '', 
    codigo_ibge: '', 
    observacoes: '',
    consultas_eletivas: '',
    consultas_urgencias: '',
    exames_simples: '',
    exames_complexos: '',
    terapias_especiais: '',
    demais_terapias: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mostrarLista, setMostrarLista] = useState(false);

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    carregarCidades();
  }, []);

  const carregarCidades = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cidades');
      const data = await response.json();
      if (response.ok) {
        setCidades(data.cidades);
      } else {
        setMessage('Erro ao carregar cidades');
      }
    } catch (error) {
      setMessage('Erro ao carregar cidades');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setMessage('Nome é obrigatório');
      return;
    }
    if (!formData.estado) {
      setMessage('Estado é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/cidades/${editingId}` : '/api/cidades';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setFormData({ nome: '', estado: '', codigo_ibge: '', observacoes: '', consultas_eletivas: '', consultas_urgencias: '', exames_simples: '', exames_complexos: '', terapias_especiais: '', demais_terapias: '' });
        setEditingId(null);
        carregarCidades();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao salvar cidade');
    }
    setLoading(false);
  };

  const handleEdit = (cidade) => {
    setFormData({ 
      nome: cidade.nome, 
      estado: cidade.estado, 
      codigo_ibge: cidade.codigo_ibge || '', 
      observacoes: cidade.observacoes || '',
      consultas_eletivas: cidade.consultas_eletivas || '',
      consultas_urgencias: cidade.consultas_urgencias || '',
      exames_simples: cidade.exames_simples || '',
      exames_complexos: cidade.exames_complexos || '',
      terapias_especiais: cidade.terapias_especiais || '',
      demais_terapias: cidade.demais_terapias || ''
    });
    setEditingId(cidade.id);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta cidade?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/cidades/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        carregarCidades();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao deletar cidade');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({ nome: '', estado: '', codigo_ibge: '', observacoes: '', consultas_eletivas: '', consultas_urgencias: '', exames_simples: '', exames_complexos: '', terapias_especiais: '', demais_terapias: '' });
    setEditingId(null);
    setMessage('');
  };

  const handleCopiarCidade = (cidade) => {
    setFormData({
      nome: '', // Limpa para forçar novo nome
      estado: cidade.estado,
      codigo_ibge: '', // Limpa para forçar novo código
      observacoes: cidade.observacoes || '',
      consultas_eletivas: cidade.consultas_eletivas || '',
      consultas_urgencias: cidade.consultas_urgencias || '',
      exames_simples: cidade.exames_simples || '',
      exames_complexos: cidade.exames_complexos || '',
      terapias_especiais: cidade.terapias_especiais || '',
      demais_terapias: cidade.demais_terapias || ''
    });
    setEditingId(null); // Garante que será um novo cadastro
    setMostrarLista(false);
    setMessage('Preencha o nome e o código IBGE para copiar este município.');
  };

  if (mostrarLista) {
    return <ListaCidades onVoltar={() => setMostrarLista(false)} onCopiarCidade={handleCopiarCidade} />;
  }

  return (
    <div className="cidades-container">
      <h2>🏙️ Gestão de Cidades</h2>
      
      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-section">
        <h3>{editingId ? 'Editar Cidade' : 'Nova Cidade'}</h3>
        <form onSubmit={handleSubmit} className="cidade-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">Nome da Cidade:</label>
              <input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: São Paulo"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="estado">Estado:</label>
              <select
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                required
              >
                <option value="">Selecione o estado</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigo_ibge">Código IBGE:</label>
              <input
                type="text"
                id="codigo_ibge"
                value={formData.codigo_ibge}
                onChange={(e) => setFormData({ ...formData, codigo_ibge: e.target.value })}
                placeholder="Ex: 3550308"
              />
            </div>
            <div className="form-group">
              <label htmlFor="observacoes">Observações:</label>
              <input
                type="text"
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="consultas_eletivas">Consultas Eletivas:</label>
              <input
                type="number"
                step="0.01"
                id="consultas_eletivas"
                value={formData.consultas_eletivas}
                onChange={(e) => setFormData({ ...formData, consultas_eletivas: e.target.value.replace(',', '.') })}
                placeholder="Consultas Eletivas"
              />
            </div>
            <div className="form-group">
              <label htmlFor="consultas_urgencias">Consultas Urgencias:</label>
              <input
                type="number"
                step="0.01"
                id="consultas_urgencias"
                value={formData.consultas_urgencias}
                onChange={(e) => setFormData({ ...formData, consultas_urgencias: e.target.value.replace(',', '.') })}
                placeholder="Consultas Urgencias"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exames_simples">Exames Simples:</label>
              <input
                type="number"
                step="0.01"
                id="exames_simples"
                value={formData.exames_simples}
                onChange={(e) => setFormData({ ...formData, exames_simples: e.target.value.replace(',', '.') })}
                placeholder="Exames Simples"
              />
            </div>
            <div className="form-group">
              <label htmlFor="exames_complexos">Exames Complexos:</label>
              <input
                type="number"
                step="0.01"
                id="exames_complexos"
                value={formData.exames_complexos}
                onChange={(e) => setFormData({ ...formData, exames_complexos: e.target.value.replace(',', '.') })}
                placeholder="Exames Complexos"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="terapias_especiais">Terapias Especiais:</label>
              <input
                type="number"
                step="0.01"
                id="terapias_especiais"
                value={formData.terapias_especiais}
                onChange={(e) => setFormData({ ...formData, terapias_especiais: e.target.value.replace(',', '.') })}
                placeholder="Terapias Especiais"
              />
            </div>
            <div className="form-group">
              <label htmlFor="demais_terapias">Demais Terapias:</label>
              <input
                type="number"
                step="0.01"
                id="demais_terapias"
                value={formData.demais_terapias}
                onChange={(e) => setFormData({ ...formData, demais_terapias: e.target.value.replace(',', '.') })}
                placeholder="Demais Terapias"
              />
            </div>
          </div>
          <div className="form-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Cadastrar')}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="cancel-btn">
                Cancelar
              </button>
            )}
            <button type="button" className="secondary" onClick={() => setMostrarLista(true)}>
              🔍 Consultar no Banco
            </button>
          </div>
        </form>
      </div>

      <div className="list-section">
        <h3>Cidades Cadastradas</h3>
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : cidades.length === 0 ? (
          <div className="empty-state">Nenhuma cidade cadastrada</div>
        ) : (
          <div className="cidades-grid">
            {cidades.map((cidade) => (
              <div key={cidade.id} className="cidade-card">
                <div className="cidade-info">
                  <span className="cidade-id">#{cidade.id}</span>
                  <h4>{cidade.nome} - {cidade.estado}</h4>
                  {cidade.codigo_ibge && (
                    <p className="codigo-ibge">IBGE: {cidade.codigo_ibge}</p>
                  )}
                  {cidade.observacoes && (
                    <p className="observacoes">{cidade.observacoes}</p>
                  )}
                </div>
                <div className="cidade-actions">
                  <button
                    onClick={() => handleEdit(cidade)}
                    className="btn-edit"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(cidade.id)}
                    className="btn-delete"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Cidades; 