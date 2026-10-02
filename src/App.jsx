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

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Ruta pública */}
          <Route path="/" element={<ClientView />} />
          <Route path="/login" element={<LoginView />} />

          {/* Rutas protegidas por Rol */}
          <Route 
            path="/taller" 
            element={
              <ProtectedRoute allowedRoles={['florist', 'taller', 'admin']}>
                <KitchenView />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/domicilios" 
            element={
              <ProtectedRoute allowedRoles={['delivery', 'domicilio', 'admin']}>
                <DeliveryView />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}