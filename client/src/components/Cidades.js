import React, { useState, useEffect } from 'react';
import './Cidades.css';

function Cidades() {
  const [cidades, setCidades] = useState([]);
  const [formData, setFormData] = useState({ 
    nome: '', 
    estado: '', 
    codigo_ibge: '', 
    observacoes: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
        setFormData({ nome: '', estado: '', codigo_ibge: '', observacoes: '' });
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
      observacoes: cidade.observacoes || '' 
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
    setFormData({ nome: '', estado: '', codigo_ibge: '', observacoes: '' });
    setEditingId(null);
    setMessage('');
  };

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
          <div className="form-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Cadastrar')}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} disabled={loading}>
                Cancelar
              </button>
            )}
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