import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, usersAPI } from '../services/api';
import styles from './Common.module.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, usersRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        usersAPI.getAll()
      ]);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🏞️ Gestion des Produits</h1>
        <button className={styles.btnPrimary}>+ Nouveau Produit</button>
      </div>

      <div className={styles.grid}>
        {products.map((product) => (
          <div key={product.id} className={styles.card}>
            <div
              className={styles.cardColorBar}
              style={{ backgroundColor: product.color }}
            />
            <h3>{product.name}</h3>
            <p>{product.shortDescription || 'Aucune description'}</p>
            <div className={styles.productInfo}>
              <span>💰 {product.priceIndividual}€</span>
              <span>⏱️ {product.duration}min</span>
              <span>👥 Max: {product.maxCapacity}</span>
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.badgeInfo}>{product.category.name}</span>
              <span className={styles.badgeLevel}>{product.level}</span>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className={styles.emptyState}>
            <p>Aucun produit créé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
