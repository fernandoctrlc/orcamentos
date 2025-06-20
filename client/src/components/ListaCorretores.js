import React, { useState, useEffect } from 'react';
import './ListaCorretores.css';

const ListaCorretores = ({ onVoltar }) => {
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    carregarCorretores();
  }, []);

  const carregarCorretores = async () => {
    try {
      const response = await fetch('/api/corretores');
      const data = await response.json();

      if (response.ok) {
        setCorretores(data.corretores);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar corretores');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return <div className="lista-corretores-container">Carregando...</div>;
  }

  if (error) {
    return <div className="lista-corretores-container">Erro: {error}</div>;
  }

  return (
    <div className="lista-corretores-container">
      <h2>Corretores Cadastrados</h2>
      
      {corretores.length === 0 ? (
        <p>Nenhum corretor cadastrado ainda.</p>
      ) : (
        <div className="corretores-grid">
          {corretores.map((corretor) => (
            <div key={corretor.id} className="corretor-card">
              <h3>{corretor.nome}</h3>
              <p><strong>E-mail:</strong> {corretor.email}</p>
              <p><strong>Telefone:</strong> {corretor.telefone}</p>
              <p><strong>CPF:</strong> {corretor.cpf}</p>
              <p><strong>Data de Cadastro:</strong> {formatarData(corretor.dataCadastro)}</p>
              {corretor.dataDesligamento && (
                <p><strong>Data de Desligamento:</strong> {formatarData(corretor.dataDesligamento)}</p>
              )}
              <p><strong>Tipo:</strong> {corretor.tipoUsuario === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
          ))}
        </div>
      )}
      
      <button className="voltar-btn" onClick={onVoltar}>
        Voltar ao Cadastro
      </button>
    </div>
  );
};

export default ListaCorretores; 