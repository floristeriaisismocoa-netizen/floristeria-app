// src/pages/AdminProductsView.jsx
import React, { useState, useEffect } from 'react';
import { subscribeToProducts, createProduct, updateProduct, deleteProduct } from '../services/productsService';

export function AdminProductsView() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulario de Producto
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('RAMOS');
  const [subCategory, setSubCategory] = useState('NATURALES');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data || []);
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const categories = [
    { id: 'RAMOS', label: 'Ramos' },
    { id: 'DESAYUNOS', label: 'Desayunos' },
    { id: 'PELUCHES', label: 'Peluches' },
    { id: 'CHOCOLATES', label: 'Chocolates' },
    { id: 'GLOBOS', label: 'Globos' },
    { id: 'CORONAS', label: 'Coronas' },
    { id: 'MARIPOSAS', label: 'Mariposas' },
    { id: 'ESPECIALES', label: 'Especiales' }
  ];

  const subCategoriesRamos = [
    { id: 'NATURALES', label: 'Ramos Naturales' },
    { id: 'ETERNOS', label: 'Ramos Eternos' },
    { id: 'FUNEBRES', label: 'Ramos Fúnebres' }
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + existingImages.length > 10) {
      alert('Solo puedes subir hasta 10 imágenes por producto.');
      return;
    }
    setImages(files);
  };

  const resetForm = () => {
    setEditingId(null);
    setSku('');
    setName('');
    setCategory('RAMOS');
    setSubCategory('NATURALES');
    setPrice('');
    setDescription('');
    setImages([]);
    setExistingImages([]);
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setSku(product.sku || '');
    setName(product.title || product.name || '');
    const currentCat = (product.category || 'RAMOS').toUpperCase();
    setCategory(currentCat);
    setSubCategory(product.subCategory ? product.subCategory.toUpperCase() : 'NATURALES');
    setPrice(product.price || '');
    setDescription(product.description || '');
    
    const imgs = product.images && product.images.length > 0 
      ? product.images 
      : (product.image ? [product.image] : []);
    setExistingImages(imgs);
    setImages([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      alert('Por favor completa el nombre y el precio del producto.');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        sku: sku.trim(),
        title: name.trim(),
        name: name.trim(),
        category: category.toUpperCase(),
        subCategory: category.toUpperCase() === 'RAMOS' ? subCategory.toUpperCase() : null,
        price: Number(price),
        description: description.trim()
      };

      if (editingId) {
        await updateProduct(editingId, productData, images, existingImages);
        alert('Producto actualizado con éxito.');
      } else {
        await createProduct(productData, images);
        alert('Producto agregado con éxito.');
      }

      resetForm();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      alert('Ocurrió un error al guardar en la base de datos.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('No se pudo eliminar el producto.');
      }
    }
  };

  return (
    <div className="container py-4">
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
        <h3 className="fw-bold mb-4 text-dark">
          {editingId ? '✏️ Editar Producto' : '➕ Agregar Nuevo Producto'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Código / SKU:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: ROS-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Nombre del Producto:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Ramo Dubay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Categoría Principal:</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  if (val === 'RAMOS') {
                    setSubCategory('NATURALES');
                  } else {
                    setSubCategory('');
                  }
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* SUBCATEGORÍA DINÁMICA PARA RAMOS */}
            {category === 'RAMOS' && (
              <div className="col-md-6 bg-light p-2 rounded-3 border border-success">
                <label className="form-label fw-bold text-success">
                  🌹 Subcategoría de Ramos:
                </label>
                <select
                  className="form-select fw-semibold"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                >
                  {subCategoriesRamos.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={category === 'RAMOS' ? 'col-md-12' : 'col-md-6'}>
              <label className="form-label fw-semibold">Precio ($ COP):</label>
              <input
                type="number"
                className="form-control"
                placeholder="79000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Descripción:</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Detalles sobre las flores, empaque, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Imágenes del Producto (Máximo 10):</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <small className="text-muted d-block mt-1">
                Guardadas en BD: {existingImages.length} | Seleccionadas para subir: {images.length}
              </small>

              {existingImages.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {existingImages.map((img, idx) => (
                    <div key={idx} className="position-relative">
                      <img
                        src={img}
                        alt="Vista previa"
                        className="rounded border"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle"
                        style={{ width: '18px', height: '18px', fontSize: '10px', lineHeight: 1 }}
                        onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="d-flex gap-2 justify-content-end mt-4">
            {editingId && (
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3"
                onClick={resetForm}
              >
                Cancelar Edición
              </button>
            )}
            <button
              type="submit"
              className="btn btn-danger rounded-3 px-4 fw-bold"
              disabled={saving}
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTADO DE PRODUCTOS */}
      <div className="card shadow-sm border-0 rounded-4 p-4">
        <h4 className="fw-bold mb-3 text-dark">Inventario de Productos ({products.length})</h4>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-danger" role="status"></div>
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted">No hay productos registrados en la base de datos.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
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
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img
                        src={
                          p.images && p.images.length > 0
                            ? p.images[0]
                            : p.image || 'https://via.placeholder.com/50'
                        }
                        alt={p.title || p.name}
                        className="rounded"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    </td>
                    <td><small className="fw-bold">{p.sku || 'N/A'}</small></td>
                    <td className="fw-semibold">{p.title || p.name}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {p.category || 'RAMOS'}
                      </span>
                    </td>
                    <td>
                      {p.subCategory ? (
                        <span className="badge bg-success">
                          {p.subCategory}
                        </span>
                      ) : (
                        <small className="text-muted">-</small>
                      )}
                    </td>
                    <td className="fw-bold text-danger">
                      ${Number(p.price || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(p)}
                      >
                        ✏️️ Editar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(p.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}