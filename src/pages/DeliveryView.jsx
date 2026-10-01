// src/pages/DeliveryView.jsx
import React, { useEffect, useState } from 'react';
import { subscribeToOrders, updateOrderStatus } from '../services/ordersService';

export function DeliveryView() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDIENTES'); // 'PENDIENTES' o 'ENTREGADOS'
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    // Suscripción en tiempo real a la colección de pedidos
    const unsubscribe = subscribeToOrders((data) => {
      setOrders(data);
    });
    return () => unsubscribe();
  }, []);

  // Función para cambiar el estado en Firestore con control de carga e inspección de errores
  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, nextStatus);
    } catch (error) {
      console.error(`Error al cambiar estado a ${nextStatus}:`, error);
      alert('Error al actualizar el estado del pedido en la base de datos.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Formateador seguro de fecha y hora
  const formatDateTime = (createdAt) => {
    if (!createdAt) return 'Reciente';
    try {
      const dateObj = typeof createdAt.toDate === 'function' 
        ? createdAt.toDate() 
        : new Date(createdAt);
      return isNaN(dateObj.getTime()) 
        ? 'Reciente' 
        : dateObj.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'Reciente';
    }
  };

  // Filtros de pedidos según su estado actual
  const pendingOrders = orders.filter(
    o => o.status === 'LISTO_PARA_ENTREGA' || o.status === 'EN_PROCESO_DE_ENTREGA'
  );

  const deliveredOrders = orders.filter(
    o => o.status === 'ENTREGADO'
  );

  const displayedOrders = activeTab === 'PENDIENTES' ? pendingOrders : deliveredOrders;

  return (
    <div className="container py-3" style={{ maxWidth: '650px' }}>
      <h3 className="fw-bold text-center mb-3">
        <i className="bi bi-truck me-2"></i>
        Módulo de Entregas
      </h3>

      {/* Navegación por Pestañas */}
      <ul className="nav nav-pills nav-justified mb-4 bg-light p-1 rounded border">
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'PENDIENTES' ? 'active bg-primary' : 'text-dark'}`}
            onClick={() => setActiveTab('PENDIENTES')}
          >
            <i className="bi bi-clock-history me-2"></i>
            Por Entregar ({pendingOrders.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-bold ${activeTab === 'ENTREGADOS' ? 'active bg-success' : 'text-dark'}`}
            onClick={() => setActiveTab('ENTREGADOS')}
          >
            <i className="bi bi-check-circle-fill me-2"></i>
            Historial Entregados ({deliveredOrders.length})
          </button>
        </li>
      </ul>

      {/* Listado de Pedidos */}
      {displayedOrders.length === 0 ? (
        <div className="text-center py-5 text-muted bg-light rounded shadow-sm">
          <i className={`bi ${activeTab === 'PENDIENTES' ? 'bi-box-seam' : 'bi-journal-check'} display-1 mb-3 d-block text-secondary`}></i>
          <h5>
            {activeTab === 'PENDIENTES' 
              ? 'No hay pedidos listos para entregar en este momento.' 
              : 'Aún no hay pedidos registrados en el historial de entregados.'}
          </h5>
        </div>
      ) : (
        displayedOrders.map((order) => {
          const isUpdating = updatingId === order.id;

          return (
            <div key={order.id} className="card mb-3 shadow-sm border-0 bg-light">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge bg-primary fs-6">
                    #{order.id.slice(-5).toUpperCase()}
                  </span>
                  <div>
                    <small className="text-muted me-2">{formatDateTime(order.createdAt)}</small>
                    <span className={`badge ${
                      order.status === 'EN_PROCESO_DE_ENTREGA' 
                        ? 'bg-warning text-dark' 
                        : order.status === 'ENTREGADO' 
                        ? 'bg-success' 
                        : 'bg-info text-dark'
                    }`}>
                      {order.status === 'EN_PROCESO_DE_ENTREGA' 
                        ? 'En Camino' 
                        : order.status === 'ENTREGADO' 
                        ? 'Entregado' 
                        : 'Listo'}
                    </span>
                  </div>
                </div>

                <h5 className="card-title fw-bold mb-1">{order.customer?.name}</h5>
                
                {/* Enlace a Google Maps */}
                <p className="card-text mb-1">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer?.deliveryAddress || '')}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="text-decoration-none text-dark fw-bold"
                  >
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i> 
                    {order.customer?.deliveryAddress}
                  </a>
                </p>

                {/* Enlace a WhatsApp */}
                <p className="card-text mb-2">
                  <a 
                    href={`https://wa.me/57${order.customer?.phone}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-decoration-none text-success fw-bold"
                  >
                    <i className="bi bi-whatsapp me-1"></i> 
                    {order.customer?.phone}
                  </a>
                </p>

                {/* Detalle de Productos */}
                <div className="border-top pt-2 mt-2">
                  <small className="fw-bold text-muted d-block mb-1">Productos:</small>
                  <ul className="list-unstyled mb-0 small">
                    {order.items?.map((item, idx) => (
                      <li key={idx}>
                        <span className="fw-bold text-danger">{item.quantity}x</span> {item.title}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón 1: Salir a entregar (Si está LISTO_PARA_ENTREGA) */}
                {order.status === 'LISTO_PARA_ENTREGA' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(order.id, 'EN_PROCESO_DE_ENTREGA')}
                    className="btn btn-warning btn-lg w-100 fw-bold mt-3"
                  >
                    {isUpdating ? (
                      <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Actualizando...
                      </span>
                    ) : (
                      <span>
                        <i className="bi bi-box-seam me-2"></i>
                        Tomar y Salir a Entregar
                      </span>
                    )}
                  </button>
                )}

                {/* Botón 2: Marcar entregado (Si está EN_PROCESO_DE_ENTREGA) */}
                {order.status === 'EN_PROCESO_DE_ENTREGA' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(order.id, 'ENTREGADO')}
                    className="btn btn-success btn-lg w-100 fw-bold mt-3"
                  >
                    {isUpdating ? (
                      <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Guardando entrega...
                      </span>
                    ) : (
                      <span>
                        <i className="bi bi-check2-circle me-2"></i>
                        Marcar como Entregado
                      </span>
                    )}
                  </button>
                )}

                {/* Mensaje Informativo si ya fue entregado */}
                {order.status === 'ENTREGADO' && (
                  <div className="alert alert-success py-2 mb-0 mt-3 text-center fw-bold small">
                    <i className="bi bi-check-all fs-5 me-1 align-middle"></i>
                    Pedido completado con éxito
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
} 