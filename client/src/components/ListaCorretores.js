import React, { useState, useEffect } from 'react';
import './ListaCorretores.css';

const ListaCorretores = ({ onVoltar, onEditar }) => {
  const [corretores, setCorretores] = useState([]);
  const [corretoresFiltrados, setCorretoresFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  useEffect(() => {
    carregarCorretores();
  }, []);

  useEffect(() => {
    filtrarCorretores();
  }, [corretores, busca, filtroTipo, filtroStatus]);

  const carregarCorretores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/corretores');
      const data = await response.json();

      if (response.ok) {
        setCorretores(data.corretores);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar corretores do banco de dados');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarCorretores = () => {
    let filtrados = [...corretores];

    // Filtro por busca (nome, email, CPF)
    if (busca) {
      const termoBusca = busca.toLowerCase();
      filtrados = filtrados.filter(corretor => 
        corretor.nome.toLowerCase().includes(termoBusca) ||
        corretor.email.toLowerCase().includes(termoBusca) ||
        corretor.cpf.includes(termoBusca)
      );
    }

    // Filtro por tipo de usuário
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(corretor => corretor.tipoUsuario === filtroTipo);
    }

    // Filtro por status (ativo/desligado)
    if (filtroStatus === 'ativo') {
      filtrados = filtrados.filter(corretor => !corretor.dataDesligamento);
    } else if (filtroStatus === 'desligado') {
      filtrados = filtrados.filter(corretor => corretor.dataDesligamento);
    }

    setCorretoresFiltrados(filtrados);
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarCPF = (cpf) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarTelefone = (telefone) => {
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroTipo('todos');
    setFiltroStatus('todos');
  };

  // Função para excluir corretor
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este corretor?')) return;
    try {
      const response = await fetch(`/api/corretores/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        alert('Corretor excluído com sucesso!');
        carregarCorretores();
      } else {
        alert(data.error || 'Erro ao excluir corretor.');
      }
    } catch (error) {
      alert('Erro ao excluir corretor.');
    }
  };

  if (loading) {
    return (
      <div className="lista-corretores-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dados do banco...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lista-corretores-container">
        <div className="error-message">
          <h3>❌ Erro ao carregar dados</h3>
          <p>{error}</p>
          <button onClick={carregarCorretores} className="retry-btn">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-corretores-container">
      <div className="header-consultar">
        <h2>📋 Consulta de Corretores</h2>
        <p>Total: {corretores.length} corretores | Exibindo: {corretoresFiltrados.length}</p>
      </div>

      {/* Filtros e Busca */}
      <div className="filtros-container">
        <div className="busca-container">
          <input
            type="text"
            placeholder="🔍 Buscar por nome, email ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="busca-input"
          />
        </div>

        <div className="filtros-row">
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">👥 Todos os tipos</option>
            <option value="usuario">👤 Usuários</option>
            <option value="admin">👨‍💼 Administradores</option>
          </select>

          <select 
            value={filtroStatus} 
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">📊 Todos os status</option>
            <option value="ativo">✅ Ativos</option>
            <option value="desligado">❌ Desligados</option>
          </select>

          <button onClick={limparFiltros} className="limpar-filtros-btn">
            🗑️ Limpar Filtros
          </button>

          <button onClick={carregarCorretores} className="atualizar-btn">
            🔄 Atualizar
          </button>
        </div>
      </div>
      
      {/* Resultados */}
      {corretoresFiltrados.length === 0 ? (
        <div className="sem-resultados">
          {corretores.length === 0 ? (
            <div>
              <h3>📭 Nenhum corretor cadastrado</h3>
              <p>O banco de dados está vazio. Cadastre o primeiro corretor!</p>
            </div>
          ) : (
            <div>
              <h3>🔍 Nenhum resultado encontrado</h3>
              <p>Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="corretores-grid">
          {corretoresFiltrados.map((corretor) => (
            <div key={corretor.id} className={`corretor-card ${corretor.dataDesligamento ? 'desligado' : 'ativo'}`}>
              <div className="card-header">
                <h3>{corretor.nome}</h3>
                <span className={`status-badge ${corretor.dataDesligamento ? 'desligado' : 'ativo'}`}>
                  {corretor.dataDesligamento ? '❌ Desligado' : '✅ Ativo'}
                </span>
              </div>
              
              <div className="card-content">
                <p><strong>📧 E-mail:</strong> {corretor.email}</p>
                <p><strong>📞 Telefone:</strong> {formatarTelefone(corretor.telefone)}</p>
                <p><strong>🆔 CPF:</strong> {formatarCPF(corretor.cpf)}</p>
                <p><strong>📅 Data de Cadastro:</strong> {formatarData(corretor.dataCadastro)}</p>
                {corretor.dataDesligamento && (
                  <p><strong>🚪 Data de Desligamento:</strong> {formatarData(corretor.dataDesligamento)}</p>
                )}
                <p><strong>👤 Tipo:</strong> 
                  <span className={`tipo-badge ${corretor.tipoUsuario}`}>
                    {corretor.tipoUsuario === 'admin' ? '👨‍💼 Administrador' : '👤 Usuário'}
                  </span>
                </p>
                <div className="corretor-actions">
                  <button className="btn-edit" title="Editar" onClick={() => onEditar && onEditar(corretor)}>✏️ Editar</button>
                  <button className="btn-delete" title="Excluir" onClick={() => handleDelete(corretor.id)}>🗑️ Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="footer-consultar">
        <button className="voltar-btn" onClick={onVoltar}>
          ← Voltar ao Cadastro
        </button>
      </div>
    </div>
  );
};

export default ListaCorretores; 