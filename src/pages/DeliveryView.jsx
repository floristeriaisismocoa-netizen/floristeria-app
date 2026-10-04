// src/pages/DeliveryView.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export function DeliveryView() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [loading, setLoading] = useState(true);

  // Estado para desplegar motivo de entrega fallida
  const [failedNoteId, setFailedNoteId] = useState(null);
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    const ordersRef = collection(db, 'orders');

    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        const ordersData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

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

  // Domiciliario recibe en taller y sale a reparto
  const handleStartDelivery = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'EN_CAMINO'
      });
    } catch (error) {
      console.error('Error al salir a reparto:', error);
      alert('Error al actualizar estado a En Reparto.');
    }
  };

  // Domiciliario confirma entrega exitosa
  const handleDeliverSuccess = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'ENTREGADO'
      });
    } catch (error) {
      console.error('Error al confirmar entrega exitosa:', error);
      alert('Error al marcar pedido como entregado.');
    }
  };

  // Domiciliario confirma entrega no exitosa con motivo
  const handleDeliverFailed = async (orderId) => {
    if (!reasonText.trim()) {
      alert('Por favor ingresa el motivo por el cual no se entregó el pedido.');
      return;
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'NO_ENTREGADO',
        deliveryFailureReason: reasonText.trim()
      });
      setFailedNoteId(null);
      setReasonText('');
    } catch (error) {
      console.error('Error al registrar novedad:', error);
      alert('Error al guardar el motivo de no entrega.');
    }
  };

  // Pedidos pendientes de gestión logística
  const pendingOrders = orders.filter((o) => {
    const s = o.status ? o.status.toUpperCase() : '';
    return s === 'LISTO_PARA_ENTREGA' || s === 'EN_CAMINO' || s === 'EN_REPARTO';
  });

  // Historial de finalizados
  const historyOrders = orders.filter((o) => {
    const s = o.status ? o.status.toUpperCase() : '';
    return s === 'ENTREGADO' || s === 'ENTREGADO_EXITOSO' || s === 'COMPLETADO' || s === 'NO_ENTREGADO';
  });

  const currentList = activeTab === 'pending' ? pendingOrders : historyOrders;

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
          Módulo de Entregas y Domicilios
        </h2>
      </div>

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
            En Gestión ({pendingOrders.length})
          </button>
          <button
            type="button"
            className={`btn rounded-pill px-4 fw-bold ${
              activeTab === 'history' ? 'btn-secondary shadow-sm' : 'btn-light text-muted'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-journal-check me-2"></i>
            Historial ({historyOrders.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-2 text-muted">Cargando órdenes...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm border p-4">
          <i className="bi bi-box-seam display-3 text-muted d-block mb-3"></i>
          <h5 className="fw-bold text-secondary">
            {activeTab === 'pending'
              ? 'No hay pedidos listos en taller ni en reparto actualmente.'
              : 'Aún no hay entregas registradas en el historial.'}
          </h5>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {currentList.map((order) => {
            const isReadyInTaller = order.status === 'LISTO_PARA_ENTREGA';
            const isEnCamino = order.status === 'EN_CAMINO' || order.status === 'EN_REPARTO';
            const isDelivered = order.status === 'ENTREGADO' || order.status === 'COMPLETADO';
            const isFailed = order.status === 'NO_ENTREGADO';

            return (
              <div key={order.id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark rounded-pill font-monospace fs-6 px-3">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <small className="text-muted">{formatDate(order.createdAt)}</small>
                  </div>

                  {isReadyInTaller && (
                    <span className="badge bg-warning text-dark rounded-pill px-3 py-2 fw-semibold">
                      📦 Listo en Taller
                    </span>
                  )}
                  {isEnCamino && (
                    <span className="badge bg-primary rounded-pill px-3 py-2 fw-semibold">
                      🛵 En Reparto
                    </span>
                  )}
                  {isDelivered && (
                    <span className="badge bg-success rounded-pill px-3 py-2 fw-semibold">
                      ✅ Envío Exitoso
                    </span>
                  )}
                  {isFailed && (
                    <span className="badge bg-danger rounded-pill px-3 py-2 fw-semibold">
                      ❌ Envío No Exitosa
                    </span>
                  )}
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

                  {isFailed && order.deliveryFailureReason && (
                    <div className="alert alert-danger py-2 px-3 mt-2 rounded-3 border-0">
                      <strong className="d-block mb-1">
                        <i className="bi bi-exclamation-octagon-fill me-1"></i> Motivo de no entrega:
                      </strong>
                      <p className="mb-0 small fst-italic">"{order.deliveryFailureReason}"</p>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center fw-bold pt-2 border-top mt-3">
                    <span>Total Cobrado:</span>
                    <span className="text-danger fs-5">${order.total?.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <div className="card-footer bg-light p-3 border-0">
                  {/* OPCIÓN 1: Salir a Reparto */}
                  {isReadyInTaller && (
                    <button
                      onClick={() => handleStartDelivery(order.id)}
                      className="btn btn-primary btn-lg w-100 fw-bold shadow-sm rounded-3"
                    >
                      <i className="bi bi-box-arrow-up-right me-2"></i>
                      Recibir en Taller y Salir a Reparto
                    </button>
                  )}

                  {/* OPCIÓN 2: Envío Exitoso o Envío No Exitosa */}
                  {isEnCamino && (
                    <div className="d-flex flex-column gap-2">
                      {failedNoteId === order.id ? (
                        <div className="bg-white p-3 rounded-3 border">
                          <label className="form-label fw-bold text-danger small mb-1">
                            Ingresa el motivo por el cual no se entregó:
                          </label>
                          <textarea
                            className="form-control mb-2 fs-6"
                            rows="2"
                            placeholder="Ej: Cliente no contesta, dirección incorrecta..."
                            value={reasonText}
                            onChange={(e) => setReasonText(e.target.value)}
                          ></textarea>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-danger btn-sm w-100 fw-bold"
                              onClick={() => handleDeliverFailed(order.id)}
                            >
                              Confirmar Envío No Exitoso
                            </button>
                            <button
                              className="btn btn-outline-secondary btn-sm px-3"
                              onClick={() => {
                                setFailedNoteId(null);
                                setReasonText('');
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex flex-column flex-sm-row gap-2">
                          <button
                            onClick={() => handleDeliverSuccess(order.id)}
                            className="btn btn-success btn-lg w-100 fw-bold shadow-sm rounded-3"
                          >
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Envío Exitoso
                          </button>
                          <button
                            onClick={() => setFailedNoteId(order.id)}
                            className="btn btn-outline-danger btn-lg w-100 fw-bold shadow-sm rounded-3"
                          >
                            <i className="bi bi-x-circle-fill me-2"></i>
                            Envío No Exitoso
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isDelivered && (
                    <div className="alert alert-success mb-0 py-2 text-center fw-bold rounded-3">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Pedido completado con éxito
                    </div>
                  )}

                  {isFailed && (
                    <div className="alert alert-danger mb-0 py-2 text-center fw-bold rounded-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Proceso finalizado como Envío No Exitoso
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}