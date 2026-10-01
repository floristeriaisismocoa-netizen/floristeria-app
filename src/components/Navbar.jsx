import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar navbar-dark bg-dark mb-3 shadow-sm sticky-top">
      <div className="container-fluid px-3">
        <Link className="navbar-brand fw-bold fs-4" to="/" onClick={closeMenu}>
          🌸 Floristería
        </Link>
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
          <div className="navbar-nav ms-auto gap-1 pt-2">
            <Link 
              className={`nav-link px-3 rounded ${location.pathname === '/' ? 'active bg-primary fw-bold text-white' : ''}`} 
              to="/"
              onClick={closeMenu}
            >
              <i className="bi bi-shop me-2"></i>Cliente / Tienda
            </Link>
            <Link 
              className={`nav-link px-3 rounded ${location.pathname === '/taller' ? 'active bg-primary fw-bold text-white' : ''}`} 
              to="/taller"
              onClick={closeMenu}
            >
              <i className="bi bi-tools me-2"></i>Taller
            </Link>
            <Link 
              className={`nav-link px-3 rounded ${location.pathname === '/domicilios' ? 'active bg-primary fw-bold text-white' : ''}`} 
              to="/domicilios"
              onClick={closeMenu}
            >
              <i className="bi bi-truck me-2"></i>Domicilio
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}