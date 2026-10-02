// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componentes y Vistas
import { Navbar } from './components/Navbar';
import { CatalogView } from './pages/CatalogView';
import { KitchenView } from './pages/KitchenView'; // Nombre exacto de tu componente
import { DeliveryView } from './pages/DeliveryView';
import { LoginView } from './pages/LoginView';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<CatalogView />} />
          <Route path="/login" element={<LoginView />} />

          {/* Rutas Protegidas por Rol */}
          <Route 
            path="/taller" 
            element={
              <ProtectedRoute allowedRoles={['taller', 'admin']}>
                <KitchenView />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/domicilios" 
            element={
              <ProtectedRoute allowedRoles={['domicilio', 'admin']}>
                <DeliveryView />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}