import React, { useState, useEffect } from 'react';

function Personalizacao() {
  const [logo, setLogo] = useState(null);
  const [boletoLogo, setBoletoLogo] = useState(null);
  const [nomeApp, setNomeApp] = useState('');
  const [tituloJanela, setTituloJanela] = useState('');
  const [preview, setPreview] = useState(null);
  const [boletoPreview, setBoletoPreview] = useState(null);
  const [orcamentoLogo, setOrcamentoLogo] = useState(null);
  const [orcamentoPreview, setOrcamentoPreview] = useState(null);
  const [logoOrcamento, setLogoOrcamento] = useState(null);
  const [logoBoleto, setLogoBoleto] = useState(null);

  // Carregar dados do localStorage ao abrir a tela
  useEffect(() => {
    const savedLogo = localStorage.getItem('appLogo');
    const savedBoletoLogo = localStorage.getItem('boletoLogo');
    const savedNome = localStorage.getItem('appNome');
    const savedTitulo = localStorage.getItem('appTitulo');
    if (savedLogo) setPreview(savedLogo);
    if (savedBoletoLogo) setBoletoPreview(savedBoletoLogo);
    if (savedNome) setNomeApp(savedNome);
    if (savedTitulo) {
      setTituloJanela(savedTitulo);
      document.title = savedTitulo;
    }
  }, []);

  // Buscar logo do orçamento do backend ao abrir a tela
  useEffect(() => {
    fetch('/api/logo-orcamento')
      .then(res => res.json())
      .then(data => {
        if (data.path) {
          setLogoOrcamento(`/api/uploads/${data.path.split('/').pop()}`);
          setOrcamentoPreview(`/api/uploads/${data.path.split('/').pop()}`);
        } else {
          setLogoOrcamento(null);
          setOrcamentoPreview(null);
        }
      })
      .catch(() => {
        setLogoOrcamento(null);
        setOrcamentoPreview(null);
      });
  }, []);

  // Buscar logo do boleto do backend ao abrir a tela
  useEffect(() => {
    fetch('/api/logo-boleto')
      .then(res => res.json())
      .then(data => {
        if (data.path) {
          setLogoBoleto(`/api/uploads/${data.path.split('/').pop()}`);
          setBoletoPreview(`/api/uploads/${data.path.split('/').pop()}`);
        } else {
          setLogoBoleto(null);
          setBoletoPreview(null);
        }
      })
      .catch(() => {
        setLogoBoleto(null);
        setBoletoPreview(null);
      });
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          setPreview(reader.result);
        } else {
          setPreview(null);
          alert('Arquivo inválido. Por favor, selecione uma imagem válida (PNG, JPG, etc).');
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleBoletoLogoChange = async (e) => {
    const file = e.target.files[0];
    setBoletoLogo(file);
    if (file) {
      const formData = new FormData();
      formData.append('logo', file);
      try {
        const response = await fetch('/api/upload-boleto-logo', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (response.ok && data.path) {
          const url = `/api/uploads/${data.path.split('/').pop()}`;
          setLogoBoleto(url);
          setBoletoPreview(url);
        } else {
          setBoletoPreview(null);
          alert('Falha ao enviar a imagem: ' + (data.error || 'Erro desconhecido.'));
        }
      } catch (err) {
        setBoletoPreview(null);
        alert('Erro ao enviar a imagem para o servidor.');
      }
    } else {
      setBoletoPreview(null);
    }
  };

  const handleOrcamentoLogoChange = async (e) => {
    const file = e.target.files[0];
    setOrcamentoLogo(file);
    if (file) {
      // Envia para o backend
      const formData = new FormData();
      formData.append('logo', file);
      try {
        const response = await fetch('/api/upload-logo', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (response.ok && data.path) {
          // Atualiza preview e logoOrcamento com a nova logo
          const url = `/api/uploads/${data.path.split('/').pop()}`;
          setLogoOrcamento(url);
          setOrcamentoPreview(url);
        } else {
          setOrcamentoPreview(null);
          alert('Falha ao enviar a imagem: ' + (data.error || 'Erro desconhecido.'));
        }
      } catch (err) {
        setOrcamentoPreview(null);
        alert('Erro ao enviar a imagem para o servidor.');
      }
    } else {
      setOrcamentoPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (preview && preview.startsWith('data:image/')) localStorage.setItem('appLogo', preview);
    else if (preview) {
      alert('A logo não é uma imagem válida. Escolha outra.');
      return;
    }
    if (boletoPreview && boletoPreview.startsWith('/api/')) {
      // já está salvo no backend, não precisa salvar nada aqui
    } else if (boletoPreview) {
      alert('A logo do boleto não é uma imagem válida. Escolha outra.');
      return;
    }
    if (orcamentoPreview && orcamentoPreview.startsWith('/api/')) {
      // já está salvo no backend, não precisa salvar nada aqui
    } else if (orcamentoPreview) {
      alert('A logo do orçamento não é uma imagem válida. Escolha outra.');
      return;
    }
    localStorage.setItem('appNome', nomeApp);
    localStorage.setItem('appTitulo', tituloJanela);
    document.title = tituloJanela;
    alert('Personalização salva com sucesso!');
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', background: '#fff', borderRadius: 10, boxShadow: '0 2px 10px #0001', padding: 32 }}>
      <h2 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 24 }}>Personalização do Aplicativo</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 500 }}>Logo do Aplicativo:</label><br />
          <input type="file" accept="image/*" onChange={handleLogoChange} />
          {preview && <div style={{ marginTop: 10 }}><img src={preview} alt="Preview" style={{ maxWidth: 180, maxHeight: 80, borderRadius: 8, border: '1px solid #eee' }} /></div>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 500 }}>Logo do Boleto:</label><br />
          <input type="file" accept="image/*" onChange={handleBoletoLogoChange} />
          {boletoPreview && <div style={{ marginTop: 10 }}><img src={boletoPreview} alt="Preview Boleto" style={{ maxWidth: 180, maxHeight: 80, borderRadius: 8, border: '1px solid #eee' }} /></div>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 500 }}>Logo do Orçamento:</label><br />
          <input type="file" accept="image/*" onChange={handleOrcamentoLogoChange} />
          {orcamentoPreview && <div style={{ marginTop: 10 }}><img src={orcamentoPreview} alt="Preview Orçamento" style={{ maxWidth: 180, maxHeight: 80, borderRadius: 8, border: '1px solid #eee' }} /></div>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 500 }}>Nome do Aplicativo:</label><br />
          <input type="text" value={nomeApp} onChange={e => setNomeApp(e.target.value)} placeholder="Ex: Sistema de Orçamentos" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontWeight: 500 }}>Título da Janela:</label><br />
          <input type="text" value={tituloJanela} onChange={e => setTituloJanela(e.target.value)} placeholder="Ex: Orçamentos V3" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }} />
        </div>
        <button type="submit" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', padding: '12px 32px', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%' }}>
          Salvar Personalização
        </button>
      </form>
    </div>
  );
}

export default Personalizacao; 