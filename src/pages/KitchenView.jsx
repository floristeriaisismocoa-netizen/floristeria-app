// src/pages/KitchenView.jsx
import React, { useEffect, useState } from 'react';
import { subscribeToOrders, updateOrderStatus } from '../services/ordersService';

export function KitchenView() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
      // Filtrar pedidos que están en espera de preparación o en elaboración en el taller
      const activeOrders = data.filter(
        (o) => o.status === 'PENDIENTE_PREPARACION' || o.status === 'EN_PREPARACION'
      );
      setOrders(activeOrders);
    });
    return () => unsubscribe();
  }, []);

  // Marcar como Recibido / Iniciado (Pasa a: Realizando el Detalle)
  const handleStartPreparation = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'EN_PREPARACION');
    } catch (error) {
      console.error('Error al iniciar elaboración del pedido:', error);
    }
  };

  // Marcar como Terminado (Pasa a: En Reparto / Domicilios)
  const handleFinishPreparation = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'EN_CAMINO');
    } catch (error) {
      console.error('Error al completar el pedido:', error);
    }
  };

  const formatOrderTime = (createdAt) => {
    if (!createdAt) return 'Reciente';
    try {
      if (typeof createdAt.toDate === 'function') {
        return createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const dateObj = new Date(createdAt);
      return isNaN(dateObj.getTime()) 
        ? 'Reciente' 
        : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Reciente';
    }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <h2 className="mb-4 text-center fw-bold">
        <i className="bi bi-flower1 text-danger me-2"></i>
        Taller de Arreglos - Pedidos Activos ({orders.length})
      </h2>

      <div className="row g-3">
        {orders.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            <i className="bi bi-check-all display-1 text-success d-block mb-3"></i>
            <h4>No hay pedidos pendientes por elaborar</h4>
          </div>
        ) : (
          orders.map((order) => {
            const isPreparing = order.status === 'EN_PREPARACION';

            return (
              <div key={order.id} className="col-12 col-md-6 col-lg-4">
                <div className={`card h-100 shadow-sm ${isPreparing ? 'border-info' : 'border-warning'}`}>
                  <div className={`card-header fw-bold d-flex justify-content-between align-items-center ${isPreparing ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                    <span>Pedido #{order.id.slice(-5).toUpperCase()}</span>
                    <small className="badge bg-dark text-white">
                      {formatOrderTime(order.createdAt)}
                    </small>
                  </div>

                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Productos a preparar:</h6>
                      <span className={`badge ${isPreparing ? 'bg-info text-dark' : 'bg-secondary'}`}>
                        {isPreparing ? '✂️ Realizando el Detalle' : '⏳ Pendiente Recibir'}
                      </span>
                    </div>

                    <ul className="list-group list-group-flush mb-3">
                      {order.items?.map((item, idx) => (
                        <li key={idx} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                          <span>
                            <strong className="text-danger me-2">{item.quantity}x</strong>
                            {item.title || item.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {order.customNote && (
                      <div className="alert alert-info py-2 fs-7 mb-0">
                        <strong><i className="bi bi-card-text me-1"></i>Nota / Mensaje:</strong>
                        <p className="mb-0 fst-italic">"{order.customNote}"</p>
                      </div>
                    )}
                  </div>

                  <div className="card-footer bg-white border-0 p-3 d-flex flex-column gap-2">
                    {!isPreparing ? (
                      /* PASO 1: Recibir pedido e iniciar detalle */
                      <button 
                        onClick={() => handleStartPreparation(order.id)}
                        className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                      >
                        <i className="bi bi-hand-thumbs-up-fill me-2"></i>
                        Dar Recibido y Elaborar
                      </button>
                    ) : (
                      /* PASO 2: Arreglo terminado, listo para envío */
                      <button 
                        onClick={() => handleFinishPreparation(order.id)}
                        className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
                      >
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Pedido Listo para Entregar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}