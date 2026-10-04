// src/pages/KitchenView.jsx
import React, { useEffect, useState, useRef } from 'react';
import { subscribeToOrders, updateOrderStatus } from '../services/ordersService';

// Función para convertir números en palabras en español para la voz
const numberToWords = (num) => {
  const words = ['UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ'];
  return num >= 1 && num <= 10 ? words[num - 1] : String(num);
};

// Generar el texto dinámico personalizado para el lector de voz
const buildOrderSpeechText = (order) => {
  if (!order || !order.items || order.items.length === 0) {
    return 'NUEVO PEDIDO PARA ELABORAR';
  }

  const itemsFormatted = order.items.map((item) => {
    const qtyWord = numberToWords(item.quantity || 1);
    const name = (item.title || item.name || 'PRODUCTO').toUpperCase();
    return `${qtyWord} ${name}`;
  });

  let itemsText = '';
  if (itemsFormatted.length === 1) {
    itemsText = itemsFormatted[0];
  } else if (itemsFormatted.length === 2) {
    itemsText = itemsFormatted.join(' Y ');
  } else {
    itemsText = itemsFormatted.slice(0, -1).join(', ') + ' Y ' + itemsFormatted[itemsFormatted.length - 1];
  }

  return `NUEVO PEDIDO PARA ELABORAR ${itemsText}`;
};

export function KitchenView() {
  const [orders, setOrders] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // Estado para imagen en pantalla grande
  const previousOrdersRef = useRef([]);

  // Función de síntesis de voz dinámico
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
      const activeOrders = data.filter(
        (o) => o.status === 'PENDIENTE_PREPARACION' || o.status === 'EN_PREPARACION'
      );

      const currentPendingOrders = activeOrders.filter(
        (o) => o.status === 'PENDIENTE_PREPARACION'
      );

      const prevIds = previousOrdersRef.current.map((o) => o.id);
      const newOrders = currentPendingOrders.filter((o) => !prevIds.includes(o.id));

      if (previousOrdersRef.current.length > 0 && newOrders.length > 0 && audioEnabled) {
        const latestOrder = newOrders[0];
        const speechMessage = buildOrderSpeechText(latestOrder);
        speakText(speechMessage);
      }

      previousOrdersRef.current = currentPendingOrders;
      setOrders(activeOrders);
    });

    return () => unsubscribe();
  }, [audioEnabled]);

  // Paso 1: Taller inicia la preparación
  const handleStartPreparation = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'EN_PREPARACION');
    } catch (error) {
      console.error('Error al iniciar elaboración:', error);
    }
  };

  // Paso 2: Taller termina el detalle y notifica a Domicilios
  const handleFinishPreparation = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'LISTO_PARA_ENTREGA');
    } catch (error) {
      console.error('Error al completar pedido en taller:', error);
    }
  };

  // Paso Alternativo: Retiro en Taller / Tienda física
  const handlePickupInStore = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'ENTREGADO');
    } catch (error) {
      console.error('Error al marcar retiro en tienda:', error);
    }
  };

  const formatOrderTime = (createdAt) => {
    if (!createdAt) return 'Reciente';
    try {
      if (typeof createdAt.toDate === 'function') {
        return createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Reciente';
    }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      {/* Encabezado con Control de Audio */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4 pb-2 border-bottom container">
        <h2 className="fw-bold mb-2 mb-sm-0 text-dark">
          <i className="bi bi-flower1 text-danger me-2"></i>
          Taller de Arreglos - Pedidos Activos ({orders.length})
        </h2>

        <div className="d-flex align-items-center gap-2 bg-white p-2 px-3 rounded-pill shadow-sm border">
          <button
            className={`btn btn-sm rounded-circle ${audioEnabled ? 'btn-danger' : 'btn-outline-secondary'}`}
            style={{ width: '36px', height: '36px' }}
            onClick={() => {
              const newState = !audioEnabled;
              setAudioEnabled(newState);
              if (newState) {
                speakText('ALERTA DE VOZ ACTIVADA EN TALLER');
              }
            }}
            title={audioEnabled ? 'Desactivar voz de alerta' : 'Activar voz de alerta'}
          >
            <i className={`bi ${audioEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}`}></i>
          </button>
          <span className="small fw-bold text-secondary">
            {audioEnabled ? 'Voz inteligente activa' : 'Voz silenciada'}
          </span>
        </div>
      </div>

      <div className="container">
        <div className="row g-3">
          {orders.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-check-all display-1 text-success d-block mb-3"></i>
              <h4>No hay pedidos pendientes por elaborar en el taller</h4>
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
                            <div className="d-flex align-items-center gap-2">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title || item.name}
                                  className="rounded border"
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', cursor: 'pointer' }}
                                  onClick={() => setSelectedImage({ url: item.image, title: item.title || item.name })}
                                  title="Haz clic para ver imagen en pantalla grande"
                                />
                              )}
                              <div>
                                <span className="fw-bold d-block text-dark">
                                  <strong className="text-danger me-1">{item.quantity}x</strong>
                                  {item.title || item.name}
                                </span>
                              </div>
                            </div>

                            {item.image && (
                              <button
                                className="btn btn-sm btn-outline-secondary rounded-circle"
                                onClick={() => setSelectedImage({ url: item.image, title: item.title || item.name })}
                                title="Ver imagen ampliada"
                              >
                                <i className="bi bi-zoom-in"></i>
                              </button>
                            )}
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
                        <button 
                          onClick={() => handleStartPreparation(order.id)}
                          className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                        >
                          <i className="bi bi-hand-thumbs-up-fill me-2"></i>
                          Dar Recibido y Elaborar
                        </button>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          <button 
                            onClick={() => handleFinishPreparation(order.id)}
                            className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
                          >
                            <i className="bi bi-truck me-2"></i>
                            Listo para Domicilio
                          </button>
                          <button 
                            onClick={() => handlePickupInStore(order.id)}
                            className="btn btn-outline-dark btn-md w-100 fw-bold"
                          >
                            <i className="bi bi-shop me-2"></i>
                            Retirado en Tienda / Taller
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL PARA VER LA IMAGEN EN PANTALLA GRANDE */}
      {selectedImage && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1060 }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg bg-dark text-white rounded-4 overflow-hidden">
              <div className="modal-header border-secondary d-flex justify-content-between align-items-center p-3">
                <h5 className="modal-title fw-bold text-white">
                  <i className="bi bi-image me-2 text-danger"></i>
                  {selectedImage.title}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedImage(null)}
                ></button>
              </div>
              <div className="modal-body text-center p-2 bg-black">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="img-fluid rounded"
                  style={{ maxHeight: '75vh', objectFit: 'contain', width: '100%' }}
                />
              </div>
              <div className="modal-footer border-secondary justify-content-between">
                <span className="small text-muted">Vista del modelo para guía de confección</span>
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm rounded-pill px-4"
                  onClick={() => setSelectedImage(null)}
                >
                  Cerrar Vista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}