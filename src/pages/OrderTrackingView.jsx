// src/pages/OrderTrackingView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Definición de etapas del flujo
const STEPS = [
  { key: 'PROCESANDO_PAGO', label: 'Procesando Pago', icon: 'bi-credit-card' },
  { key: 'PENDIENTE_PREPARACION', label: 'Enviado a Taller', icon: 'bi-flower1' },
  { key: 'EN_PREPARACION', label: 'Realizando el Detalle', icon: 'bi-scissors' },
  { key: 'EN_CAMINO', label: 'En Reparto', icon: 'bi-truck' },
  { key: 'ENTREGADO', label: 'Entregado Exitoso', icon: 'bi-check-circle-fill' }
];

// Mapeo flexible por si tus componentes usan minúsculas o variantes
const mapStatusToIndex = (status) => {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (s === 'PROCESANDO_PAGO' || s === 'PAGO_PENDIENTE') return 0;
  if (s === 'PENDIENTE_PREPARACION' || s === 'EN_TALLER' || s === 'RECIBIDO') return 1;
  if (s === 'EN_PREPARACION' || s === 'PREPARANDO') return 2;
  if (s === 'EN_CAMINO' || s === 'LISTO_PARA_ENTREGA' || s === 'EN_REPARTO') return 3;
  if (s === 'ENTREGADO' || s === 'ENTREGADO_EXITOSO' || s === 'COMPLETADO') return 4;
  return 1;
};

export function OrderTrackingView() {
  const { orderId: urlOrderId } = useParams();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState(urlOrderId || '');
  const [currentOrderId, setCurrentOrderId] = useState(urlOrderId || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Escuchar el pedido en tiempo real cuando cambia el ID
  useEffect(() => {
    if (!currentOrderId) {
      setOrder(null);
      return;
    }

    setLoading(true);
    setError('');

    // Escuchador en tiempo real
    const docRef = doc(db, 'orders', currentOrderId.trim());
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
          setError('');
        } else {
          setOrder(null);
          setError('No se encontró ningún pedido con ese código.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error al rastrear pedido:', err);
        setError('Ocurrió un error al consultar el pedido.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentOrderId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    const cleanId = searchId.trim();
    setCurrentOrderId(cleanId);
    navigate(`/rastreo/${cleanId}`, { replace: true });
  };

  const currentStepIndex = order ? mapStatusToIndex(order.status) : 0;

  return (
    <div className="container py-5" style={{ maxWidth: '850px' }}>
      {/* Encabezado */}
      <div className="text-center mb-4">
        <h2 className="fw-bold text-dark">
          <i className="bi bi-geo-alt-fill text-danger me-2"></i>
          Rastrea tu Pedido en Tiempo Real
        </h2>
        <p className="text-muted">Ingresa el código de tu orden para ver el estado de tu arreglo floral</p>
      </div>

      {/* Formulario de Búsqueda */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <form onSubmit={handleSearch} className="d-flex gap-2">
          <input
            type="text"
            className="form-control form-control-lg rounded-pill px-4 fs-6"
            placeholder="Ej: 6RYVP o ID completo de tu orden..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button type="submit" className="btn btn-danger btn-lg rounded-pill px-4 fw-bold fs-6">
            Rastrear
          </button>
        </form>
      </div>

      {/* Estado Carga */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-2 text-muted">Consultando estado en tiempo real...</p>
        </div>
      )}

      {/* Error / No Encontrado */}
      {error && !loading && (
        <div className="alert alert-warning text-center rounded-3 shadow-sm border-0 py-4">
          <i className="bi bi-exclamation-triangle-fill fs-3 text-warning d-block mb-2"></i>
          {error}
        </div>
      )}

      {/* Detalle del Pedido y Progreso */}
      {order && !loading && (
        <div className="bg-white rounded-4 shadow-sm p-4 border">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle mb-1">
                Orden Registrada
              </span>
              <h4 className="fw-bold mb-0">Pedido #{order.id.slice(-6).toUpperCase()}</h4>
            </div>
            <div className="text-end">
              <small className="text-muted d-block">Estado actual:</small>
              <span className="fw-bold text-success fs-5">
                {STEPS[currentStepIndex]?.label || order.status}
              </span>
            </div>
          </div>

          {/* Línea de Tiempo / Progress Tracker */}
          <div className="py-4 position-relative px-2">
            <div className="row g-2 text-center position-relative" style={{ zIndex: 1 }}>
              {STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.key} className="col">
                    <div
                      className={`rounded-circle mx-auto d-flex align-items-center justify-content-center shadow-sm mb-2 ${
                        isCompleted
                          ? 'bg-danger text-white'
                          : 'bg-light text-muted border'
                      }`}
                      style={{
                        width: '48px',
                        height: '48px',
                        fontSize: '1.2rem',
                        transition: 'all 0.3s ease',
                        transform: isCurrent ? 'scale(1.15)' : 'scale(1)'
                      }}
                    >
                      <i className={`bi ${step.icon}`}></i>
                    </div>
                    <small
                      className={`d-block lh-sm ${
                        isCurrent
                          ? 'fw-bold text-danger'
                          : isCompleted
                          ? 'fw-semibold text-dark'
                          : 'text-muted'
                      }`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {step.label}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen de Productos */}
          <div className="bg-light rounded-3 p-3 mt-4">
            <h6 className="fw-bold mb-3 text-secondary">Resumen del Pedido:</h6>
            <div className="d-flex flex-column gap-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center bg-white p-2 rounded border-sm">
                  <div className="d-flex align-items-center gap-2">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title || item.name}
                        className="rounded"
                        style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <p className="mb-0 fw-bold small">{item.title || item.name}</p>
                      <small className="text-muted">Cantidad: {item.quantity}</small>
                    </div>
                  </div>
                  <span className="fw-bold text-dark small">
                    ${((item.price || 0) * item.quantity).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between align-items-center fw-bold mt-3 pt-2 border-top">
              <span>Total Pagado:</span>
              <span className="text-danger fs-5">${order.total?.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}