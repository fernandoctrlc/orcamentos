import React, { useState, useEffect } from 'react';
import './ListaCidades.css';

const ListaCidades = ({ onVoltar }) => {
  const [cidades, setCidades] = useState([]);
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    carregarCidades();
  }, []);

  useEffect(() => {
    filtrarCidades();
  }, [cidades, busca, filtroEstado]);

  const carregarCidades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cidades');
      const data = await response.json();

      if (response.ok) {
        setCidades(data.cidades);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar cidades do banco de dados');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarCidades = () => {
    let filtradas = [...cidades];

    // Filtro por busca (nome, código IBGE)
    if (busca) {
      const termoBusca = busca.toLowerCase();
      filtradas = filtradas.filter(cidade => 
        cidade.nome.toLowerCase().includes(termoBusca) ||
        (cidade.codigo_ibge && cidade.codigo_ibge.includes(termoBusca))
      );
    }

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(cidade => cidade.estado === filtroEstado);
    }

    setCidadesFiltradas(filtradas);
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroEstado('todos');
  };

  if (loading) {
    return (
      <div className="lista-cidades-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dados do banco...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lista-cidades-container">
        <div className="error-message">
          <h3>❌ Erro ao carregar dados</h3>
          <p>{error}</p>
          <button onClick={carregarCidades} className="retry-btn">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-cidades-container">
      <div className="header-consultar">
        <h2>🏙️ Consulta de Cidades</h2>
        <p>Total: {cidades.length} cidades | Exibindo: {cidadesFiltradas.length}</p>
      </div>

      {/* Filtros e Busca */}
      <div className="filtros-container">
        <div className="busca-container">
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou código IBGE..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="busca-input"
          />
        </div>

        <div className="filtros-row">
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">🏛️ Todos os estados</option>
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>

          <button onClick={limparFiltros} className="limpar-filtros-btn">
            🗑️ Limpar Filtros
          </button>

          <button onClick={carregarCidades} className="atualizar-btn">
            🔄 Atualizar
          </button>
        </div>
      </div>
      
      {/* Resultados */}
      {cidadesFiltradas.length === 0 ? (
        <div className="sem-resultados">
          {cidades.length === 0 ? (
            <div>
              <h3>📭 Nenhuma cidade cadastrada</h3>
              <p>O banco de dados está vazio. Cadastre a primeira cidade!</p>
            </div>
          ) : (
            <div>
              <h3>🔍 Nenhum resultado encontrado</h3>
              <p>Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="cidades-grid">
          {cidadesFiltradas.map((cidade) => (
            <div key={cidade.id} className="cidade-card">
              <div className="card-header">
                <h3>{cidade.nome}</h3>
                <span className="estado-badge">
                  {cidade.estado}
                </span>
              </div>
              
              <div className="card-content">
                {cidade.codigo_ibge && (
                  <p><strong>🏷️ Código IBGE:</strong> {cidade.codigo_ibge}</p>
                )}
                {cidade.observacoes && (
                  <p><strong>📝 Observações:</strong> {cidade.observacoes}</p>
                )}
                <div className="valores-section">
                  <h4>💰 Valores de Referência:</h4>
                  <div className="valores-grid">
                    <div className="valor-item">
                      <span>Consultas Eletivas:</span>
                      <strong>{formatarValor(cidade.consultas_eletivas)}</strong>
                    </div>
                    <div className="valor-item">
                      <span>Consultas Urgências:</span>
                      <strong>{formatarValor(cidade.consultas_urgencias)}</strong>
                    </div>
                    <div className="valor-item">
                      <span>Exames Simples:</span>
                      <strong>{formatarValor(cidade.exames_simples)}</strong>
                    </div>
                    <div className="valor-item">
                      <span>Exames Complexos:</span>
                      <strong>{formatarValor(cidade.exames_complexos)}</strong>
                    </div>
                    <div className="valor-item">
                      <span>Terapias Especiais:</span>
                      <strong>{formatarValor(cidade.terapias_especiais)}</strong>
                    </div>
                    <div className="valor-item">
                      <span>Demais Terapias:</span>
                      <strong>{formatarValor(cidade.demais_terapias)}</strong>
                    </div>
                  </div>
                </div>
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

export default ListaCidades; 