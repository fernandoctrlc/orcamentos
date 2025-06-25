import React, { useState, useEffect } from 'react';
import './OrcamentoConsulta.css';

function OrcamentoConsulta() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [busca, setBusca] = useState('');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [gerandoPng, setGerandoPng] = useState(false);

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
      // Buscar detalhes da tabela de preço
      const respTabela = await fetch(`/api/precos/${orcamentoSelecionado.tabela_preco_id}`);
      const tabela = await respTabela.json();
      const tabelaDescricao = tabela && tabela.cidade_nome ? `${tabela.cidade_nome} - ${tabela.tipo_coparticipacao} - ${tabela.acomodacao_nome} - ${tabela.modalidade_nome} (${tabela.validade_inicio} a ${tabela.validade_fim})` : '';
      // Montar idadesValores
      const idadesValores = orcamentoSelecionado.idades.map(idade => {
        let faixa = '';
        if (idade <= 18) faixa = 'valor_00_18';
        else if (idade <= 23) faixa = 'valor_19_23';
        else if (idade <= 28) faixa = 'valor_24_28';
        else if (idade <= 33) faixa = 'valor_29_33';
        else if (idade <= 38) faixa = 'valor_34_38';
        else if (idade <= 43) faixa = 'valor_39_43';
        else if (idade <= 48) faixa = 'valor_44_48';
        else if (idade <= 53) faixa = 'valor_49_53';
        else if (idade <= 58) faixa = 'valor_54_58';
        else faixa = 'valor_59_mais';
        return {
          idade,
          valor: (tabela && tabela[faixa]) ? Number(tabela[faixa]).toFixed(2).replace('.', ',') : '0,00'
        };
      });
      // Chamar endpoint para gerar imagem
      const vendedorNome = localStorage.getItem('corretorNome');
      const vendedorTelefone = localStorage.getItem('corretorTelefone');
      const respPng = await fetch('/api/orcamento-png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: orcamentoSelecionado.nome,
          telefone: orcamentoSelecionado.telefone,
          tabela: tabelaDescricao,
          idadesValores,
          vendedor_nome: vendedorNome,
          vendedor_telefone: vendedorTelefone,
          tabela_preco_id: orcamentoSelecionado.tabela_preco_id
        })
      });
      const resPng = await respPng.json();
      if (resPng.image) {
        const link = document.createElement('a');
        link.href = resPng.image;
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
          <div className="orcamento-modal-content" onClick={e => e.stopPropagation()}>
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