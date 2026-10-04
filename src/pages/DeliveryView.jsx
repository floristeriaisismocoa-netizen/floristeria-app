// src/pages/DeliveryView.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export function DeliveryView() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'delivered'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');

    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        const ordersData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Ordenar por fecha descendente
        ordersData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error al escuchar pedidos en Domicilios:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Marcar pedido como entregado con éxito
  const handleDeliverOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'ENTREGADO' // 👈 Pasa la orden al último paso del tracker
      });
    } catch (error) {
      console.error('Error al marcar pedido como entregado:', error);
      alert('Ocurrió un error al actualizar el pedido.');
    }
  };

  // Filtrar pedidos por entregados vs pendientes de reparto
  const pendingOrders = orders.filter((o) => {
    const s = o.status ? o.status.toUpperCase() : '';
    return s === 'EN_CAMINO' || s === 'LISTO_PARA_ENTREGA' || s === 'EN_REPARTO';
  });

  const deliveredOrders = orders.filter((o) => {
    const s = o.status ? o.status.toUpperCase() : '';
    return s === 'ENTREGADO' || s === 'ENTREGADO_EXITOSO' || s === 'COMPLETADO';
  });

  const currentList = activeTab === 'pending' ? pendingOrders : deliveredOrders;

  const formatDate = (createdAt) => {
    if (!createdAt) return 'Reciente';
    try {
      if (typeof createdAt.toDate === 'function') {
        return createdAt.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      }
      return new Date(createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    } catch (e) {
      return 'Reciente';
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <div className="text-center mb-4">
        <h2 className="fw-bold text-dark">
          <i className="bi bi-truck text-danger me-2"></i>
          Módulo de Entregas
        </h2>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group bg-light p-1 rounded-pill shadow-sm" role="group">
          <button
            type="button"
            className={`btn rounded-pill px-4 fw-bold ${
              activeTab === 'pending' ? 'btn-primary shadow-sm' : 'btn-light text-muted'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="bi bi-clock-history me-2"></i>
            Por Entregar ({pendingOrders.length})
          </button>
          <button
            type="button"
            className={`btn rounded-pill px-4 fw-bold ${
              activeTab === 'delivered' ? 'btn-success shadow-sm' : 'btn-light text-muted'
            }`}
            onClick={() => setActiveTab('delivered')}
          >
            <i className="bi bi-check-circle-fill me-2"></i>
            Historial Entregados ({deliveredOrders.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-2 text-muted">Cargando lista de entregas...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm border p-4">
          <i className="bi bi-box-seam display-3 text-muted d-block mb-3"></i>
          <h5 className="fw-bold text-secondary">
            {activeTab === 'pending'
              ? 'No hay pedidos listos para entregar en este momento.'
              : 'Aún no hay pedidos marcados como entregados.'}
          </h5>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {currentList.map((order) => (
            <div key={order.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary rounded-pill font-monospace fs-6 px-3">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                  <small className="text-muted">{formatDate(order.createdAt)}</small>
                </div>
                <span className={`badge ${activeTab === 'pending' ? 'bg-warning text-dark' : 'bg-success'} rounded-pill px-3 py-2`}>
                  {activeTab === 'pending' ? 'En Reparto' : 'Entregado'}
                </span>
              </div>

              <div className="card-body p-4">
                <h6 className="fw-bold text-secondary mb-3">Productos del Pedido:</h6>
                <ul className="list-group list-group-flush mb-3">
                  {order.items?.map((item, idx) => (
                    <li key={idx} className="list-group-item px-0 d-flex align-items-center gap-3 border-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title || item.name}
                          className="rounded"
                          style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <span className="fw-bold d-block text-dark">
                          <span className="text-danger me-2">{item.quantity}x</span>
                          {item.title || item.name}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="d-flex justify-content-between align-items-center fw-bold pt-2 border-top">
                  <span>Total Cobrado:</span>
                  <span className="text-danger fs-5">${order.total?.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="card-footer bg-light p-3 border-0">
                {activeTab === 'pending' ? (
                  <button
                    onClick={() => handleDeliverOrder(order.id)}
                    className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
                  >
                    <i className="bi bi-check-lg me-2"></i>
                    Marcar como Entregado Exitoso
                  </button>
                ) : (
                  <div className="alert alert-success mb-0 py-2 text-center fw-bold">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Pedido completado con éxito
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}