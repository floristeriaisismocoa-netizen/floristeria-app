import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex justify-content-center align-items-center py-5">
      <div className="card shadow-lg border-0 rounded-4 p-4 p-sm-5" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="text-center mb-4">
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
            <i className="bi bi-flower1 fs-1"></i>
          </div>
          <h3 className="fw-bold text-dark mb-1">Acceso Floristería</h3>
          <p className="text-muted small">Ingresa tus credenciales para acceder al taller o entregas</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show small text-center" role="alert">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary small fw-semibold">Correo Electrónico</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control bg-light border-start-0"
                placeholder="ejemplo@floristeria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-secondary small fw-semibold">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type="password"
                className="form-control bg-light border-start-0"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-danger w-100 py-2.5 rounded-3 fw-bold text-white shadow-sm"
            style={{ backgroundColor: '#e63946', borderColor: '#e63946' }}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}