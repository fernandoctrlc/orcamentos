import React, { useState, useEffect } from 'react';
import './Operadoras.css';

function Operadoras() {
  const [operadoras, setOperadoras] = useState([]);
  const [formData, setFormData] = useState({ 
    nome_completo: '', 
    vigencias: '', 
    data_cadastro: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    carregarOperadoras();
  }, []);

  const carregarOperadoras = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/operadoras');
      const data = await response.json();
      if (response.ok) {
        setOperadoras(data.operadoras);
      } else {
        setMessage('Erro ao carregar operadoras');
      }
    } catch (error) {
      setMessage('Erro ao carregar operadoras');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_completo.trim()) {
      setMessage('Nome completo é obrigatório');
      return;
    }
    if (!formData.data_cadastro) {
      setMessage('Data de cadastro é obrigatória');
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/operadoras/${editingId}` : '/api/operadoras';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setFormData({ 
          nome_completo: '', 
          vigencias: '', 
          data_cadastro: new Date().toISOString().split('T')[0]
        });
        setEditingId(null);
        carregarOperadoras();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao salvar operadora');
    }
    setLoading(false);
  };

  const handleEdit = (operadora) => {
    setFormData({ 
      nome_completo: operadora.nome_completo, 
      vigencias: operadora.vigencias || '', 
      data_cadastro: operadora.data_cadastro
    });
    setEditingId(operadora.id);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta operadora?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/operadoras/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        carregarOperadoras();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao deletar operadora');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({ 
      nome_completo: '', 
      vigencias: '', 
      data_cadastro: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setMessage('');
  };

  const formatarData = (data) => {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="operadoras-container">
      <h2>🏢 Gestão de Operadoras</h2>
      
      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-section">
        <h3>{editingId ? 'Editar Operadora' : 'Nova Operadora'}</h3>
        <form onSubmit={handleSubmit} className="operadora-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome_completo">Nome Completo da Operadora:</label>
              <input
                type="text"
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                placeholder="Ex: Unimed São Paulo"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="data_cadastro">Data de Cadastro:</label>
              <input
                type="date"
                id="data_cadastro"
                value={formData.data_cadastro}
                onChange={(e) => setFormData({ ...formData, data_cadastro: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="vigencias">Vigências:</label>
            <textarea
              id="vigencias"
              value={formData.vigencias}
              onChange={(e) => setFormData({ ...formData, vigencias: e.target.value })}
              placeholder="Informações sobre vigências, prazos, etc..."
              rows="3"
            />
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
        <h3>Operadoras Cadastradas</h3>
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : operadoras.length === 0 ? (
          <div className="empty-state">Nenhuma operadora cadastrada</div>
        ) : (
          <div className="operadoras-grid">
            {operadoras.map((operadora) => (
              <div key={operadora.id} className="operadora-card">
                <div className="operadora-info">
                  <span className="operadora-id">#{operadora.id}</span>
                  <h4>{operadora.nome_completo}</h4>
                  <p className="data-cadastro">Cadastrada em: {formatarData(operadora.data_cadastro)}</p>
                  {operadora.vigencias && (
                    <div className="vigencias">
                      <strong>Vigências:</strong>
                      <p>{operadora.vigencias}</p>
                    </div>
                  )}
                </div>
                <div className="operadora-actions">
                  <button
                    onClick={() => handleEdit(operadora)}
                    className="btn-edit"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(operadora.id)}
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

export default Operadoras; 