import React, { useState } from 'react';
import './CadastroCorretor.css';
import ListaCorretores from './ListaCorretores';

const CadastroCorretor = () => {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    senha: '',
    dataCadastro: new Date().toISOString().split('T')[0], // Data atual
    dataDesligamento: '',
    tipoUsuario: 'usuario' // Padrão: usuário
  });

  const [mostrarLista, setMostrarLista] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/corretores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Corretor cadastrado com sucesso!');
        // Limpar formulário
        setForm({
          nome: '',
          email: '',
          telefone: '',
          cpf: '',
          senha: '',
          dataCadastro: new Date().toISOString().split('T')[0],
          dataDesligamento: '',
          tipoUsuario: 'usuario'
        });
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao cadastrar corretor. Tente novamente.');
    }
  };

  if (mostrarLista) {
    return <ListaCorretores onVoltar={() => setMostrarLista(false)} />;
  }

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
        <label>Data de Cadastro
          <input type="date" name="dataCadastro" value={form.dataCadastro} onChange={handleChange} required />
        </label>
        <label>Data de Desligamento
          <input type="date" name="dataDesligamento" value={form.dataDesligamento} onChange={handleChange} />
        </label>
        <label>Tipo de Usuário
          <select name="tipoUsuario" value={form.tipoUsuario} onChange={handleChange} required>
            <option value="usuario">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <div className="form-buttons">
          <button type="submit">Cadastrar</button>
          <button type="button" className="secondary" onClick={() => setMostrarLista(true)}>
            Consultar Corretores
          </button>
        </div>
      </form>
    </div>
  );
};

export default CadastroCorretor; 