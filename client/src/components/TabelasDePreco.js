import React, { useState, useEffect } from 'react';
import './TabelasDePreco.css';

const faixas = [
  { key: 'valor_00_18', label: '00 a 18' },
  { key: 'valor_19_23', label: '19 a 23' },
  { key: 'valor_24_28', label: '24 a 28' },
  { key: 'valor_29_33', label: '29 a 33' },
  { key: 'valor_34_38', label: '34 a 38' },
  { key: 'valor_39_43', label: '39 a 43' },
  { key: 'valor_44_48', label: '44 a 48' },
  { key: 'valor_49_53', label: '49 a 53' },
  { key: 'valor_54_58', label: '54 a 58' },
  { key: 'valor_59_mais', label: '59 ou mais' }
];

function TabelasDePreco() {
  const [precos, setPrecos] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [acomodacoes, setAcomodacoes] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [operadoras, setOperadoras] = useState([]);
  const [formData, setFormData] = useState({
    cidade_id: '',
    operadora_id: '',
    tipo_coparticipacao: 'Com Coparticipação',
    acomodacao_id: '',
    modalidade_id: '',
    tipo_documento: 'CPF',
    validade_inicio: '',
    validade_fim: '',
    valor_00_18: '',
    valor_19_23: '',
    valor_24_28: '',
    valor_29_33: '',
    valor_34_38: '',
    valor_39_43: '',
    valor_44_48: '',
    valor_49_53: '',
    valor_54_58: '',
    valor_59_mais: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    carregarPrecos();
    carregarCidades();
    carregarAcomodacoes();
    carregarModalidades();
    carregarOperadoras();
  }, []);

  const carregarPrecos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/precos');
      const data = await response.json();
      if (response.ok) {
        setPrecos(data.precos);
      } else {
        setMessage('Erro ao carregar preços');
      }
    } catch (error) {
      setMessage('Erro ao carregar preços');
    }
    setLoading(false);
  };

  const carregarCidades = async () => {
    try {
      const response = await fetch('/api/cidades');
      const data = await response.json();
      if (response.ok) setCidades(data.cidades);
    } catch {}
  };
  const carregarAcomodacoes = async () => {
    try {
      const response = await fetch('/api/acomodacoes');
      const data = await response.json();
      if (response.ok) setAcomodacoes(data.acomodacoes);
    } catch {}
  };
  const carregarModalidades = async () => {
    try {
      const response = await fetch('/api/modalidades');
      const data = await response.json();
      if (response.ok) setModalidades(data.modalidades);
    } catch {}
  };
  const carregarOperadoras = async () => {
    try {
      const response = await fetch('/api/operadoras');
      const data = await response.json();
      if (response.ok) setOperadoras(data.operadoras);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `/api/precos/${editingId}` : '/api/precos';
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setFormData({
          cidade_id: '', operadora_id: '', tipo_coparticipacao: 'Com Coparticipação', acomodacao_id: '', modalidade_id: '', tipo_documento: 'CPF', validade_inicio: '', validade_fim: '', valor_00_18: '', valor_19_23: '', valor_24_28: '', valor_29_33: '', valor_34_38: '', valor_39_43: '', valor_44_48: '', valor_49_53: '', valor_54_58: '', valor_59_mais: ''
        });
        setEditingId(null);
        carregarPrecos();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao salvar preço');
    }
    setLoading(false);
  };

  const handleEdit = (preco) => {
    setFormData({
      cidade_id: preco.cidade_id,
      operadora_id: preco.operadora_id || '',
      tipo_coparticipacao: preco.tipo_coparticipacao,
      acomodacao_id: preco.acomodacao_id,
      modalidade_id: preco.modalidade_id,
      tipo_documento: preco.tipo_documento || 'CPF',
      validade_inicio: preco.validade_inicio,
      validade_fim: preco.validade_fim,
      valor_00_18: preco.valor_00_18 || '',
      valor_19_23: preco.valor_19_23 || '',
      valor_24_28: preco.valor_24_28 || '',
      valor_29_33: preco.valor_29_33 || '',
      valor_34_38: preco.valor_34_38 || '',
      valor_39_43: preco.valor_39_43 || '',
      valor_44_48: preco.valor_44_48 || '',
      valor_49_53: preco.valor_49_53 || '',
      valor_54_58: preco.valor_54_58 || '',
      valor_59_mais: preco.valor_59_mais || ''
    });
    setEditingId(preco.id);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tabela de preço?')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/precos/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        carregarPrecos();
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao deletar preço');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      cidade_id: '', operadora_id: '', tipo_coparticipacao: 'Com Coparticipação', acomodacao_id: '', modalidade_id: '', tipo_documento: 'CPF', validade_inicio: '', validade_fim: '', valor_00_18: '', valor_19_23: '', valor_24_28: '', valor_29_33: '', valor_34_38: '', valor_39_43: '', valor_44_48: '', valor_49_53: '', valor_54_58: '', valor_59_mais: ''
    });
    setEditingId(null);
    setMessage('');
  };

  const handleCopy = (preco) => {
    setFormData({
      cidade_id: '', // Limpa o município para o usuário escolher outro
      operadora_id: preco.operadora_id || '',
      tipo_coparticipacao: preco.tipo_coparticipacao,
      acomodacao_id: preco.acomodacao_id,
      modalidade_id: preco.modalidade_id,
      tipo_documento: preco.tipo_documento || 'CPF',
      validade_inicio: preco.validade_inicio,
      validade_fim: preco.validade_fim,
      valor_00_18: preco.valor_00_18 || '',
      valor_19_23: preco.valor_19_23 || '',
      valor_24_28: preco.valor_24_28 || '',
      valor_29_33: preco.valor_29_33 || '',
      valor_34_38: preco.valor_34_38 || '',
      valor_39_43: preco.valor_39_43 || '',
      valor_44_48: preco.valor_44_48 || '',
      valor_49_53: preco.valor_49_53 || '',
      valor_54_58: preco.valor_54_58 || '',
      valor_59_mais: preco.valor_59_mais || ''
    });
    setEditingId(null); // Garante que será um novo cadastro
    setMessage('Tabela copiada! Escolha o município e salve para criar uma nova tabela.');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="tabelas-preco-container">
      <h2>💲 Tabelas de Preço</h2>
      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</div>
      )}
      <div className="form-section">
        <h3>{editingId ? 'Editar Tabela de Preço' : 'Nova Tabela de Preço'}</h3>
        <form onSubmit={handleSubmit} className="tabela-preco-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cidade_id">Cidade:</label>
              <select id="cidade_id" value={formData.cidade_id} onChange={e => setFormData({ ...formData, cidade_id: e.target.value })} required>
                <option value="">Selecione</option>
                {cidades.map(c => <option key={c.id} value={c.id}>{c.nome} - {c.estado}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="operadora_id">Operadora:</label>
              <select id="operadora_id" value={formData.operadora_id} onChange={e => setFormData({ ...formData, operadora_id: e.target.value })} required>
                <option value="">Selecione</option>
                {operadoras.map(o => <option key={o.id} value={o.id}>{o.nome_completo}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tipo_coparticipacao">Tipo de Coparticipação:</label>
              <select id="tipo_coparticipacao" value={formData.tipo_coparticipacao} onChange={e => setFormData({ ...formData, tipo_coparticipacao: e.target.value })} required>
                <option value="Com Coparticipação">Com Coparticipação</option>
                <option value="Coparticipação Parcial">Coparticipação Parcial</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="acomodacao_id">Acomodação:</label>
              <select id="acomodacao_id" value={formData.acomodacao_id} onChange={e => setFormData({ ...formData, acomodacao_id: e.target.value })} required>
                <option value="">Selecione</option>
                {acomodacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="modalidade_id">Modalidade:</label>
              <select id="modalidade_id" value={formData.modalidade_id} onChange={e => setFormData({ ...formData, modalidade_id: e.target.value })} required>
                <option value="">Selecione</option>
                {modalidades.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipo_documento">Tipo de Documento:</label>
              <select id="tipo_documento" value={formData.tipo_documento} onChange={e => setFormData({ ...formData, tipo_documento: e.target.value })} required>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="validade_inicio">Validade Início:</label>
              <input type="date" id="validade_inicio" value={formData.validade_inicio} onChange={e => setFormData({ ...formData, validade_inicio: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="validade_fim">Validade Fim:</label>
              <input type="date" id="validade_fim" value={formData.validade_fim} onChange={e => setFormData({ ...formData, validade_fim: e.target.value })} required />
            </div>
          </div>
          <div className="faixas-section">
            <h4>Valores por Faixa Etária</h4>
            <div className="faixas-grid">
              {faixas.map(faixa => (
                <div className="form-group" key={faixa.key}>
                  <label htmlFor={faixa.key}>{faixa.label}:</label>
                  <input
                    type="number"
                    id={faixa.key}
                    value={formData[faixa.key]}
                    onChange={e => setFormData({ ...formData, [faixa.key]: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="form-buttons">
            <button type="submit" disabled={loading}>{loading ? 'Salvando...' : (editingId ? 'Atualizar' : 'Cadastrar')}</button>
            {editingId && <button type="button" onClick={handleCancel} disabled={loading}>Cancelar</button>}
          </div>
        </form>
      </div>
      <div className="list-section">
        <h3>Tabelas de Preço Cadastradas</h3>
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : precos.length === 0 ? (
          <div className="empty-state">Nenhuma tabela de preço cadastrada</div>
        ) : (
          <div className="precos-grid">
            {precos.map(preco => (
              <div key={preco.id} className="preco-card">
                <div className="preco-info">
                  <span className="preco-id">#{preco.id}</span>
                  <h4>{preco.cidade_nome} - {preco.tipo_coparticipacao} - {preco.acomodacao_nome} - {preco.modalidade_nome}</h4>
                  <p className="tipo-documento">Tipo: {preco.tipo_documento || 'CPF'}</p>
                  <p className="validade">Validade: {preco.validade_inicio} a {preco.validade_fim}</p>
                  <div className="faixas-list">
                    {faixas.map(faixa => (
                      <div className="faixa-item" key={faixa.key}>
                        <strong>{faixa.label}:</strong> {formatarValor(preco[faixa.key])}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="preco-actions">
                  <button onClick={() => handleEdit(preco)} className="btn-edit" title="Editar">✏️</button>
                  <button onClick={() => handleDelete(preco.id)} className="btn-delete" title="Excluir">🗑️</button>
                  <button onClick={() => handleCopy(preco)} className="btn-copy" title="Copiar para outro município">📋 Copiar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TabelasDePreco; 