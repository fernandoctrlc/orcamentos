import React, { useState, useEffect } from 'react';
import './ListaModalidades.css';

const ListaModalidades = ({ onVoltar }) => {
  const [modalidades, setModalidades] = useState([]);
  const [modalidadesFiltradas, setModalidadesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarModalidades();
  }, []);

  useEffect(() => {
    filtrarModalidades();
  }, [modalidades, busca]);

  const carregarModalidades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/modalidades');
      const data = await response.json();

      if (response.ok) {
        setModalidades(data.modalidades);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar modalidades do banco de dados');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarModalidades = () => {
    let filtradas = [...modalidades];

    // Filtro por busca (nome)
    if (busca) {
      const termoBusca = busca.toLowerCase();
      filtradas = filtradas.filter(modalidade => 
        modalidade.nome.toLowerCase().includes(termoBusca)
      );
    }

    setModalidadesFiltradas(filtradas);
  };

  const limparFiltros = () => {
    setBusca('');
  };

  if (loading) {
    return (
      <div className="lista-modalidades-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dados do banco...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lista-modalidades-container">
        <div className="error-message">
          <h3>❌ Erro ao carregar dados</h3>
          <p>{error}</p>
          <button onClick={carregarModalidades} className="retry-btn">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-modalidades-container">
      <div className="header-consultar">
        <h2>📋 Consulta de Modalidades</h2>
        <p>Total: {modalidades.length} modalidades | Exibindo: {modalidadesFiltradas.length}</p>
      </div>

      {/* Filtros e Busca */}
      <div className="filtros-container">
        <div className="busca-container">
          <input
            type="text"
            placeholder="🔍 Buscar por nome da modalidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="busca-input"
          />
        </div>

        <div className="filtros-row">
          <button onClick={limparFiltros} className="limpar-filtros-btn">
            🗑️ Limpar Filtros
          </button>

          <button onClick={carregarModalidades} className="atualizar-btn">
            🔄 Atualizar
          </button>
        </div>
      </div>
      
      {/* Resultados */}
      {modalidadesFiltradas.length === 0 ? (
        <div className="sem-resultados">
          {modalidades.length === 0 ? (
            <div>
              <h3>📭 Nenhuma modalidade cadastrada</h3>
              <p>O banco de dados está vazio. Cadastre a primeira modalidade!</p>
            </div>
          ) : (
            <div>
              <h3>🔍 Nenhum resultado encontrado</h3>
              <p>Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="modalidades-grid">
          {modalidadesFiltradas.map((modalidade) => (
            <div key={modalidade.id} className="modalidade-card">
              <div className="card-header">
                <h3>{modalidade.nome}</h3>
                <span className="id-badge">
                  ID: {modalidade.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="footer-consultar">
        <button onClick={onVoltar} className="voltar-btn">
          ← Voltar ao Cadastro
        </button>
      </div>
    </div>
  );
};

export default ListaModalidades; 