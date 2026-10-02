// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  // Si Firebase aún está determinando si hay sesión activa
  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted">Verificando permisos de acceso...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir inmediatamente a /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay filtro de roles y el rol del usuario no está permitido
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}