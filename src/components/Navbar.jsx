import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Cambiamos "export default function" por "export function"
export function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 py-2 shadow-sm">
      <div className="container-fluid">
        {/* LOGO / NOMBRE DE LA APP */}
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 me-4" to="/">
          <span role="img" aria-label="flor">🌸</span>
          <span style={{ color: '#ffffff' }}>Floristería</span>
        </Link>

        {/* BOTÓN COLAPSABLE PARA MÓVILES */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ outline: 'none', boxShadow: 'none' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* NAVEGACIÓN Y ACCIONES */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <Link
                className={`nav-link px-3 rounded-2 fw-medium ${isActive('/') ? 'active bg-secondary bg-opacity-25' : ''}`}
                to="/"
              >
                🏠 Tienda
              </Link>
            </li>

            {/* RUTAS PROTEGIDAS SEGÚN EL ROL DE USUARIO */}
            {user && (role === 'florist' || role === 'admin') && (
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 rounded-2 fw-medium ${isActive('/workshop') ? 'active bg-secondary bg-opacity-25' : ''}`}
                  to="/workshop"
                >
                  ✂️ Taller
                </Link>
              </li>
            )}

            {user && (role === 'delivery' || role === 'admin') && (
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 rounded-2 fw-medium ${isActive('/delivery') ? 'active bg-secondary bg-opacity-25' : ''}`}
                  to="/delivery"
                >
                  🚚 Domicilio
                </Link>
              </li>
            )}

            {user && role === 'admin' && (
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 rounded-2 fw-medium ${isActive('/admin') ? 'active bg-primary text-white' : ''}`}
                  to="/admin"
                >
                  📦 Admin Productos
                </Link>
              </li>
            )}
          </ul>

          {/* ÁREA DE SESIÓN (LOGIN / LOGOUT) */}
          <div className="d-flex align-items-center gap-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 px-3 py-2 border-1 rounded-3 fw-semibold shadow-none"
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <i className="bi bi-box-arrow-right fs-6"></i>
                <span>Cerrar Sesión</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="btn btn-danger btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold shadow-none text-white text-decoration-none"
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                  backgroundColor: '#dc3545',
                  border: 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <i className="bi bi-box-arrow-in-right fs-6"></i>
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// También agregamos la exportación por defecto para mantener compatibilidad con ambas formas
export default Navbar;