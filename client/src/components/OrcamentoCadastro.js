import React, { useState, useEffect } from 'react';
import './OrcamentoCadastro.css';

function OrcamentoCadastro() {
  const [tabelas, setTabelas] = useState([]);
  const [formData, setFormData] = useState({
    tabela_preco_id: '',
    nome: '',
    telefone: '',
    idade: ''
  });
  const [idades, setIdades] = useState([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [faixas, setFaixas] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarTabelas();
  }, []);

  useEffect(() => {
    calcularTotal();
  }, [idades, faixas]);

  const carregarTabelas = async () => {
    try {
      const response = await fetch('/api/precos');
      const data = await response.json();
      if (response.ok) setTabelas(data.precos);
    } catch {}
  };

  const handleTabelaChange = (e) => {
    const tabelaId = e.target.value;
    setFormData({ ...formData, tabela_preco_id: tabelaId });
    if (tabelaId) {
      const tabela = tabelas.find(t => String(t.id) === String(tabelaId));
      setFaixas(tabela || {});
    } else {
      setFaixas({});
    }
    setIdades([]);
    setValorTotal(0);
  };

  const handleAddIdade = () => {
    const idadeNum = parseInt(formData.idade, 10);
    if (!isNaN(idadeNum) && idadeNum > 0) {
      setIdades([...idades, idadeNum]);
      setFormData({ ...formData, idade: '' });
    }
  };

  const handleRemoveIdade = (idx) => {
    setIdades(idades.filter((_, i) => i !== idx));
  };

  const calcularTotal = () => {
    if (!faixas || idades.length === 0) {
      setValorTotal(0);
      return;
    }
    let total = 0;
    idades.forEach(idade => {
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
      total += Number(faixas[faixa] || 0);
    });
    setValorTotal(total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tabela_preco_id || !formData.nome.trim() || !formData.telefone.trim() || idades.length === 0) {
      setMessage('Preencha todos os campos e adicione pelo menos uma idade.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabela_preco_id: formData.tabela_preco_id,
          nome: formData.nome,
          telefone: formData.telefone,
          idades
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Orçamento salvo com sucesso! Valor total: R$ ${data.valor_total.toFixed(2).replace('.', ',')}`);
        setFormData({ tabela_preco_id: '', nome: '', telefone: '', idade: '' });
        setIdades([]);
        setFaixas({});
        setValorTotal(0);
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Erro ao salvar orçamento');
    }
    setLoading(false);
  };

  return (
    <div className="orcamento-cadastro-container">
      <h2>📝 Cadastro de Orçamentos</h2>
      {message && <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</div>}
      <form onSubmit={handleSubmit} className="orcamento-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tabela_preco_id">Tabela de Preço:</label>
            <select id="tabela_preco_id" value={formData.tabela_preco_id} onChange={handleTabelaChange} required>
              <option value="">Selecione</option>
              {tabelas.map(t => (
                <option key={t.id} value={t.id}>
                  {t.cidade_nome} - {t.tipo_coparticipacao} - {t.acomodacao_nome} - {t.modalidade_nome} ({t.validade_inicio} a {t.validade_fim})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nome">Nome:</label>
            <input type="text" id="nome" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
          </div>
          <div className="form-group">
            <label htmlFor="telefone">Telefone:</label>
            <input type="text" id="telefone" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} required />
          </div>
        </div>
        <div className="idades-section">
          <h4>Idades</h4>
          <div className="add-idade-row">
            <input
              type="number"
              min="0"
              placeholder="Digite a idade"
              value={formData.idade}
              onChange={e => setFormData({ ...formData, idade: e.target.value })}
              onKeyDown={e => e.key === 'Enter' ? (e.preventDefault(), handleAddIdade()) : null}
            />
            <button type="button" onClick={handleAddIdade} disabled={!formData.idade || isNaN(parseInt(formData.idade, 10)) || parseInt(formData.idade, 10) <= 0}>Adicionar</button>
          </div>
          {idades.length > 0 && (
            <div className="idades-grid">
              {idades.map((idade, idx) => (
                <div key={idx} className="idade-item">
                  <span>{idade} anos</span>
                  <button type="button" className="btn-remove" onClick={() => handleRemoveIdade(idx)}>✖</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="total-section">
          <strong>Valor Total:</strong> <span className="valor-total">R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="form-buttons">
          <button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Orçamento'}</button>
        </div>
      </form>
    </div>
  );
}

export default OrcamentoCadastro; 