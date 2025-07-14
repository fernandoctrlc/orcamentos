import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Menu.css';

function Menu() {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);

  // Recuperar nome e telefone do corretor logado
  const corretorNome = localStorage.getItem('corretorNome');
  const corretorTelefone = localStorage.getItem('corretorTelefone');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const menuItems = [
    {
      id: 'cadastros',
      label: 'Cadastros',
      icon: '📋',
      items: [
        { path: '/corretores', label: 'Corretores', icon: '👥' },
        { path: '/cidades', label: 'Cidades', icon: '🏙️' },
        { path: '/operadoras', label: 'Operadoras', icon: '🏢' },
        { path: '/modalidades', label: 'Modalidades', icon: '📋' },
        { path: '/acomodacoes', label: 'Acomodações', icon: '🏠' },
        { path: '/tabelas-preco', label: 'Tabelas de Preço', icon: '💲' }
      ]
    },
    {
      id: 'orcamentos',
      label: 'Orçamentos',
      icon: '📝',
      items: [
        { path: '/orcamentos/cadastro', label: 'Cadastro de Orçamentos', icon: '➕' },
        { path: '/orcamentos/consulta', label: 'Consulta de Orçamentos', icon: '🔎' }
      ]
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: '📊',
      items: [
        { path: '/pipeline', label: 'Kanban de Orçamentos', icon: '🗂️' }
      ]
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: '⚙️',
      items: [
        { path: '/configuracoes/integracoes', label: 'Integrações', icon: '🔗' },
        { path: '/configuracoes/alertas', label: 'Alertas', icon: '🔔' },
        { path: '/configuracoes/personalizacao', label: 'Personalização', icon: '🎨' }
      ]
    }
  ];

  const toggleDropdown = (dropdownId) => {
    setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
  };

  const isActive = (item) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.items) {
      return item.items.some(subItem => isActive(subItem));
    }
    return false;
  };

  return (
    <nav className="menu">
      <div className="menu-header">
        <div className="menu-logo">
          <img src="/logov3.png" alt="Logo" style={{maxWidth:120, maxHeight:60, borderRadius:8, background:'#fff'}} />
        </div>
        <h1>Cotador V3 Corretora</h1>
        {corretorNome && (
          <div className="corretor-logado">
            <span>👤 {corretorNome}</span>
            {corretorTelefone && <span style={{ fontSize: '13px', color: '#eee', marginLeft: 8 }}>({corretorTelefone})</span>}
          </div>
        )}
      </div>
      <ul className="menu-list">
        {menuItems.map((item) => (
          <li key={item.id} className={`menu-item ${isActive(item) ? 'active' : ''}`}>
            <div 
              className="menu-dropdown-header"
              onClick={() => toggleDropdown(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              <span className={`dropdown-arrow ${openDropdown === item.id ? 'open' : ''}`}>
                ▼
              </span>
            </div>
            <ul className={`dropdown-menu ${openDropdown === item.id ? 'open' : ''}`}>
              {item.items.map((subItem) => (
                <li key={subItem.path} className="dropdown-item">
                  <Link 
                    to={subItem.path} 
                    className={`dropdown-link ${location.pathname === subItem.path ? 'active' : ''}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    <span className="submenu-icon">{subItem.icon}</span>
                    <span className="submenu-label">{subItem.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <button className="logout-btn" onClick={handleLogout}>Sair</button>
    </nav>
  );
}

export default Menu; 