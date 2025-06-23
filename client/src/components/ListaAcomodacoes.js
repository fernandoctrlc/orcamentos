import React, { useState, useEffect } from 'react';
import './ListaAcomodacoes.css';

const ListaAcomodacoes = ({ onVoltar }) => {
  const [acomodacoes, setAcomodacoes] = useState([]);
  const [acomodacoesFiltradas, setAcomodacoesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarAcomodacoes();
  }, []);

  useEffect(() => {
    filtrarAcomodacoes();
  }, [acomodacoes, busca]);

  const carregarAcomodacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/acomodacoes');
      const data = await response.json();

      if (response.ok) {
        setAcomodacoes(data.acomodacoes);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar acomodações do banco de dados');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarAcomodacoes = () => {
    let filtradas = [...acomodacoes];

    // Filtro por busca (nome, registro ANS)
    if (busca) {
      const termoBusca = busca.toLowerCase();
      filtradas = filtradas.filter(acomodacao => 
        acomodacao.nome.toLowerCase().includes(termoBusca) ||
        (acomodacao.registro_ans && acomodacao.registro_ans.toLowerCase().includes(termoBusca))
      );
    }

    setAcomodacoesFiltradas(filtradas);
  };

  const limparFiltros = () => {
    setBusca('');
  };

  if (loading) {
    return (
      <div className="lista-acomodacoes-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dados do banco...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lista-acomodacoes-container">
        <div className="error-message">
          <h3>❌ Erro ao carregar dados</h3>
          <p>{error}</p>
          <button onClick={carregarAcomodacoes} className="retry-btn">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-acomodacoes-container">
      <div className="header-consultar">
        <h2>🏠 Consulta de Acomodações</h2>
        <p>Total: {acomodacoes.length} acomodações | Exibindo: {acomodacoesFiltradas.length}</p>
      </div>

      {/* Filtros e Busca */}
      <div className="filtros-container">
        <div className="busca-container">
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou registro ANS..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="busca-input"
          />
        </div>

        <div className="filtros-row">
          <button onClick={limparFiltros} className="limpar-filtros-btn">
            🗑️ Limpar Filtros
          </button>

          <button onClick={carregarAcomodacoes} className="atualizar-btn">
            🔄 Atualizar
          </button>
        </div>
      </div>
      
      {/* Resultados */}
      {acomodacoesFiltradas.length === 0 ? (
        <div className="sem-resultados">
          {acomodacoes.length === 0 ? (
            <div>
              <h3>📭 Nenhuma acomodação cadastrada</h3>
              <p>O banco de dados está vazio. Cadastre a primeira acomodação!</p>
            </div>
          ) : (
            <div>
              <h3>🔍 Nenhum resultado encontrado</h3>
              <p>Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="acomodacoes-grid">
          {acomodacoesFiltradas.map((acomodacao) => (
            <div key={acomodacao.id} className="acomodacao-card">
              <div className="card-header">
                <h3>{acomodacao.nome}</h3>
                <span className="id-badge">
                  ID: {acomodacao.id}
                </span>
              </div>
              
              <div className="card-content">
                {acomodacao.registro_ans && (
                  <p><strong>🏷️ Registro ANS:</strong> {acomodacao.registro_ans}</p>
                )}
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

export default ListaAcomodacoes; 