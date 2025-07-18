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

  // Novos estados para logos, fundo, mensagem e tabela
  const [logoOrcamento, setLogoOrcamento] = useState(null);
  const [logoBoleto, setLogoBoleto] = useState(null);
  const [mensagemRodape, setMensagemRodape] = useState('');
  const [tabela, setTabela] = useState(null);
  const [cidades, setCidades] = useState([]);

  useEffect(() => {
    carregarOrcamentos();
    fetch('/api/logo-orcamento').then(res => res.json()).then(data => setLogoOrcamento(data.path ? `/api/uploads/${data.path.split('/').pop()}` : null));
    fetch('/api/logo-boleto').then(res => res.json()).then(data => setLogoBoleto(data.path ? `/api/uploads/${data.path.split('/').pop()}` : null));
    fetch('/api/mensagem-rodape-orcamento').then(res => res.json()).then(data => setMensagemRodape(data.mensagem || ''));
    fetch('/api/cidades').then(res => res.json()).then(data => setCidades(data.cidades || []));
  }, []);

  const carregarOrcamentos = async () => {
    setLoading(true);
    try {
      const corretorId = localStorage.getItem('corretorId');
      const response = await fetch(`/api/orcamentos?corretor_id=${corretorId}`);
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

  const buscarTabela = async (tabelaId) => {
    if (!tabelaId) return null;
    const resp = await fetch(`/api/precos?id=${tabelaId}`);
    const data = await resp.json();
    if (data && data.precos && data.precos.length > 0) return data.precos[0];
    return null;
  };

  const gerarPng = async () => {
    if (!orcamentoSelecionado) return;
    setGerandoPng(true);
    try {
      // Buscar tabela de preço
      let tabelaPreco = tabela;
      if (!tabelaPreco || String(tabelaPreco.id) !== String(orcamentoSelecionado.tabela_preco_id)) {
        tabelaPreco = await buscarTabela(orcamentoSelecionado.tabela_preco_id);
        setTabela(tabelaPreco);
      }
      // Buscar cidade
      const cidade = cidades.find(c => String(c.id) === String(tabelaPreco?.cidade_id));
      // Coparticipações
      let copart = '';
      if (tabelaPreco) {
        copart = `
          <div style="margin-top: 30px; border: 2px solid #2196f3; border-radius: 12px; padding: 18px 20px; background: #fafdff;">
            <h3 style="color: #1976d2; margin: 0 0 12px 0; font-size: 1.15rem;">Coparticipações da Cidade (${cidade ? cidade.nome.toUpperCase() : ''} - ${cidade ? cidade.estado : ''})</h3>
            <div style="font-size: 1.05rem;">
              <b>Consultas Eletivas:</b> R$ ${tabelaPreco.consultas_eletivas ? Number(tabelaPreco.consultas_eletivas).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Consultas Urgências:</b> R$ ${tabelaPreco.consultas_urgencias ? Number(tabelaPreco.consultas_urgencias).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Exames Simples:</b> R$ ${tabelaPreco.exames_simples ? Number(tabelaPreco.exames_simples).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Exames Complexos:</b> R$ ${tabelaPreco.exames_complexos ? Number(tabelaPreco.exames_complexos).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Terapias Especiais:</b> R$ ${tabelaPreco.terapias_especiais ? Number(tabelaPreco.terapias_especiais).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Demais Terapias:</b> R$ ${tabelaPreco.demais_terapias ? Number(tabelaPreco.demais_terapias).toFixed(2).replace('.', ',') : '--'}
            </div>
          </div>
        `;
      }
      // Geração do HTML igual ao cadastro
      const orcamentoDiv = document.createElement('div');
      orcamentoDiv.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        border: 2px solid #333;
        z-index: -1;
      `;
      let logoSrc = logoOrcamento || '/logov3.png';
      const vendedorNome = localStorage.getItem('corretorNome');
      const vendedorTelefone = localStorage.getItem('corretorTelefone');
      orcamentoDiv.innerHTML = `
        <div style="max-width: 520px; margin: 0 auto; border: 2px solid #2196f3; border-radius: 16px; background: #fff; padding: 32px 24px 24px 24px; font-family: Arial, sans-serif; position: relative; overflow: hidden; min-height: 720px;">
          <div style="position: relative; z-index: 1;">
            <div style="text-align: center; margin-bottom: 18px;">
              <img src="${logoSrc}" alt='Logo' style="max-width:290px; max-height:230px; margin-bottom:10px; border-radius:8px; display:block; margin-left:auto; margin-right:auto;" />
            </div>
            <h2 style="color: #1976d2; text-align: center; margin: 0 0 18px 0; font-size: 1.3rem;">Orçamento para ${orcamentoSelecionado.nome || '---'}</h2>
            <div style="margin-bottom: 10px; text-align: center; position:relative; min-height:70px;">
              ${logoBoleto ? `<img src='${logoBoleto}' alt='Fundo Boleto' style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); max-width:110%; max-height:110%; width:auto; height:auto; object-fit:contain; opacity:0.13; z-index:0; pointer-events:none;" />` : ''}
              <div style="position:relative; z-index:1;">
                <b>Vendedor:</b> ${vendedorNome || '---'}<br/>
                <b>Telefone:</b> ${vendedorTelefone || '---'}<br/>
                <b>Data:</b> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}<br/>
              </div>
            </div>
            <div style="margin-bottom: 10px; text-align: center;">
              <b>Tabela de Preço:</b> ${tabelaPreco?.cidade_nome || ''} - ${tabelaPreco?.tipo_coparticipacao || ''} - ${tabelaPreco?.acomodacao_nome || ''} - ${tabelaPreco?.modalidade_nome || ''} (${tabelaPreco?.validade_inicio || ''} a ${tabelaPreco?.validade_fim || ''})
            </div>
            <div style="display: flex; justify-content: center; margin-bottom: 10px;">
              <table style="border: 2px solid #1976d2; border-radius: 8px; border-collapse: separate; border-spacing: 0; min-width: 180px; background: rgba(255,255,255,0.95);">
                <thead>
                  <tr style="background: #e3f2fd; color: #1976d2;">
                    <th style="border: 1px solid #1976d2; padding: 6px 18px; text-align: center;">Idade</th>
                    <th style="border: 1px solid #1976d2; padding: 6px 18px; text-align: center;">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${orcamentoSelecionado.idades.map(idade => {
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
                    const valor = tabelaPreco && tabelaPreco[faixa] ? Number(tabelaPreco[faixa]).toFixed(2).replace('.', ',') : '0,00';
                    return `
                      <tr>
                        <td style=\"border: 1px solid #1976d2; padding: 6px 18px; text-align: center;\">${idade}</td>
                        <td style=\"border: 1px solid #1976d2; padding: 6px 18px; text-align: center;\">R$ ${valor}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            <div style="text-align: center; font-size: 1.1rem; margin-bottom: 10px;"><b>Total:</b> R$ ${orcamentoSelecionado.valor_total ? Number(orcamentoSelecionado.valor_total).toFixed(2).replace('.', ',') : '0,00'}</div>
            ${copart}
          </div>
          ${mensagemRodape ? `<div style='position:absolute; bottom:0; left:0; width:100%; text-align:center; color:#444; font-size:0.9rem; opacity:0.85; padding-bottom:4px;'>${mensagemRodape}</div>` : ''}
        </div>
      `;
      document.body.appendChild(orcamentoDiv);
      const canvas = await html2canvas(orcamentoDiv, { scale: 2, backgroundColor: '#ffffff' });
      document.body.removeChild(orcamentoDiv);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `orcamento_${orcamentoSelecionado.nome.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (error) {
      alert('Erro ao gerar PNG');
    }
    setGerandoPng(false);
  };

  const excluirOrcamento = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este orçamento?')) return;
    try {
      const resp = await fetch(`/api/orcamentos/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        setOrcamentoSelecionado(null);
        carregarOrcamentos();
      } else {
        alert('Erro ao excluir orçamento.');
      }
    } catch {
      alert('Erro ao excluir orçamento.');
    }
  };

  const tipoUsuario = (localStorage.getItem('tipoUsuario') || 'usuario').toLowerCase();

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
            <p><strong>Tipo de Documento:</strong> {orcamentoSelecionado.tipo_documento || 'CPF'}</p>
            <p><strong>Data:</strong> {orcamentoSelecionado.data_orcamento}</p>
            <p><strong>Valor Total:</strong> {formatarValor(orcamentoSelecionado.valor_total)}</p>
            <p><strong>Idades:</strong> {orcamentoSelecionado.idades.join(', ')}</p>
            <p><strong>ID da Tabela de Preço:</strong> {orcamentoSelecionado.tabela_preco_id}</p>
            <div className="modal-actions">
              <button className="btn-reimprimir" onClick={gerarPng} disabled={gerandoPng}>
                {gerandoPng ? 'Gerando PNG...' : 'Gerar PNG'}
              </button>
              {tipoUsuario === 'administrador' && (
                <button className="btn-excluir" style={{marginLeft:12, background:'#e53935', color:'#fff', border:'none', borderRadius:6, padding:'12px 24px', fontSize:16, fontWeight:500, cursor:'pointer'}} onClick={() => excluirOrcamento(orcamentoSelecionado.id)}>
                  Excluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrcamentoConsulta; 