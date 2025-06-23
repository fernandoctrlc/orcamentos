import React, { useState, useEffect } from 'react';
import './ListaOperadoras.css';

const ListaOperadoras = ({ onVoltar }) => {
  const [operadoras, setOperadoras] = useState([]);
  const [operadorasFiltradas, setOperadorasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarOperadoras();
  }, []);

  useEffect(() => {
    filtrarOperadoras();
  }, [operadoras, busca]);

  const carregarOperadoras = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/operadoras');
      const data = await response.json();

      if (response.ok) {
        setOperadoras(data.operadoras);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar operadoras do banco de dados');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarOperadoras = () => {
    let filtradas = [...operadoras];

    // Filtro por busca (nome completo)
    if (busca) {
      const termoBusca = busca.toLowerCase();
      filtradas = filtradas.filter(operadora => 
        operadora.nome_completo.toLowerCase().includes(termoBusca)
      );
    }

    setOperadorasFiltradas(filtradas);
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const limparFiltros = () => {
    setBusca('');
  };

  if (loading) {
    return (
      <div className="lista-operadoras-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dados do banco...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lista-operadoras-container">
        <div className="error-message">
          <h3>❌ Erro ao carregar dados</h3>
          <p>{error}</p>
          <button onClick={carregarOperadoras} className="retry-btn">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-operadoras-container">
      <div className="header-consultar">
        <h2>🏢 Consulta de Operadoras</h2>
        <p>Total: {operadoras.length} operadoras | Exibindo: {operadorasFiltradas.length}</p>
      </div>

      {/* Filtros e Busca */}
      <div className="filtros-container">
        <div className="busca-container">
          <input
            type="text"
            placeholder="🔍 Buscar por nome da operadora..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="busca-input"
          />
        </div>

        <div className="filtros-row">
          <button onClick={limparFiltros} className="limpar-filtros-btn">
            🗑️ Limpar Filtros
          </button>

          <button onClick={carregarOperadoras} className="atualizar-btn">
            🔄 Atualizar
          </button>
        </div>
      </div>
      
      {/* Resultados */}
      {operadorasFiltradas.length === 0 ? (
        <div className="sem-resultados">
          {operadoras.length === 0 ? (
            <div>
              <h3>📭 Nenhuma operadora cadastrada</h3>
              <p>O banco de dados está vazio. Cadastre a primeira operadora!</p>
            </div>
          ) : (
            <div>
              <h3>🔍 Nenhum resultado encontrado</h3>
              <p>Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="operadoras-grid">
          {operadorasFiltradas.map((operadora) => (
            <div key={operadora.id} className="operadora-card">
              <div className="card-header">
                <h3>{operadora.nome_completo}</h3>
                <span className="data-badge">
                  {formatarData(operadora.data_cadastro)}
                </span>
              </div>
              
              <div className="card-content">
                {operadora.vigencias && (
                  <p><strong>📅 Vigências:</strong> {operadora.vigencias}</p>
                )}
                <p><strong>📅 Data de Cadastro:</strong> {formatarData(operadora.data_cadastro)}</p>
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

export default ListaOperadoras; 