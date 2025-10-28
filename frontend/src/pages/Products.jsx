import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, usersAPI, authAPI } from '../services/api';
import ProductForm from '../components/ProductForm';
import styles from './Common.module.css';
import modalStyles from '../components/ProductForm.module.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [regionFilter, setRegionFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger l'utilisateur actuel
      const currentUserRes = await authAPI.getCurrentUser();
      setCurrentUser(currentUserRes.data.user);

      // Charger les produits et catégories
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll()
      ]);

      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);

      // Charger les utilisateurs uniquement si super_admin ou leader
      const userRole = currentUserRes.data.user.role;
      if (userRole === 'super_admin' || userRole === 'leader' || userRole === 'admin') {
        try {
          const usersRes = await usersAPI.getAll();
          setUsers(usersRes.data.users);
        } catch (error) {
          console.log('Non-admin user, skipping users list');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
      } else {
        await productsAPI.create(data);
      }
      await loadData();
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde du produit');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      await productsAPI.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;

const uniqueRegions = Array.from(
  new Set(products.map(p => p.region).filter(Boolean))
);

// Filtrer les produits par région
const filteredProducts = regionFilter === 'all'
  ? products
  : products.filter(p => p.region === regionFilter);

const productsByRegion = uniqueRegions.map(regionName => {
  const regionProducts = filteredProducts.filter(p => p.region === regionName);
  return {
    label: regionName,
    products: regionProducts
  };
});
console.log(products)

return (
  <div className={styles.container}>
    <div className={styles.header}>
      <h1>🏞️ Gestion des Produits</h1>
      {!showForm && (
        <button className={styles.btnPrimary} onClick={handleCreate}>
          + Nouveau Produit
        </button>
      )}
    </div>

    {showForm ? (
      <div className={modalStyles.formWrapper}>
        <ProductForm
          product={editingProduct}
          categories={categories}
          users={users}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    ) : (
      <div className={styles.groupGrid}>
        {productsByRegion.map(({ label, products }) => (
          <div key={label} className={styles.groupRow}>
            <h2 className={styles.groupTitle}>📍 {label.charAt(0).toUpperCase() + label.slice(1)}</h2>
            <hr/>

            {products.length > 0 ? (
              <div className={styles.groupGrid}>
                {products.map(product => (
                  <div key={product.id} className={styles.card} style={{width: '300px'}}>
                    <div
                      className={styles.cardColorBar}
                      style={{ backgroundColor: product.color }}
                    />
                    {product.images?.[0] && (
                      <img
                        src={`http://localhost:5000${product.images[0]}`}
                        alt={product.name}
                        className={styles.productImage}
                      />
                    )}
                    <h3>{product.name}</h3>
                    <p>{product.shortDescription || 'Aucune description'}</p>
                    <div className={styles.productInfo}>
                      <span>💰 {product.priceIndividual}€</span>
                      <span>⏱️ {product.duration / 60}h</span>
                      <span>👥 Max: {product.maxCapacity}</span>
                    </div>
                    {product.categories && product.categories.length > 0 && (
                      <div className={styles.productCategories}>
                        {product.categories.map(pc => (
                          <span key={pc.id} className={styles.badgeCategory}>
                            {pc.category?.name || 'N/A'}
                          </span>
                        ))}
                      </div>
                    )}
                    {product.websiteLink && (
                      <div className={styles.productWebLink}>
                        <a href={product.websiteLink} target="_blank" rel="noopener noreferrer">
                          🔗 Voir la page
                        </a>
                      </div>
                    )}
                    <div className={styles.cardFooter}>
                      <span className={styles.badgeLevel}>{product.level}</span>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => handleEdit(product)}
                        className={styles.btnEdit}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className={styles.btnDelete}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>Aucun produit dans ce groupe</p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
}

export default Products;
