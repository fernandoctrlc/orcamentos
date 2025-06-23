import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Menu from './components/Menu';
import CadastroCorretor from './components/CadastroCorretor';
import ListaCorretores from './components/ListaCorretores';
import Cidades from './components/Cidades';
import Operadoras from './components/Operadoras';
import Modalidades from './components/Modalidades';
import Acomodacoes from './components/Acomodacoes';

function App() {
  return (
    <Router>
      <div className="App">
        <Menu />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/corretores" replace />} />
            <Route path="/corretores" element={<CadastroCorretor />} />
            <Route path="/corretores/lista" element={<ListaCorretores />} />
            <Route path="/cidades" element={<Cidades />} />
            <Route path="/operadoras" element={<Operadoras />} />
            <Route path="/modalidades" element={<Modalidades />} />
            <Route path="/acomodacoes" element={<Acomodacoes />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
