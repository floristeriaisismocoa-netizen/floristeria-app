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
  const previousOrdersRef = useRef([]);

  // Función de síntesis de voz dinámico (Text-to-Speech)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Cancelar locuciones previas retenidas

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95; // Velocidad de lectura óptima
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

      // Identificar si hay órdenes totalmente nuevas en el flujo
      const prevIds = previousOrdersRef.current.map((o) => o.id);
      const newOrders = currentPendingOrders.filter((o) => !prevIds.includes(o.id));

      if (previousOrdersRef.current.length > 0 && newOrders.length > 0 && audioEnabled) {
        // Generar locución para el último pedido entrante
        const latestOrder = newOrders[0];
        const speechMessage = buildOrderSpeechText(latestOrder);
        speakText(speechMessage);
      }

      previousOrdersRef.current = currentPendingOrders;
      setOrders(activeOrders);
    });

    return () => unsubscribe();
  }, [audioEnabled]);

  const handleStartPreparation = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'EN_PREPARACION');
    } catch (error) {
      console.error('Error al iniciar elaboración:', error);
    }
  };

  const handleFinishPreparation = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'LISTO_PARA_ENTREGA');
    } catch (error) {
      console.error('Error al completar pedido en taller:', error);
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
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mb-4 pb-2 border-bottom container">
        <h2 className="fw-bold mb-2 mb-sm-0 text-dark">
          <i className="bi bi-flower1 text-danger me-2"></i>
          Taller de Arreglos - Pedidos Activos ({orders.length})
        </h2>

        {/* Control interactivo del Altavoz */}
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
                        <button 
                          onClick={() => handleStartPreparation(order.id)}
                          className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                        >
                          <i className="bi bi-hand-thumbs-up-fill me-2"></i>
                          Dar Recibido y Elaborar
                        </button>
                      ) : (
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
    </div>
  );
}