import React, { useState } from 'react';
import './Login.css';

function formatCPF(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function Login({ onLogin }) {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, ''), senha })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('authToken', data.token);
        if (data.id) localStorage.setItem('corretorId', data.id);
        if (data.nome) localStorage.setItem('corretorNome', data.nome);
        if (data.telefone) localStorage.setItem('corretorTelefone', data.telefone);
        if (onLogin) onLogin();
      } else {
        setError('CPF ou senha inválidos');
      }
    } catch {
      setError('Erro ao conectar ao servidor');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-logo">
          <img src="/logov3.png" alt="Logo" style={{maxWidth:180, maxHeight:80, borderRadius:8, background:'#fff'}} />
        </div>
        <h2>Cotador V3 Corretora</h2>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label>CPF</label>
          <input
            type="text"
            value={cpf}
            onChange={e => setCpf(formatCPF(e.target.value))}
            placeholder="Digite o CPF"
            maxLength={14}
            required
          />
        </div>
        <div className="form-group">
          <label>Senha</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login; 