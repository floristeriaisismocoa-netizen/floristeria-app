import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar navbar-dark bg-dark mb-3 shadow-sm sticky-top">
      <div className="container-fluid px-3 d-flex justify-content-between align-items-center">
        <Link className="navbar-brand fw-bold fs-4 m-0" to="/" onClick={closeMenu}>
          🌸 Floristería
        </Link>
        
        <button 
          className="navbar-toggler border-0 px-2" 
          type="button" 
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
      </div>

      {/* Menú desplegable móvil impulsado por estado de React */}
      {isOpen && (
        <div className="w-100 bg-dark px-3 pb-3 pt-2">
          <div className="nav flex-column gap-2">
            <Link 
              className={`nav-link px-3 py-2 rounded text-white ${location.pathname === '/' ? 'bg-primary fw-bold' : ''}`} 
              to="/"
              onClick={closeMenu}
            >
              <i className="bi bi-shop me-2"></i>Cliente / Tienda
            </Link>
            <Link 
              className={`nav-link px-3 py-2 rounded text-white ${location.pathname === '/taller' ? 'bg-primary fw-bold' : ''}`} 
              to="/taller"
              onClick={closeMenu}
            >
              <i className="bi bi-tools me-2"></i>Taller
            </Link>
            <Link 
              className={`nav-link px-3 py-2 rounded text-white ${location.pathname === '/domicilios' ? 'bg-primary fw-bold' : ''}`} 
              to="/domicilios"
              onClick={closeMenu}
            >
              <i className="bi bi-truck me-2"></i>Domicilio
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}