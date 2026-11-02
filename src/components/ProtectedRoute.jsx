// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  // 1. Si Firebase aún está resolviendo el estado de la sesión, muestra pantalla de carga
  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted">Verificando acceso...</p>
      </div>
    );
  }

  // 2. Si NO hay usuario autenticado, redirigir SIEMPRE al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Normalizar el rol del usuario y los roles permitidos a minúsculas para evitar conflictos de mayúsculas
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = role ? role.toLowerCase() : '';
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  // 4. Si pasa las validaciones, renderizar la pantalla protegida
  return children;
}