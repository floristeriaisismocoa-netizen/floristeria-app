// src/pages/OrderTrackingView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// Etapas del flujo de trabajo
const STEPS = [
  { key: 'PROCESANDO_PAGO', label: 'Procesando Pago', icon: 'bi-credit-card' },
  { key: 'PENDIENTE_PREPARACION', label: 'Enviado a Taller', icon: 'bi-flower1' },
  { key: 'EN_PREPARACION', label: 'Realizando el Detalle', icon: 'bi-scissors' },
  { key: 'EN_CAMINO', label: 'En Reparto', icon: 'bi-truck' },
  { key: 'ENTREGADO', label: 'Entregado Exitoso', icon: 'bi-check-circle-fill' }
];

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

const getStatusBadge = (status) => {
  const idx = mapStatusToIndex(status);
  const step = STEPS[idx];
  const colors = [
    'bg-secondary text-white',
    'bg-warning text-dark',
    'bg-info text-dark',
    'bg-primary text-white',
    'bg-success text-white'
  ];
  return (
    <span className={`badge ${colors[idx]} rounded-pill px-3 py-2 fw-semibold`}>
      <i className={`bi ${step.icon} me-1`}></i>
      {step.label}
    </span>
  );
};

export function OrderTrackingView() {
  const { user, role } = useAuth();
  const isAdmin = user && (role === 'admin' || role === 'florist' || role === 'taller' || role === 'delivery');
  
  const { orderId: urlOrderId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(urlOrderId || '');
  const [currentOrderId, setCurrentOrderId] = useState(urlOrderId || '');
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Estado para el panel global de Administrador
  const [allOrders, setAllOrders] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState('TODOS');

  // 1. Cargar lista completa de pedidos en tiempo real si es Admin
  useEffect(() => {
    if (!isAdmin) return;

    setLoadingAll(true);
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setAllOrders(ordersData);
        setLoadingAll(false);
      },
      (err) => {
        console.error('Error al cargar lista global de pedidos:', err);
        setLoadingAll(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // 2. Escuchar un pedido específico en tiempo real
  useEffect(() => {
    if (!currentOrderId) {
      setOrder(null);
      return;
    }

    setLoadingOrder(true);
    setOrderError('');

    const docRef = doc(db, 'orders', currentOrderId.trim());
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
          setOrderError('');
        } else {
          setOrder(null);
          setOrderError('No se encontró ningún pedido con ese código ID.');
        }
        setLoadingOrder(false);
      },
      (err) => {
        console.error('Error al rastrear el pedido:', err);
        setOrderError('Error al consultar el pedido.');
        setLoadingOrder(false);
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

  const selectOrderFromList = (orderId) => {
    setSearchId(orderId);
    setCurrentOrderId(orderId);
    navigate(`/rastreo/${orderId}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredOrders = statusFilter === 'TODOS'
    ? allOrders
    : allOrders.filter((o) => mapStatusToIndex(o.status) === Number(statusFilter));

  const currentStepIndex = order ? mapStatusToIndex(order.status) : 0;

  return (
    <div className="container py-4" style={{ maxWidth: '1000px' }}>
      {/* ENCABEZADO */}
      <div className="text-center mb-4">
        <h2 className="fw-bold text-dark">
          <i className="bi bi-geo-alt-fill text-danger me-2"></i>
          {isAdmin ? 'Panel General de Pedidos y Rastreo' : 'Rastrea tu Pedido en Tiempo Real'}
        </h2>
        <p className="text-muted">
          {isAdmin
            ? 'Visualiza el estado de todas las órdenes del sistema ordenadas cronológicamente.'
            : 'Ingresa el código de tu orden para ver el estado de tu arreglo floral'}
        </p>
      </div>

      {/* BUSCADOR DE ORDEN */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <form onSubmit={handleSearch} className="d-flex gap-2">
          <input
            type="text"
            className="form-control form-control-lg rounded-pill px-4 fs-6"
            placeholder="Ej: Qaq3Zs2sSf7lYetn8s3R o ID de orden..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button type="submit" className="btn btn-danger btn-lg rounded-pill px-4 fw-bold fs-6 text-nowrap">
            <i className="bi bi-search me-1"></i> Rastrear
          </button>
        </form>
      </div>

      {/* ESTADO DE DETALLE DE LA ORDEN SELECCIONADA */}
      {loadingOrder && (
        <div className="text-center py-4">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="mt-2 text-muted">Cargando información del pedido...</p>
        </div>
      )}

      {orderError && !loadingOrder && (
        <div className="alert alert-warning text-center rounded-3 shadow-sm border-0 py-3 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-4 text-warning d-block mb-1"></i>
          {orderError}
        </div>
      )}

      {order && !loadingOrder && (
        <div className="bg-white rounded-4 shadow-sm p-4 border mb-5">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2">
            <div>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle mb-1">
                Detalle de Pedido
              </span>
              <h4 className="fw-bold mb-0">Pedido #{order.id}</h4>
            </div>
            <div className="text-end">
              <small className="text-muted d-block mb-1">Estado actual:</small>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* LÍNEA DE TIEMPO / TIMELINE */}
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

          {/* RESUMEN DE PRODUCTOS */}
          <div className="bg-light rounded-3 p-3 mt-4">
            <h6 className="fw-bold mb-3 text-secondary">Resumen del Pedido:</h6>
            <div className="d-flex flex-column gap-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center bg-white p-2 rounded border">
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
              <span>Total Orden:</span>
              <span className="text-danger fs-5">${order.total?.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN ADMINISTRADOR: LISTADO COMPLETO DE PEDIDOS */}
      {isAdmin && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mt-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <h5 className="fw-bold mb-0 text-dark">
              <i className="bi bi-list-stars text-danger me-2"></i>
              Historial General de Pedidos ({allOrders.length})
            </h5>

            {/* FILTRO POR ESTADO */}
            <div className="d-flex gap-1 overflow-auto py-1">
              <button
                className={`btn btn-sm ${statusFilter === 'TODOS' ? 'btn-danger fw-bold' : 'btn-outline-secondary'} rounded-pill px-3`}
                onClick={() => setStatusFilter('TODOS')}
              >
                Todos
              </button>
              {STEPS.map((step, idx) => (
                <button
                  key={step.key}
                  className={`btn btn-sm ${statusFilter === String(idx) ? 'btn-danger fw-bold' : 'btn-outline-secondary'} rounded-pill px-3 text-nowrap`}
                  onClick={() => setStatusFilter(String(idx))}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          {loadingAll ? (
            <div className="text-center py-4">
              <div className="spinner-border text-danger spinner-border-sm me-2"></div>
              <span className="text-muted">Cargando lista de pedidos...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-4 bg-light rounded-3">
              <p className="text-muted mb-0">No se encontraron pedidos registrados en este estado.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID Pedido</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className={currentOrderId === ord.id ? 'table-active' : ''}>
                      <td>
                        <span className="fw-bold font-monospace text-dark">
                          #{ord.id}
                        </span>
                      </td>
                      <td>
                        <small className="d-block text-truncate" style={{ maxWidth: '250px' }}>
                          {ord.items?.map((it) => `${it.quantity}x ${it.title || it.name}`).join(', ')}
                        </small>
                      </td>
                      <td className="fw-bold text-danger">
                        ${ord.total?.toLocaleString('es-CO')}
                      </td>
                      <td>{getStatusBadge(ord.status)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold"
                          onClick={() => selectOrderFromList(ord.id)}
                        >
                          Ver Rastreo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}