import React, { useState, useEffect } from 'react';
import './Acomodacoes.css';

function Acomodacoes() {
  const [acomodacoes, setAcomodacoes] = useState([]);
  const [formData, setFormData] = useState({ nome: '', registro_ans: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    carregarAcomodacoes();
  }, []);

  const carregarAcomodacoes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/acomodacoes');
      const data = await response.json();
      if (response.ok) {
        setAcomodacoes(data.acomodacoes);
      } else {
        setMessage('Erro ao carregar acomodações');
      }
    } catch (error) {
      setMessage('Erro ao carregar acomodações');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setMessage('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/acomodacoes/${editingId}` : '/api/acomodacoes';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setFormData({ nome: '', registro_ans: '' });
        setEditingId(null);
        carregarAcomodacoes();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao salvar acomodação');
    }
    setLoading(false);
  };

  const handleEdit = (acomodacao) => {
    setFormData({ 
      nome: acomodacao.nome, 
      registro_ans: acomodacao.registro_ans || '' 
    });
    setEditingId(acomodacao.id);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta acomodação?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/acomodacoes/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        carregarAcomodacoes();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao deletar acomodação');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({ nome: '', registro_ans: '' });
    setEditingId(null);
    setMessage('');
  };

  return (
    <div className="acomodacoes-container">
      <h2>🏠 Gestão de Acomodações</h2>
      
      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-section">
        <h3>{editingId ? 'Editar Acomodação' : 'Nova Acomodação'}</h3>
        <form onSubmit={handleSubmit} className="acomodacao-form">
          <div className="form-group">
            <label htmlFor="nome">Nome da Acomodação:</label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Individual, Duplo, Triplo..."
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="registro_ans">Registro ANS:</label>
            <input
              type="text"
              id="registro_ans"
              value={formData.registro_ans}
              onChange={(e) => setFormData({ ...formData, registro_ans: e.target.value })}
              placeholder="Ex: 123456789"
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
        <h3>Acomodações Cadastradas</h3>
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : acomodacoes.length === 0 ? (
          <div className="empty-state">Nenhuma acomodação cadastrada</div>
        ) : (
          <div className="acomodacoes-grid">
            {acomodacoes.map((acomodacao) => (
              <div key={acomodacao.id} className="acomodacao-card">
                <div className="acomodacao-info">
                  <span className="acomodacao-id">#{acomodacao.id}</span>
                  <h4>{acomodacao.nome}</h4>
                  {acomodacao.registro_ans && (
                    <p className="registro-ans">Registro ANS: {acomodacao.registro_ans}</p>
                  )}
                </div>
                <div className="acomodacao-actions">
                  <button
                    onClick={() => handleEdit(acomodacao)}
                    className="btn-edit"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(acomodacao.id)}
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

export default Acomodacoes; 