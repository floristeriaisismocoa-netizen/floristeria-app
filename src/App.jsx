// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Componentes y Vistas
import Navbar from './components/Navbar';
import { ClientView } from './pages/ClientView';
import { ProductDetailView } from './pages/ProductDetailView';
import { OrderTrackingView } from './pages/OrderTrackingView';
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
          <Route path="/producto/:id" element={<ProductDetailView />} />
          <Route path="/rastreo" element={<OrderTrackingView />} />
          <Route path="/rastreo/:orderId" element={<OrderTrackingView />} />
          <Route path="/login" element={<LoginView />} />

          {/* Rutas Protegidas por Rol */}
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

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProductsView />
              </ProtectedRoute>
            } 
          />

          {/* Fallback a inicio */}
          <Route path="*" element={<ClientView />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}