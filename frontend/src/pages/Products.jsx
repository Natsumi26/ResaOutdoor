import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, usersAPI, authAPI, settingsAPI, equipmentListsAPI, getUploadUrl } from '../services/api';
import ProductForm from '../components/ProductForm';
import styles from './Common.module.css';
import modalStyles from '../components/ProductForm.module.css';

const Products = () => {
  // Activités pré-définies
  const predefinedActivities = [
    { id: 'canyoning', name: 'Canyoning', description: 'Descente de canyons en eau' },
    { id: 'via-ferrata', name: 'Via Ferrata', description: 'Escalade équipée en montagne' },
    { id: 'escalade', name: 'Escalade', description: 'Escalade de bloc et falaise' },
    { id: 'speleologie', name: 'Spéléologie', description: 'Exploration de grottes' }
  ];

  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all');
  const [themeColors, setThemeColors] = useState({
    primary: '#667eea',
    secondary: '#764ba2'
  });

  // Equipment lists state
  const [equipmentLists, setEquipmentLists] = useState([]);
  const [showEquipmentListForm, setShowEquipmentListForm] = useState(false);
  const [editingEquipmentList, setEditingEquipmentList] = useState(null);
  const [equipmentListFormData, setEquipmentListFormData] = useState({ name: '', items: '' });

  useEffect(() => {
    loadData();
    loadThemeColors();
  }, []);

  const loadThemeColors = async () => {
    try {
      const response = await settingsAPI.get();
      const settings = response.data.settings;
      if (settings?.primaryColor) {
        setThemeColors({
          primary: settings.primaryColor,
          secondary: settings.secondaryColor || settings.primaryColor
        });
      }
    } catch (error) {
      console.error('Erreur chargement couleurs thème:', error);
    }
  };

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

  const loadEquipmentLists = async () => {
    try {
      const response = await equipmentListsAPI.getAll();
      setEquipmentLists(response.data.equipmentLists || []);
    } catch (error) {
      console.error('Erreur lors du chargement des listes de matériel:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'equipment') {
      loadEquipmentLists();
    }
  }, [activeTab]);

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

  // Equipment list handlers
  const handleCreateEquipmentList = () => {
    setEditingEquipmentList(null);
    setEquipmentListFormData({ name: '', items: '' });
    setShowEquipmentListForm(true);
  };

  const handleEditEquipmentList = (list) => {
    setEditingEquipmentList(list);
    setEquipmentListFormData({ name: list.name, items: list.items });
    setShowEquipmentListForm(true);
  };

  const handleSubmitEquipmentList = async (e) => {
    e.preventDefault();

    if (!equipmentListFormData.name.trim() || !equipmentListFormData.items.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      if (editingEquipmentList) {
        await equipmentListsAPI.update(editingEquipmentList.id, equipmentListFormData);
      } else {
        await equipmentListsAPI.create(equipmentListFormData);
      }
      await loadEquipmentLists();
      setShowEquipmentListForm(false);
      setEditingEquipmentList(null);
      setEquipmentListFormData({ name: '', items: '' });
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde de la liste');
    }
  };

  const handleDeleteEquipmentList = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette liste de matériel ?')) return;

    try {
      await equipmentListsAPI.delete(id);
      await loadEquipmentLists();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la suppression de la liste');
    }
  };

  const handleCancelEquipmentListForm = () => {
    setShowEquipmentListForm(false);
    setEditingEquipmentList(null);
    setEquipmentListFormData({ name: '', items: '' });
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;

// Déterminer les activités pratiquées par le guide actuel
const guidePracticeActivities = currentUser?.practiceActivities || [];

// Filtrer les produits par type d'activité si un filtre est sélectionné
const filteredProducts = activityFilter === 'all'
  ? products
  : products.filter(p => p.activityTypeId === activityFilter);

// Regrouper les produits par type d'activité
const productsByActivity = predefinedActivities
  .filter(activity => guidePracticeActivities.includes(activity.id))
  .map(activity => {
    const activityProducts = filteredProducts.filter(p => p.activityTypeId === activity.id);
    return {
      id: activity.id,
      label: activity.name,
      products: activityProducts
    };
  });

return (
  <div className={styles.container}>
    <div className={styles.header}>
      <h1>🏞️ Gestion des Produits</h1>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '5px', marginRight: '15px' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: activeTab === 'products' ? 'none' : '1px solid #ddd',
              background: activeTab === 'products' ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` : 'white',
              color: activeTab === 'products' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'products' ? 'bold' : 'normal'
            }}
          >
            Produits
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: activeTab === 'equipment' ? 'none' : '1px solid #ddd',
              background: activeTab === 'equipment' ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` : 'white',
              color: activeTab === 'equipment' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'equipment' ? 'bold' : 'normal'
            }}
          >
            Listes de matériel
          </button>
        </div>

        {/* Filters and buttons for products tab */}
        {activeTab === 'products' && (
          <>
            {guidePracticeActivities.length > 1 && (
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <option value="all">Toutes les activités</option>
                {predefinedActivities
                  .filter(activity => guidePracticeActivities.includes(activity.id))
                  .map(activity => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
              </select>
            )}
            {!showForm && (
              <button className={styles.btnPrimary} onClick={handleCreate} style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` }}>
                + Nouveau Produit
              </button>
            )}
          </>
        )}

        {/* Button for equipment tab */}
        {activeTab === 'equipment' && !showEquipmentListForm && (
          <button className={styles.btnPrimary} onClick={handleCreateEquipmentList} style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` }}>
            + Nouvelle Liste
          </button>
        )}
      </div>
    </div>

    {/* Products Tab */}
    {activeTab === 'products' && (
      <>
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
            {productsByActivity.map(({ id, label, products }) => (
              <div key={id} className={styles.groupRow}>
                <h2 className={styles.groupTitle}>🎯 {label}</h2>
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
                            src={getUploadUrl(product.images[0])}
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
      </>
    )}

    {/* Equipment Lists Tab */}
    {activeTab === 'equipment' && (
      <>
        {showEquipmentListForm ? (
          <div className={modalStyles.formWrapper}>
            <form onSubmit={handleSubmitEquipmentList} className={modalStyles.form}>
              <h2>{editingEquipmentList ? 'Modifier' : 'Créer'} une liste de matériel</h2>

              <div className={modalStyles.formGroup}>
                <label>Nom de la liste *</label>
                <input
                  type="text"
                  value={equipmentListFormData.name}
                  onChange={(e) => setEquipmentListFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Matériel Canyon Découverte"
                  required
                />
              </div>

              <div className={modalStyles.formGroup}>
                <label>Liste du matériel à apporter *</label>
                <textarea
                  value={equipmentListFormData.items}
                  onChange={(e) => setEquipmentListFormData(prev => ({ ...prev, items: e.target.value }))}
                  placeholder="Ex:&#10;- Maillot de bain&#10;- Serviette&#10;- Chaussures de sport fermées&#10;- Bouteille d'eau"
                  rows="12"
                  required
                  style={{ fontFamily: 'inherit' }}
                />
                <small>Entrez chaque élément sur une ligne séparée</small>
              </div>

              <div className={modalStyles.formActions}>
                <button type="button" onClick={handleCancelEquipmentListForm} className={modalStyles.btnCancel}>
                  Annuler
                </button>
                <button type="submit" className={modalStyles.btnSubmit}>
                  {editingEquipmentList ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {equipmentLists.length === 0 ? (
              <p className={styles.emptyState}>Aucune liste de matériel. Créez-en une pour l'associer à vos produits.</p>
            ) : (
              equipmentLists.map(list => (
                <div key={list.id} className={styles.card}>
                  <h3>📋 {list.name}</h3>
                  <div style={{ marginTop: '10px', marginBottom: '15px', whiteSpace: 'pre-wrap', fontSize: '14px', color: '#555' }}>
                    {list.items}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                    {list._count?.products > 0 ? (
                      <span>Utilisée par {list._count.products} produit{list._count.products > 1 ? 's' : ''}</span>
                    ) : (
                      <span>Non utilisée</span>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => handleEditEquipmentList(list)}
                      className={styles.btnEdit}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteEquipmentList(list.id)}
                      className={styles.btnDelete}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </>
    )}
  </div>
);
}

export default Products;
