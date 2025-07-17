import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Menu from './components/Menu';
import CadastroCorretor from './components/CadastroCorretor';
import ListaCorretores from './components/ListaCorretores';
import Cidades from './components/Cidades';
import Operadoras from './components/Operadoras';
import Modalidades from './components/Modalidades';
import Acomodacoes from './components/Acomodacoes';
import TabelasDePreco from './components/TabelasDePreco';
import OrcamentoCadastro from './components/OrcamentoCadastro';
import OrcamentoConsulta from './components/OrcamentoConsulta';
import Login from './components/Login';
import PipelineKanban from './components/PipelineKanban';
import Personalizacao from './components/Personalizacao';
import Dashboard from './components/Dashboard';

function PrivateRoute({ children }) {
  // const isAuth = localStorage.getItem('authToken') === 'admin-token';
  const isAuth = !!localStorage.getItem('authToken');
  return isAuth ? children : <Navigate to="/login" replace />;
}

function TitleUpdater() {
  const location = useLocation();
  React.useEffect(() => {
    const titulo = localStorage.getItem('appTitulo') || 'Cotador V3 Corretora';
    document.title = titulo;
  }, [location]);
  return null;
}

function App() {
  const tipoUsuario = localStorage.getItem('tipoUsuario') || 'usuario';
  return (
    <Router>
      <TitleUpdater />
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login onLogin={() => window.location.href = '/'} />} />
          <Route path="/*" element={
            <PrivateRoute>
              <Menu />
              <div className="main-content">
                <Routes>
                  {tipoUsuario === 'backoffice' ? (
                    <>
                      <Route path="/pipeline" element={<PipelineKanban />} />
                      <Route path="/orcamentos/cadastro" element={<OrcamentoCadastro />} />
                      <Route path="/orcamentos/consulta" element={<OrcamentoConsulta />} />
                      <Route path="/corretores" element={<CadastroCorretor />} />
                      <Route path="*" element={<Navigate to="/pipeline" replace />} />
                    </>
                  ) : (
                    <>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/corretores" element={<CadastroCorretor />} />
                      <Route path="/corretores/lista" element={<ListaCorretores />} />
                      <Route path="/cidades" element={<Cidades />} />
                      <Route path="/operadoras" element={<Operadoras />} />
                      <Route path="/modalidades" element={<Modalidades />} />
                      <Route path="/acomodacoes" element={<Acomodacoes />} />
                      <Route path="/tabelas-preco" element={<TabelasDePreco />} />
                      <Route path="/orcamentos/cadastro" element={<OrcamentoCadastro />} />
                      <Route path="/orcamentos/consulta" element={<OrcamentoConsulta />} />
                      <Route path="/pipeline" element={<PipelineKanban />} />
                      <Route path="/configuracoes/integracoes" element={<div style={{padding:32}}><h2>Integrações</h2><p>Página de integrações.</p></div>} />
                      <Route path="/configuracoes/alertas" element={<div style={{padding:32}}><h2>Alertas</h2><p>Página de alertas.</p></div>} />
                      <Route path="/configuracoes/personalizacao" element={<Personalizacao />} />
                    </>
                  )}
                </Routes>
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </div>
      <footer style={{position: 'fixed', left: 0, bottom: 0, width: '100%', background: '#222', color: '#fff', padding: '6px 16px', fontSize: '14px', zIndex: 999, textAlign: 'left'}}>
        Sistema de Orçamentos - v1.0.0
      </footer>
    </Router>
  );
}

export default App;
