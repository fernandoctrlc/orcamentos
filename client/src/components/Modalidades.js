import React, { useState, useEffect } from 'react';
import './Modalidades.css';

function Modalidades() {
  const [modalidades, setModalidades] = useState([]);
  const [formData, setFormData] = useState({ nome: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    carregarModalidades();
  }, []);

  const carregarModalidades = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/modalidades');
      const data = await response.json();
      if (response.ok) {
        setModalidades(data.modalidades);
      } else {
        setMessage('Erro ao carregar modalidades');
      }
    } catch (error) {
      setMessage('Erro ao carregar modalidades');
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
      const url = editingId ? `/api/modalidades/${editingId}` : '/api/modalidades';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setFormData({ nome: '' });
        setEditingId(null);
        carregarModalidades();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao salvar modalidade');
    }
    setLoading(false);
  };

  const handleEdit = (modalidade) => {
    setFormData({ nome: modalidade.nome });
    setEditingId(modalidade.id);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta modalidade?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/modalidades/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        carregarModalidades();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao deletar modalidade');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({ nome: '' });
    setEditingId(null);
    setMessage('');
  };

  return (
    <div className="modalidades-container">
      <h2>📋 Gestão de Modalidades</h2>
      
      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-section">
        <h3>{editingId ? 'Editar Modalidade' : 'Nova Modalidade'}</h3>
        <form onSubmit={handleSubmit} className="modalidade-form">
          <div className="form-group">
            <label htmlFor="nome">Nome da Modalidade:</label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Plano Básico, Plano Premium..."
              required
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
        <h3>Modalidades Cadastradas</h3>
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : modalidades.length === 0 ? (
          <div className="empty-state">Nenhuma modalidade cadastrada</div>
        ) : (
          <div className="modalidades-grid">
            {modalidades.map((modalidade) => (
              <div key={modalidade.id} className="modalidade-card">
                <div className="modalidade-info">
                  <span className="modalidade-id">#{modalidade.id}</span>
                  <h4>{modalidade.nome}</h4>
                </div>
                <div className="modalidade-actions">
                  <button
                    onClick={() => handleEdit(modalidade)}
                    className="btn-edit"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(modalidade.id)}
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

export default Modalidades; 