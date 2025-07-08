import React, { useState, useEffect } from 'react';
import './OrcamentoCadastro.css';
import html2canvas from 'html2canvas';

function OrcamentoCadastro() {
  const [tabelas, setTabelas] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [formData, setFormData] = useState({
    cidade_id: '',
    tipo_documento: 'CPF',
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
    carregarCidades();
  }, []);

  useEffect(() => {
    if (formData.cidade_id && formData.tipo_documento) {
      carregarTabelas(formData.cidade_id, formData.tipo_documento);
    } else {
      setTabelas([]);
    }
  }, [formData.cidade_id, formData.tipo_documento]);

  useEffect(() => {
    calcularTotal();
  }, [idades, faixas]);

  const carregarCidades = async () => {
    try {
      const response = await fetch('/api/cidades');
      const data = await response.json();
      if (response.ok) setCidades(data.cidades);
    } catch {}
  };

  const carregarTabelas = async (cidadeId, tipoDocumento) => {
    if (!cidadeId || !tipoDocumento) {
      setTabelas([]);
      return;
    }
    try {
      const url = `/api/precos?cidade_id=${cidadeId}&tipo_documento=${tipoDocumento}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setTabelas(data.precos);
      }
    } catch (error) {
      console.error('Erro ao carregar tabelas:', error);
    }
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

  const gerarPngOrcamento = async () => {
    try {
      // Criar elemento temporário para o orçamento
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

      const tabela = tabelas.find(t => String(t.id) === String(formData.tabela_preco_id));
      const vendedorNome = localStorage.getItem('corretorNome');
      const vendedorTelefone = localStorage.getItem('corretorTelefone');

      orcamentoDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0;">ORÇAMENTO</h1>
          <hr style="border: 2px solid #3498db; margin: 10px 0;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Dados do Cliente</h3>
          <p style="margin: 5px 0;"><strong>Nome:</strong> ${formData.nome}</p>
          <p style="margin: 5px 0;"><strong>Telefone:</strong> ${formData.telefone}</p>
          <p style="margin: 5px 0;"><strong>Tipo de Documento:</strong> ${formData.tipo_documento}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Plano Selecionado</h3>
          <p style="margin: 5px 0;"><strong>Cidade:</strong> ${tabela?.cidade_nome || ''}</p>
          <p style="margin: 5px 0;"><strong>Operadora:</strong> ${tabela?.operadora_nome || ''}</p>
          <p style="margin: 5px 0;"><strong>Tipo de Coparticipação:</strong> ${tabela?.tipo_coparticipacao || ''}</p>
          <p style="margin: 5px 0;"><strong>Acomodação:</strong> ${tabela?.acomodacao_nome || ''}</p>
          <p style="margin: 5px 0;"><strong>Modalidade:</strong> ${tabela?.modalidade_nome || ''}</p>
          <p style="margin: 5px 0;"><strong>Validade:</strong> ${tabela?.validade_inicio || ''} a ${tabela?.validade_fim || ''}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Valores por Idade</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #3498db; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Idade</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${idades.map(idade => {
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
                const valor = tabela && tabela[faixa] ? Number(tabela[faixa]).toFixed(2).replace('.', ',') : '0,00';
                return `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idade} anos</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">R$ ${valor}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 20px; text-align: right;">
          <h2 style="color: #e74c3c; margin: 0;">Valor Total: R$ ${valorTotal.toFixed(2).replace('.', ',')}</h2>
        </div>

        <div style="margin-top: 40px; border-top: 2px solid #333; padding-top: 20px;">
          <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Dados do Vendedor</h3>
          <p style="margin: 5px 0;"><strong>Nome:</strong> ${vendedorNome || 'Não informado'}</p>
          <p style="margin: 5px 0;"><strong>Telefone:</strong> ${vendedorTelefone || 'Não informado'}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      `;

      document.body.appendChild(orcamentoDiv);

      // Gerar imagem
      const canvas = await html2canvas(orcamentoDiv, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      // Remover elemento temporário
      document.body.removeChild(orcamentoDiv);

      // Download da imagem
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `orcamento_${formData.nome.replace(/\s+/g, '_')}.png`;
      link.click();

    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cidade_id || !formData.tipo_documento || !formData.tabela_preco_id || !formData.nome.trim() || !formData.telefone.trim() || idades.length === 0) {
      setMessage('Preencha todos os campos e adicione pelo menos uma idade.');
      return;
    }
    setLoading(true);
    try {
      const corretorId = localStorage.getItem('corretorId');
      const response = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabela_preco_id: formData.tabela_preco_id,
          nome: formData.nome,
          telefone: formData.telefone,
          tipo_documento: formData.tipo_documento,
          idades,
          corretor_id: corretorId
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Orçamento salvo com sucesso! Valor total: R$ ${data.valor_total.toFixed(2).replace('.', ',')}`);
        // Gerar imagem do orçamento automaticamente
        setTimeout(() => {
          gerarPngOrcamento();
        }, 500);
        setFormData({ cidade_id: '', tipo_documento: 'CPF', tabela_preco_id: '', nome: '', telefone: '', idade: '' });
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
            <label htmlFor="cidade_id">Cidade:</label>
            <select id="cidade_id" value={formData.cidade_id} onChange={e => setFormData({ ...formData, cidade_id: e.target.value })} required>
              <option value="">Selecione</option>
              {cidades.map(cidade => (
                <option key={cidade.id} value={cidade.id}>{cidade.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tipo_documento">Tipo de Documento:</label>
            <select id="tipo_documento" value={formData.tipo_documento} onChange={e => setFormData({ ...formData, tipo_documento: e.target.value })} required>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tabela_preco_id">Tabela de Preço:</label>
            <select id="tabela_preco_id" value={formData.tabela_preco_id} onChange={handleTabelaChange} required disabled={!formData.cidade_id || !formData.tipo_documento}>
              <option value="">
                {!formData.cidade_id || !formData.tipo_documento 
                  ? 'Selecione cidade e tipo de documento primeiro' 
                  : tabelas.length === 0 
                    ? 'Nenhuma tabela disponível para esta cidade e tipo de documento' 
                    : 'Selecione'}
              </option>
              {tabelas.map(t => (
                <option key={t.id} value={t.id}>
                  {t.operadora_nome} - {t.tipo_coparticipacao} - {t.acomodacao_nome} - {t.modalidade_nome} ({t.validade_inicio} a {t.validade_fim})
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