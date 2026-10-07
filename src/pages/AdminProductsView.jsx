// src/pages/AdminProductsView.jsx
import React, { useState, useEffect } from 'react';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '../services/productsService';

export function AdminProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Formulario
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('RAMOS');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');

  // Manejo de Imágenes
  const [existingImages, setExistingImages] = useState([]); // URLs ya guardadas en BD
  const [newImageFiles, setNewImageFiles] = useState([]);   // Archivos locales (File)
  const [newImagePreviews, setNewImagePreviews] = useState([]); // Blob URLs para previsualizar

  const categories = [
    'RAMOS',
    'CHOCOLATES',
    'GLOBOS',
    'CORONAS',
    'PELUCHES',
    'ESPECIALES'
  ];

  const fetchProductsList = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, []);

  // Agregar nuevos archivos seleccionados (acumulando con los anteriores)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalAllowed = 10 - (existingImages.length + newImageFiles.length);
    if (totalAllowed <= 0) {
      alert('Ya alcanzaste el máximo de 10 imágenes por producto.');
      return;
    }

    const selectedFiles = files.slice(0, totalAllowed);

    // Generar previews
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));

    setNewImageFiles((prev) => [...prev, ...selectedFiles]);
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);

    // Limpiar input para permitir seleccionar el mismo archivo si se requiere
    e.target.value = '';
  };

  // Quitar una imagen de la lista local
  const removeNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Quitar una imagen guardada previamente en BD
  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (prod) => {
    setEditingId(prod.id);
    setTitle(prod.title || prod.name || '');
    setSku(prod.sku || prod.code || '');
    setPrice(prod.price || '');
    setCategory((prod.category || 'RAMOS').toUpperCase());
    setSubCategory(prod.subCategory || '');
    setDescription(prod.description || '');

    const imgs = prod.images && prod.images.length > 0 
      ? prod.images 
      : (prod.image ? [prod.image] : []);

    setExistingImages(imgs);
    setNewImageFiles([]);
    setNewImagePreviews([]);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setSku('');
    setPrice('');
    setCategory('RAMOS');
    setSubCategory('');
    setDescription('');
    setExistingImages([]);
    setNewImageFiles([]);
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewImagePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      alert('Por favor completa el título y el precio.');
      return;
    }

    if (existingImages.length === 0 && newImageFiles.length === 0) {
      alert('Debes adjuntar al menos 1 imagen para el producto.');
      return;
    }

    setSubmitting(true);
    try {
      const productPayload = {
        title: title.trim(),
        name: title.trim(),
        sku: sku.trim(),
        price: Number(price) || 0,
        category: category.toUpperCase(),
        subCategory: subCategory.trim(),
        description: description.trim(),
        existingImages // URLs a conservar
      };

      if (editingId) {
        await updateProduct(editingId, productPayload, newImageFiles);
        alert('✅ Producto actualizado correctamente.');
      } else {
        await addProduct(productPayload, newImageFiles);
        alert('✅ Producto guardado correctamente.');
      }

      handleResetForm();
      fetchProductsList();
    } catch (err) {
      console.error('Error guardando producto:', err);
      alert('Ocurrió un error al guardar el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      fetchProductsList();
    } catch (err) {
      console.error('Error eliminando producto:', err);
      alert('No se pudo eliminar el producto.');
    }
  };

  return (
    <div className="bg-dark text-white min-vh-100 py-4" style={{ backgroundColor: '#121212' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* FORMULARIO DE GESTIÓN */}
        <div className="card bg-white text-dark rounded-4 p-4 p-md-5 shadow-lg border-0 mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <h3 className="fw-bold text-dark mb-0">
              {editingId ? '✏️ Editar Producto' : '📦 Agregar Nuevo Producto'}
            </h3>
            {editingId && (
              <button className="btn btn-outline-secondary rounded-pill btn-sm fw-bold" onClick={handleResetForm}>
                ✕ Cancelar Edición
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  className="form-control py-3 rounded-3 border-light-subtle"
                  placeholder="Ej: Ramo de Rosas Eternas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Referencia / SKU</label>
                <input
                  type="text"
                  className="form-control py-3 rounded-3 border-light-subtle"
                  placeholder="Ej: R-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Categoría Principal *</label>
                <select
                  className="form-select py-3 rounded-3 border-light-subtle fw-bold"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Subcategoría</label>
                <input
                  type="text"
                  className="form-control py-3 rounded-3 border-light-subtle"
                  placeholder="Ej: Rosas, Tulipanes, Cajas"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Precio ($ COP) *</label>
                <input
                  type="number"
                  className="form-control py-3 rounded-3 border-light-subtle fw-bold text-success"
                  placeholder="Ej: 89000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold text-muted text-uppercase mb-1">Descripción</label>
                <textarea
                  className="form-control p-3 rounded-3 border-light-subtle"
                  rows="3"
                  placeholder="Detalles, materiales, número de flores u observaciones..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              {/* MÓDULO MEJORADO DE SELECCIÓN DE IMÁGENES */}
              <div className="col-12 mt-4">
                <label className="form-label small fw-bold text-muted text-uppercase d-block mb-2">
                  Imágenes del Producto (Máximo 10):
                </label>

                {/* BOTÓN CREADO Y MEJORADO PARA SELECCIONAR / AGREGAR IMÁGENES */}
                <div className="d-flex flex-wrap align-items-center gap-3 bg-light p-3 rounded-3 border">
                  <label className="btn btn-outline-dark fw-bold rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 cursor-pointer shadow-sm">
                    <i className="bi bi-cloud-arrow-up-fill fs-5 text-primary"></i>
                    <span>+ Seleccionar / Agregar Imágenes</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="d-none"
                      onChange={handleImageChange}
                      disabled={existingImages.length + newImageFiles.length >= 10}
                    />
                  </label>

                  <small className="text-muted fw-semibold">
                    Cargadas: <strong className="text-dark">{existingImages.length + newImageFiles.length} / 10</strong>
                  </small>
                </div>

                {/* PREVISUALIZACIÓN DE IMÁGENES GUARDADAS EN BD */}
                {existingImages.length > 0 && (
                  <div className="mt-3">
                    <small className="fw-bold text-muted d-block mb-2 text-uppercase">Imágenes guardadas:</small>
                    <div className="d-flex flex-wrap gap-3">
                      {existingImages.map((img, idx) => (
                        <div key={idx} className="position-relative bg-white border rounded-3 p-1 shadow-sm">
                          <img
                            src={img}
                            alt={`Guardada-${idx}`}
                            className="rounded-2"
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 translate-middle badge rounded-circle p-1 shadow"
                            onClick={() => removeExistingImage(idx)}
                            title="Eliminar imagen"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PREVISUALIZACIÓN DE NUEVAS IMÁGENES A SUBIR */}
                {newImagePreviews.length > 0 && (
                  <div className="mt-3">
                    <small className="fw-bold text-primary d-block mb-2 text-uppercase">Nuevas imágenes a subir:</small>
                    <div className="d-flex flex-wrap gap-3">
                      {newImagePreviews.map((preview, idx) => (
                        <div key={idx} className="position-relative bg-white border border-primary rounded-3 p-1 shadow-sm">
                          <img
                            src={preview}
                            alt={`Nueva-${idx}`}
                            className="rounded-2"
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 translate-middle badge rounded-circle p-1 shadow"
                            onClick={() => removeNewImage(idx)}
                            title="Eliminar selección"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
              <button
                type="submit"
                className="btn btn-danger rounded-pill px-5 py-3 fw-bold text-uppercase shadow fs-6"
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : editingId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>

        {/* INVENTARIO / LISTA DE PRODUCTOS */}
        <div className="card bg-black border-secondary rounded-4 p-4 shadow-lg">
          <h4 className="fw-bold text-white mb-4">
            Inventario de Productos ({products.length})
          </h4>

          {loading ? (
            <div className="text-center py-4 text-muted">
              <div className="spinner-border text-success" role="status"></div>
              <p className="mt-2">Cargando inventario...</p>
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted text-center py-4">No hay productos registrados aún.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>SKU</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Subcategoría</th>
                    <th>Precio</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const firstImage = p.images && p.images.length > 0 
                      ? p.images[0] 
                      : (p.image || 'https://via.placeholder.com/50?text=Sin+Foto');

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="position-relative d-inline-block">
                            <img
                              src={firstImage}
                              alt={p.title || p.name}
                              className="rounded-3 border border-secondary"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                            {p.images && p.images.length > 1 && (
                              <span className="position-absolute bottom-0 end-0 badge bg-dark text-success border border-success p-1 rounded-circle" style={{ fontSize: '10px' }}>
                                +{p.images.length - 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="fw-mono text-secondary">{p.sku || p.code || 'N/A'}</td>
                        <td className="fw-bold text-white">{p.title || p.name}</td>
                        <td>
                          <span className="badge bg-success bg-opacity-25 text-success border border-success">
                            {p.category}
                          </span>
                        </td>
                        <td className="text-muted">{p.subCategory || '—'}</td>
                        <td className="fw-bold text-success">
                          ${Number(p.price || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-outline-warning rounded-pill px-3 fw-bold"
                              onClick={() => handleEdit(p)}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold"
                              onClick={() => handleDelete(p.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}