import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Menu.css';

function Menu() {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);

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
        { path: '/acomodacoes', label: 'Acomodações', icon: '🏠' }
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
        <h1>Sistema de Orçamentos</h1>
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
    </nav>
  );
}

export default Menu; 