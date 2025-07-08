import React, { useState, useEffect, useRef } from 'react';
import './OrcamentoConsulta.css';
import html2canvas from 'html2canvas';

function OrcamentoConsulta() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [busca, setBusca] = useState('');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [gerandoPng, setGerandoPng] = useState(false);
  const detalhesRef = useRef();

  useEffect(() => {
    carregarOrcamentos();
  }, []);

  const carregarOrcamentos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orcamentos');
      const data = await response.json();
      if (response.ok) {
        setOrcamentos(data.orcamentos);
      } else {
        setMessage('Erro ao carregar orçamentos');
      }
    } catch (error) {
      setMessage('Erro ao carregar orçamentos');
    }
    setLoading(false);
  };

  const filtrarOrcamentos = () => {
    if (!busca.trim()) return orcamentos;
    const termo = busca.trim().toLowerCase();
    return orcamentos.filter(o =>
      o.nome.toLowerCase().includes(termo) ||
      o.telefone.toLowerCase().includes(termo) ||
      (o.data_orcamento && o.data_orcamento.includes(termo))
    );
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
  };

  const gerarPng = async () => {
    if (!orcamentoSelecionado) return;
    setGerandoPng(true);
    try {
      if (detalhesRef.current) {
        const canvas = await html2canvas(detalhesRef.current);
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `orcamento_${orcamentoSelecionado.nome.replace(/\s+/g, '_')}.png`;
        link.click();
      }
    } catch (error) {
      alert('Erro ao gerar PNG');
    }
    setGerandoPng(false);
  };

  return (
    <div className="orcamento-consulta-container">
      <h2>🔎 Consulta de Orçamentos</h2>
      {message && <div className="message error">{message}</div>}
      <div className="busca-section">
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou data..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>
      <div className="list-section">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : filtrarOrcamentos().length === 0 ? (
          <div className="empty-state">Nenhum orçamento encontrado</div>
        ) : (
          <div className="orcamentos-grid">
            {filtrarOrcamentos().map(orc => (
              <div key={orc.id} className="orcamento-card" onClick={() => setOrcamentoSelecionado(orc)}>
                <div className="orcamento-info">
                  <span className="orcamento-id">#{orc.id}</span>
                  <h4>{orc.nome}</h4>
                  <p>Telefone: {orc.telefone}</p>
                  <p>Data: {orc.data_orcamento}</p>
                  <p>Valor Total: <strong>{formatarValor(orc.valor_total)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {orcamentoSelecionado && (
        <div className="orcamento-modal" onClick={() => setOrcamentoSelecionado(null)}>
          <div className="orcamento-modal-content" onClick={e => e.stopPropagation()} ref={detalhesRef}>
            <button className="btn-close" onClick={() => setOrcamentoSelecionado(null)}>Fechar</button>
            <h3>Detalhes do Orçamento #{orcamentoSelecionado.id}</h3>
            <p><strong>Nome:</strong> {orcamentoSelecionado.nome}</p>
            <p><strong>Telefone:</strong> {orcamentoSelecionado.telefone}</p>
            <p><strong>Data:</strong> {orcamentoSelecionado.data_orcamento}</p>
            <p><strong>Valor Total:</strong> {formatarValor(orcamentoSelecionado.valor_total)}</p>
            <p><strong>Idades:</strong> {orcamentoSelecionado.idades.join(', ')}</p>
            <p><strong>ID da Tabela de Preço:</strong> {orcamentoSelecionado.tabela_preco_id}</p>
            <div className="modal-actions">
              <button className="btn-reimprimir" onClick={gerarPng} disabled={gerandoPng}>
                {gerandoPng ? 'Gerando PNG...' : 'Gerar PNG'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrcamentoConsulta; 