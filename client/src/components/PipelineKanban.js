import React, { useState, useEffect } from 'react';
import './PipelineKanban.css';

const ESTAGIOS = [
  { key: 'leads', label: 'Leads' },
  { key: 'negociacao', label: 'Em negociação' },
  { key: 'fila', label: 'Fila de cadastro' },
  { key: 'cadastrado', label: 'Cadastrado' },
  { key: 'perdido', label: 'Perdido' },
];

export default function PipelineKanban() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [modal, setModal] = useState(null); // {orcamento, novaObs, novoEstagio}
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    carregarOrcamentos();
    // eslint-disable-next-line
  }, []);

  const carregarOrcamentos = async () => {
    setLoading(true);
    setMessage('');
    try {
      const corretorId = localStorage.getItem('corretorId');
      const tipoUsuario = localStorage.getItem('tipoUsuario') || 'usuario';
      const params = tipoUsuario === 'admin' ? '?tipoUsuario=admin' : `?corretor_id=${corretorId}&tipoUsuario=usuario`;
      const resp = await fetch(`/api/orcamentos${params}`);
      const data = await resp.json();
      if (resp.ok) {
        setOrcamentos(data.orcamentos);
      } else {
        setMessage(data.error || 'Erro ao carregar orçamentos');
      }
    } catch (e) {
      setMessage('Erro ao conectar ao servidor');
    }
    setLoading(false);
  };

  const abrirModal = (orcamento) => {
    setModal({
      orcamento,
      novaObs: '',
      novoEstagio: orcamento.estagio || 'leads'
    });
  };

  const fecharModal = () => setModal(null);

  const salvarAlteracoes = async () => {
    if (!modal) return;
    const novasObservacoes = modal.novaObs.trim()
      ? [...(modal.orcamento.observacoes || []), { texto: modal.novaObs, data: new Date().toLocaleString() }]
      : (modal.orcamento.observacoes || []);
    try {
      setLoading(true);
      const resp = await fetch(`/api/orcamentos/${modal.orcamento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estagio: modal.novoEstagio, observacoes: novasObservacoes })
      });
      if (resp.ok) {
        setMessage('Orçamento atualizado!');
        carregarOrcamentos();
        fecharModal();
      } else {
        setMessage('Erro ao atualizar orçamento');
      }
    } catch (e) {
      setMessage('Erro ao conectar ao servidor');
    }
    setLoading(false);
  };

  return (
    <div className="pipeline-kanban-container">
      <h2>📊 Pipeline de Orçamentos</h2>
      {message && <div className="message error">{message}</div>}
      <div className="kanban-board">
        {ESTAGIOS.map(estagio => (
          <div key={estagio.key} className="kanban-column">
            <div className="kanban-column-header">{estagio.label}</div>
            <div className="kanban-cards">
              {orcamentos.filter(o => (o.estagio || 'leads') === estagio.key).map(o => (
                <div key={o.id} className="kanban-card" onClick={() => abrirModal(o)}>
                  <div><strong>{o.nome}</strong></div>
                  <div>Tel: {o.telefone}</div>
                  <div>Valor: <strong>R$ {o.valor_total ? Number(o.valor_total).toFixed(2).replace('.', ',') : '0,00'}</strong></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div className="kanban-modal-bg" onClick={fecharModal}>
          <div className="kanban-modal" onClick={e => e.stopPropagation()}>
            <button className="kanban-modal-close" onClick={fecharModal}>×</button>
            <h3>Orçamento: {modal.orcamento.nome}</h3>
            <div><strong>Telefone:</strong> {modal.orcamento.telefone}</div>
            <div><strong>Valor:</strong> R$ {modal.orcamento.valor_total ? Number(modal.orcamento.valor_total).toFixed(2).replace('.', ',') : '0,00'}</div>
            <div style={{margin:'16px 0'}}>
              <label><strong>Fase do Kanban:</strong></label><br/>
              <select value={modal.novoEstagio} onChange={e => setModal(m => ({...m, novoEstagio: e.target.value}))}>
                {ESTAGIOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
            <div style={{margin:'16px 0'}}>
              <label><strong>Adicionar Observação:</strong></label><br/>
              <textarea rows={3} style={{width:'100%'}} value={modal.novaObs} onChange={e => setModal(m => ({...m, novaObs: e.target.value}))} placeholder="Digite uma observação..." />
            </div>
            <div style={{margin:'16px 0'}}>
              <strong>Histórico de Observações:</strong>
              <div className="kanban-historico">
                {(modal.orcamento.observacoes && modal.orcamento.observacoes.length > 0)
                  ? modal.orcamento.observacoes.map((obs, idx) => (
                      <div key={idx} className="kanban-historico-item">
                        <span className="kanban-historico-data">{obs.data}</span>: {obs.texto}
                      </div>
                    ))
                  : <div style={{color:'#888'}}>Nenhuma observação ainda.</div>}
                {modal.novaObs.trim() && (
                  <div className="kanban-historico-item kanban-historico-preview">
                    <span className="kanban-historico-data">{new Date().toLocaleString()}</span>: {modal.novaObs} <span style={{color:'#aaa'}}>(pré-visualização)</span>
                  </div>
                )}
              </div>
            </div>
            <button className="kanban-modal-save" onClick={salvarAlteracoes} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      )}
    </div>
  );
} 