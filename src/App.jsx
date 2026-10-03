// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componentes y Vistas
import { Navbar } from './components/Navbar';
import { ClientView } from './pages/ClientView';
import { KitchenView } from './pages/KitchenView';
import { DeliveryView } from './pages/DeliveryView';
import { LoginView } from './pages/LoginView';
import { AdminProductsView } from './pages/AdminProductsView';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<ClientView />} />
          <Route path="/login" element={<LoginView />} />

          {/* Rutas Protegidas por Rol (Coincidiendo con el Navbar) */}
          <Route 
            path="/workshop" 
            element={
              <ProtectedRoute allowedRoles={['florist', 'taller', 'admin']}>
                <KitchenView />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/delivery" 
            element={
              <ProtectedRoute allowedRoles={['delivery', 'domicilio', 'admin']}>
                <DeliveryView />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProductsView />
              </ProtectedRoute>
            } 
          />

          {/* Redirección por defecto si la ruta no existe */}
          <Route path="*" element={<ClientView />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}