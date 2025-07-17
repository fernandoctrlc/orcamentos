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
  const [logoOrcamento, setLogoOrcamento] = useState(null);
  const [logoBoleto, setLogoBoleto] = useState(null);

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

  // Buscar logo do orçamento do backend ao carregar a tela
  useEffect(() => {
    fetch('/api/logo-orcamento')
      .then(res => res.json())
      .then(data => {
        if (data.path) {
          setLogoOrcamento(`/api/uploads/${data.path.split('/').pop()}`);
        } else {
          setLogoOrcamento(null);
        }
      })
      .catch(() => setLogoOrcamento(null));
  }, []);

  // Buscar logo do boleto do backend ao carregar a tela
  useEffect(() => {
    fetch('/api/logo-boleto')
      .then(res => res.json())
      .then(data => {
        if (data.path) {
          setLogoBoleto(`/api/uploads/${data.path.split('/').pop()}`);
        } else {
          setLogoBoleto(null);
        }
      })
      .catch(() => setLogoBoleto(null));
  }, []);

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
      // Usar logo do boleto do backend como fundo
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

      // Buscar logo personalizada do orçamento
      let logoSrc = logoOrcamento || '/logov3.png';
      let tabela = tabelas.find(t => String(t.id) === String(formData.tabela_preco_id));
      // Se faltar algum campo de coparticipação, buscar na cidade correspondente
      if (tabela && (!('consultas_eletivas' in tabela))) {
        const cidade = cidades.find(c => String(c.id) === String(tabela.cidade_id));
        if (cidade) {
          tabela = {
            ...tabela,
            consultas_eletivas: cidade.consultas_eletivas,
            consultas_urgencias: cidade.consultas_urgencias,
            exames_simples: cidade.exames_simples,
            exames_complexos: cidade.exames_complexos,
            terapias_especiais: cidade.terapias_especiais,
            demais_terapias: cidade.demais_terapias,
            estado: cidade.estado
          };
        }
      }
      const vendedorNome = localStorage.getItem('corretorNome');
      const vendedorTelefone = localStorage.getItem('corretorTelefone');
      // Coparticipações da cidade
      let copart = '';
      if (tabela) {
        copart = `
          <div style="margin-top: 30px; border: 2px solid #2196f3; border-radius: 12px; padding: 18px 20px; background: #fafdff;">
            <h3 style="color: #1976d2; margin: 0 0 12px 0; font-size: 1.15rem;">Coparticipações da Cidade (${tabela.cidade_nome ? tabela.cidade_nome.toUpperCase() : ''} - ${tabela.estado || ''})</h3>
            <div style="font-size: 1.05rem;">
              <b>Consultas Eletivas:</b> R$ ${tabela.consultas_eletivas ? Number(tabela.consultas_eletivas).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Consultas Urgências:</b> R$ ${tabela.consultas_urgencias ? Number(tabela.consultas_urgencias).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Exames Simples:</b> R$ ${tabela.exames_simples ? Number(tabela.exames_simples).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Exames Complexos:</b> R$ ${tabela.exames_complexos ? Number(tabela.exames_complexos).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Terapias Especiais:</b> R$ ${tabela.terapias_especiais ? Number(tabela.terapias_especiais).toFixed(2).replace('.', ',') : '--'}<br/>
              <b>Demais Terapias:</b> R$ ${tabela.demais_terapias ? Number(tabela.demais_terapias).toFixed(2).replace('.', ',') : '--'}
            </div>
          </div>
        `;
      }
      orcamentoDiv.innerHTML = `
        <div style="max-width: 520px; margin: 0 auto; border: 2px solid #2196f3; border-radius: 16px; background: #fff; padding: 32px 24px 24px 24px; font-family: Arial, sans-serif; position: relative; overflow: hidden;">
          ${logoBoleto ? `<img src='${logoBoleto}' alt='Fundo Boleto' style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; opacity:0.1; z-index:0; pointer-events:none;" />` : ''}
          <div style="position: relative; z-index: 1;">
            <div style="text-align: center; margin-bottom: 18px;">
              <img src="${logoSrc}" alt='Logo' style="max-width:290px; max-height:230px; margin-bottom:10px; border-radius:8px; display:block; margin-left:auto; margin-right:auto;" />
            </div>
            <h2 style="color: #1976d2; text-align: center; margin: 0 0 18px 0; font-size: 1.3rem;">Orçamento para ${formData.nome || '---'}</h2>
            <div style="margin-bottom: 10px; text-align: center;">
              <b>Vendedor:</b> ${vendedorNome || '---'}<br/>
              <b>Telefone:</b> ${vendedorTelefone || '---'}<br/>
              <b>Data:</b> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}<br/>
            </div>
            <div style="margin-bottom: 10px; text-align: center;">
              <b>Tabela de Preço:</b> ${tabela?.cidade_nome || ''} - ${tabela?.tipo_coparticipacao || ''} - ${tabela?.acomodacao_nome || ''} - ${tabela?.modalidade_nome || ''} (${tabela?.validade_inicio || ''} a ${tabela?.validade_fim || ''})
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
                        <td style=\"border: 1px solid #1976d2; padding: 6px 18px; text-align: center;\">${idade}</td>
                        <td style=\"border: 1px solid #1976d2; padding: 6px 18px; text-align: center;\">R$ ${valor}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            <div style="text-align: center; font-size: 1.1rem; margin-bottom: 10px;"><b>Total:</b> R$ ${valorTotal.toFixed(2).replace('.', ',')}</div>
            ${copart}
          </div>
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
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo
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