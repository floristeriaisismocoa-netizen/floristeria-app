// src/pages/OrderTrackingView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function OrderTrackingView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const isAdminOrStaff = Boolean(user && (role === 'admin' || role === 'caja' || role === 'cajero'));

  const [searchId, setSearchId] = useState(orderId || '');
  const [order, setOrder] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');

  // Si es ADMIN / CAJA, suscribir a todos los pedidos en tiempo real
  useEffect(() => {
    if (!isAdminOrStaff) return;

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setAllOrders(ordersData);
    }, (err) => {
      console.error('Error al cargar todos los pedidos:', err);
    });

    return () => unsubscribe && unsubscribe();
  }, [isAdminOrStaff]);

  // Consultar un pedido específico por ID o por orderNumber (ej: J-0)
  const fetchOrder = async (idToSearch) => {
    if (!idToSearch) {
      setOrder(null);
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const cleanTerm = idToSearch.trim();
      const docRef = doc(db, 'orders', cleanTerm);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Buscar por orderNumber (ej: J-0)
        let found = allOrders.find((o) => 
          (o.orderNumber && o.orderNumber.toUpperCase() === cleanTerm.toUpperCase()) ||
          o.id === cleanTerm
        );

        if (!found) {
          // Si aún no está en memoria, hacer búsqueda directa
          const snapshot = await collection(db, 'orders');
          // Fallback simple si no está en el listado cargado
        }

        if (found) {
          setOrder(found);
        } else {
          setError(`No se encontró ningún pedido con la referencia "${cleanTerm}".`);
        }
      }
    } catch (err) {
      console.error('Error al consultar pedido:', err);
      setError('Ocurrió un error al consultar el estado del pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      setSearchId(orderId);
      fetchOrder(orderId);
    } else {
      setOrder(null);
    }
  }, [orderId, allOrders.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/rastreo/${searchId.trim()}`);
    } else {
      navigate('/rastreo');
    }
  };

  const steps = [
    { key: 'PENDIENTE_PREPARACION', label: 'Procesando Pago', icon: '💳' },
    { key: 'EN_PREPARACION', label: 'Enviado a Taller', icon: '🌺' },
    { key: 'LISTO_PARA_ENTREGA', label: 'Realizando el Detalle', icon: '✂️' },
    { key: 'EN_CAMINO', label: 'En Reparto', icon: '🚚' },
    { key: 'ENTREGADO', label: 'Entregado Exitoso', icon: '✅' }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDIENTE_PREPARACION': return 0;
      case 'EN_PREPARACION': return 1;
      case 'LISTO_PARA_ENTREGA': return 2;
      case 'EN_CAMINO': return 3;
      case 'ENTREGADO': return 4;
      default: return 0;
    }
  };

  const filteredOrdersList = allOrders.filter((o) => {
    if (filterStatus === 'TODOS') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="bg-dark text-white min-vh-100 py-5" style={{ backgroundColor: '#121212' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* BUSCADOR PRINCIPAL */}
        <div className="card bg-black border-secondary rounded-4 p-4 shadow-lg mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold text-success mb-0">🔍 Rastrear Estado de Pedido</h4>
            {orderId && (
              <button 
                className="btn btn-outline-light btn-sm rounded-pill"
                onClick={() => {
                  setSearchId('');
                  setOrder(null);
                  navigate('/rastreo');
                }}
              >
                ← Ver todos
              </button>
            )}
          </div>

          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input
              type="text"
              className="form-control bg-dark text-white border-secondary rounded-pill px-4 py-2"
              placeholder="Ingresa tu código de pedido (ej: J-0 o ID)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold">
              Buscar
            </button>
          </form>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="mt-2 text-muted">Consultando pedido...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger bg-black border-danger text-danger text-center rounded-4 p-4 shadow mb-4">
            {error}
          </div>
        )}

        {/* DETALLE DEL PEDIDO INDIVIDUAL CONSULTADO */}
        {order && (
          <div className="card bg-white text-dark rounded-4 p-4 p-md-5 shadow-lg border-0 mb-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom">
              <div>
                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-3 py-2 rounded-pill fw-bold mb-2">
                  Detalle de Pedido
                </span>
                <h3 className="fw-bold text-dark mb-0">
                  Pedido #{order.orderNumber || order.id.substring(0, 8)}
                </h3>
              </div>

              <div className="text-end mt-2 mt-md-0">
                <small className="text-muted d-block fw-bold">Estado actual:</small>
                <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold fs-6 shadow-sm">
                  {order.status === 'PENDIENTE_PREPARACION' ? '⚙️ Procesando Pago' :
                   order.status === 'EN_PREPARACION' ? '⚙️ Enviado a Taller' :
                   order.status === 'LISTO_PARA_ENTREGA' ? '✂️ Realizando el Detalle' :
                   order.status === 'EN_CAMINO' ? '🚚 En Reparto' : '✅ Entregado Exitoso'}
                </span>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="row g-2 text-center py-4 my-2 position-relative">
              {steps.map((st, idx) => (
                <div key={st.key} className="col">
                  <div className="d-flex flex-column align-items-center">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center mb-2 shadow ${
                        idx <= getStepIndex(order.status) ? 'bg-danger text-white' : 'bg-light text-muted border'
                      }`}
                      style={{ width: '54px', height: '54px', fontSize: '22px' }}
                    >
                      {st.icon}
                    </div>
                    <small className={`fw-bold text-uppercase fs-7 ${idx <= getStepIndex(order.status) ? 'text-danger' : 'text-muted'}`}>
                      {st.label}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            {/* RESUMEN PRODUCTOS */}
            <div className="bg-light p-4 rounded-4 mt-4 border">
              <h5 className="fw-bold text-dark mb-3">Resumen del Pedido:</h5>
              <div className="d-flex flex-column gap-3">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center justify-content-between bg-white p-3 rounded-3 border">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={item.image || 'https://via.placeholder.com/60'}
                        alt={item.name || item.title}
                        className="rounded-3"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                      <div>
                        <h6 className="fw-bold text-dark mb-1">{item.name || item.title}</h6>
                        <small className="text-muted">Cantidad: {item.quantity}</small>
                      </div>
                    </div>
                    <span className="fw-bold text-dark fs-6">
                      ${(Number(item.price) * Number(item.quantity)).toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-4">
                <span className="fs-5 fw-bold text-dark">Total Pagado:</span>
                <span className="fs-4 fw-bold text-success">${Number(order.total || 0).toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        )}

        {/* MÓDULO EXCLUSIVO PARA ADMIN/STAFF: VISTA DE TODOS LOS PEDIDOS */}
        {isAdminOrStaff && (
          <div className="card bg-black border-secondary rounded-4 p-4 shadow-lg">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary gap-2">
              <h4 className="fw-bold text-warning mb-0">
                📋 Gestión General de Pedidos ({filteredOrdersList.length})
              </h4>

              <div className="d-flex gap-2">
                {['TODOS', 'PENDIENTE_PREPARACION', 'EN_PREPARACION', 'EN_CAMINO', 'ENTREGADO'].map((st) => (
                  <button
                    key={st}
                    className={`btn btn-sm ${filterStatus === st ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-white'} rounded-pill px-3`}
                    onClick={() => setFilterStatus(st)}
                  >
                    {st === 'TODOS' ? 'Todos' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrdersList.length === 0 ? (
              <p className="text-muted text-center py-4">No hay pedidos registrados en este estado.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente / Destinatario</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdersList.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className="badge bg-success fw-bold fs-6">
                            {o.orderNumber || o.id.substring(0, 8)}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-white">{o.customerName || (o.sender && o.sender.name) || 'Cliente'}</div>
                          <small className="text-muted">{o.customerPhone || (o.sender && o.sender.phone)}</small>
                        </td>
                        <td>
                          <small className="text-light">
                            {o.items ? `${o.items.length} producto(s)` : 'N/A'}
                          </small>
                        </td>
                        <td className="fw-bold text-success">
                          ${Number(o.total || 0).toLocaleString('es-CO')}
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark fw-semibold">
                            {o.status || 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="text-end">
                          <Link
                            to={`/rastreo/${o.id}`}
                            className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold"
                          >
                            👁️ Ver Detalle
                          </Link>
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
    </div>
  );
}