import React, { useState } from 'react';
import './CadastroCorretor.css';

const CadastroCorretor = () => {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    senha: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui futuramente enviaremos para o backend
    alert('Cadastro enviado!');
  };

  return (
    <div className="cadastro-corretor-container">
      <h2>Cadastro de Corretor</h2>
      <form onSubmit={handleSubmit} className="cadastro-form">
        <label>Nome
          <input type="text" name="nome" value={form.nome} onChange={handleChange} required />
        </label>
        <label>E-mail
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>Telefone
          <input type="tel" name="telefone" value={form.telefone} onChange={handleChange} required />
        </label>
        <label>CPF
          <input type="text" name="cpf" value={form.cpf} onChange={handleChange} required />
        </label>
        <label>Senha
          <input type="password" name="senha" value={form.senha} onChange={handleChange} required />
        </label>
        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
};

export default CadastroCorretor; 