import React, { useState, useEffect } from 'react';

function Personalizacao() {
  const [logo, setLogo] = useState(null);
  const [nomeApp, setNomeApp] = useState('');
  const [tituloJanela, setTituloJanela] = useState('');
  const [preview, setPreview] = useState(null);

  // Carregar dados do localStorage ao abrir a tela
  useEffect(() => {
    const savedLogo = localStorage.getItem('appLogo');
    const savedNome = localStorage.getItem('appNome');
    const savedTitulo = localStorage.getItem('appTitulo');
    if (savedLogo) setPreview(savedLogo);
    if (savedNome) setNomeApp(savedNome);
    if (savedTitulo) {
      setTituloJanela(savedTitulo);
      document.title = savedTitulo;
    }
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (preview) localStorage.setItem('appLogo', preview);
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