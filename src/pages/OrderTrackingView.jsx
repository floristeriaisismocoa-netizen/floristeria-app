// src/pages/OrderTrackingView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export function OrderTrackingView() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(orderId || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (idToSearch) => {
    if (!idToSearch) return;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // 1. Intentar buscar por Document ID directo
      const docRef = doc(db, 'orders', idToSearch.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        // 2. Si no es un ID directo, buscar por orderNumber (ej: J-0)
        const querySnapshot = await getDocs(collection(db, 'orders'));
        let found = null;
        querySnapshot.forEach((d) => {
          const data = d.data();
          if (
            (data.orderNumber && data.orderNumber.toUpperCase() === idToSearch.trim().toUpperCase()) ||
            d.id === idToSearch.trim()
          ) {
            found = { id: d.id, ...data };
          }
        });

        if (found) {
          setOrder(found);
        } else {
          setError('No se encontró ningún pedido con esa referencia.');
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
    }
  }, [orderId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/rastreo/${searchId.trim()}`);
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

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="bg-dark text-white min-vh-100 py-5" style={{ backgroundColor: '#121212' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* BUSCADOR DE PEDIDOS */}
        <div className="card bg-black border-secondary rounded-4 p-4 shadow-lg mb-4">
          <h4 className="fw-bold text-success text-center mb-3">🔍 Rastrear Estado de tu Pedido</h4>
          <form onSubmit={handleSearch} className="d-flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              className="form-control bg-dark text-white border-secondary rounded-pill px-4"
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
            <p className="mt-2 text-muted">Consultando estado del pedido...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger bg-black border-danger text-danger text-center rounded-4 p-4 shadow">
            {error}
          </div>
        )}

        {order && (
          <div className="card bg-white text-dark rounded-4 p-4 p-md-5 shadow-lg border-0">
            
            {/* ENCABEZADO CON EL CÓDIGO DE PEDIDO VISIBLE (J-0) */}
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

            {/* LÍNEA DE TIEMPO DEL PEDIDO */}
            <div className="row g-2 text-center py-4 my-2 position-relative">
              {steps.map((st, idx) => (
                <div key={st.key} className="col">
                  <div className="d-flex flex-column align-items-center">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center mb-2 shadow ${
                        idx <= currentStep ? 'bg-danger text-white' : 'bg-light text-muted border'
                      }`}
                      style={{ width: '54px', height: '54px', fontSize: '22px' }}
                    >
                      {st.icon}
                    </div>
                    <small className={`fw-bold text-uppercase fs-7 ${idx <= currentStep ? 'text-danger' : 'text-muted'}`}>
                      {st.label}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            {/* RESUMEN DE ARTÍCULOS */}
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

      </div>
    </div>
  );
}