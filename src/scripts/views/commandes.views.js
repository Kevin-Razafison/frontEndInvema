/**
 * ========================================
 * MODULE DE GESTION DES COMMANDES - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Fonctionnalités complètes:
 * - Récupération des commandes
 * - Création de commandes
 * - Mise à jour du statut
 * - Suppression
 * - Filtrage et recherche
 */

import { API_ENDPOINTS, apiFetch, isAuthenticated } from '../../data/apiUrl.js';
import { renderSection } from '../utils/render.js';

/**
 * Récupère toutes les commandes
 * @returns {Promise<Array>} Liste des commandes
 */
export async function fetchOrders() {
  if (!isAuthenticated()) {
    console.warn("⚠️ Utilisateur non authentifié");
    return [];
  }

  try {
    const data = await apiFetch(API_ENDPOINTS.orders.base);
    
    console.log(`✅ ${data.length} commande(s) récupérée(s)`);
    
    // Afficher les détails dans la console
    data.forEach(order => {
      console.log(`📦 Commande #${order.id} - Statut: ${order.status}`);
      console.log(`   Fournisseur: ${order.supplier?.name}`);
      console.log(`   Items: ${order.items?.length} article(s)`);
      
      order.items?.forEach(item => {
        console.log(`   - ${item.product?.name} x ${item.quantity}`);
      });
    });

    return data;

  } catch (err) {
    console.error("❌ Erreur récupération commandes:", err);
    showErrorNotification("Impossible de charger les commandes");
    return [];
  }
}

/**
 * Récupère une commande par ID
 * @param {number|string} orderId - ID de la commande
 * @returns {Promise<Object|null>} La commande ou null
 */
export async function fetchOrderById(orderId) {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const order = await apiFetch(API_ENDPOINTS.orders.byId(orderId));
    
    console.log(`✅ Commande #${orderId} récupérée:`, order);
    return order;

  } catch (err) {
    console.error(`❌ Erreur récupération commande #${orderId}:`, err);
    return null;
  }
}

/**
 * Crée une nouvelle commande
 * @param {Object} orderData - Données de la commande
 * @param {number} orderData.supplierId - ID du fournisseur
 * @param {Array} orderData.items - Liste des items [{id: productId, quantity: number}]
 * @returns {Promise<Object|null>} La commande créée ou null
 */
export async function createOrder(orderData) {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    // Validation
    if (!orderData.supplierId || !orderData.items || orderData.items.length === 0) {
      throw new Error("Fournisseur et items sont requis");
    }

    // Vérifier que tous les items ont un ID et une quantité
    const invalidItems = orderData.items.filter(item => !item.id || !item.quantity || item.quantity <= 0);
    if (invalidItems.length > 0) {
      throw new Error("Tous les items doivent avoir un ID et une quantité valide");
    }

    const newOrder = await apiFetch(API_ENDPOINTS.orders.create, {
      method: 'POST',
      body: JSON.stringify({
        supplierId: parseInt(orderData.supplierId),
        items: orderData.items.map(item => ({
          id: parseInt(item.id),
          quantity: parseInt(item.quantity)
        }))
      })
    });

    console.log(`✅ Commande #${newOrder.id} créée avec succès`);
    showSuccessNotification(`Commande #${newOrder.id} créée. Email envoyé au fournisseur.`);
    
    return newOrder;

  } catch (err) {
    console.error("❌ Erreur création commande:", err);
    showErrorNotification(err.message || "Impossible de créer la commande");
    return null;
  }
}

/**
 * Met à jour le statut d'une commande
 * @param {number|string} orderId - ID de la commande
 * @param {string} newStatus - Nouveau statut (PENDING, APPROVED, REJECTER, PREPARED, PICKEDUP)
 * @returns {Promise<Object|null>} La commande mise à jour ou null
 */
export async function updateOrderStatus(orderId, newStatus) {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const validStatuses = ["PENDING", "APPROVED", "REJECTER", "PREPARED", "PICKEDUP"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}`);
    }

    const updatedOrder = await apiFetch(API_ENDPOINTS.orders.update(orderId), {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    console.log(`✅ Commande #${orderId} mise à jour: ${newStatus}`);
    showSuccessNotification(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
    
    return updatedOrder;

  } catch (err) {
    console.error(`❌ Erreur mise à jour commande #${orderId}:`, err);
    showErrorNotification(err.message || "Impossible de mettre à jour la commande");
    return null;
  }
}

/**
 * Supprime une commande
 * @param {number|string} orderId - ID de la commande
 * @returns {Promise<boolean>} True si succès, false sinon
 */
export async function deleteOrder(orderId) {
  if (!isAuthenticated()) {
    return false;
  }

  if (!confirm(`Êtes-vous sûr de vouloir supprimer la commande #${orderId} ?`)) {
    return false;
  }

  try {
    await apiFetch(API_ENDPOINTS.orders.delete(orderId), {
      method: 'DELETE'
    });

    console.log(`✅ Commande #${orderId} supprimée`);
    showSuccessNotification("Commande supprimée avec succès");
    
    return true;

  } catch (err) {
    console.error(`❌ Erreur suppression commande #${orderId}:`, err);
    showErrorNotification(err.message || "Impossible de supprimer la commande");
    return false;
  }
}

/**
 * Récupère les notifications de commandes
 * @returns {Promise<Array>} Liste des notifications
 */
export async function fetchOrderNotifications() {
  if (!isAuthenticated()) {
    return [];
  }

  try {
    const notifications = await apiFetch(API_ENDPOINTS.orders.notifications);
    
    console.log(`🔔 ${notifications.length} notification(s) récupérée(s)`);
    return notifications;

  } catch (err) {
    console.error("❌ Erreur récupération notifications:", err);
    return [];
  }
}

/**
 * Filtre les commandes par statut
 * @param {string} status - Statut à filtrer
 * @returns {Promise<Array>} Commandes filtrées
 */
export async function filterOrdersByStatus(status) {
  const allOrders = await fetchOrders();
  
  if (!status || status === 'ALL') {
    return allOrders;
  }

  return allOrders.filter(order => order.status === status);
}

/**
 * Filtre les commandes par fournisseur
 * @param {number|string} supplierId - ID du fournisseur
 * @returns {Promise<Array>} Commandes du fournisseur
 */
export async function filterOrdersBySupplier(supplierId) {
  const allOrders = await fetchOrders();
  return allOrders.filter(order => order.supplierId === parseInt(supplierId));
}

/**
 * Recherche des commandes par ID ou nom de fournisseur
 * @param {string} searchTerm - Terme de recherche
 * @returns {Promise<Array>} Commandes correspondantes
 */
export async function searchOrders(searchTerm) {
  const allOrders = await fetchOrders();
  
  if (!searchTerm || searchTerm.trim().length === 0) {
    return allOrders;
  }

  const term = searchTerm.toLowerCase();

  return allOrders.filter(order => 
    order.id.toString().includes(term) ||
    order.supplier?.name?.toLowerCase().includes(term)
  );
}

/**
 * Calcule les statistiques des commandes
 * @returns {Promise<Object>} Statistiques
 */
export async function getOrderStats() {
  const allOrders = await fetchOrders();

  const stats = {
    total: allOrders.length,
    byStatus: {
      PENDING: 0,
      APPROVED: 0,
      REJECTER: 0,
      PREPARED: 0,
      PICKEDUP: 0
    },
    totalItems: 0,
    recentOrders: []
  };

  allOrders.forEach(order => {
    // Compter par statut
    if (order.status in stats.byStatus) {
      stats.byStatus[order.status]++;
    }

    // Compter les items
    stats.totalItems += order.items?.length || 0;
  });

  // Commandes récentes (dernières 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  stats.recentOrders = allOrders.filter(order => 
    new Date(order.createdAt) > oneDayAgo
  );

  console.log("📊 Statistiques des commandes:", stats);
  return stats;
}

/**
 * Exporte les commandes en CSV
 * @param {Array} orders - Liste des commandes à exporter
 * @returns {string} Contenu CSV
 */
export function exportOrdersToCSV(orders) {
  const headers = [
    'ID',
    'Date',
    'Fournisseur',
    'Statut',
    'Nombre d\'articles',
    'Total articles'
  ];

  const rows = orders.map(order => [
    order.id,
    new Date(order.createdAt).toLocaleDateString('fr-FR'),
    order.supplier?.name || '-',
    getStatusLabel(order.status),
    order.items?.length || 0,
    order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  console.log("📄 Export CSV généré");
  return csvContent;
}

/**
 * Télécharge les commandes en CSV
 * @param {Array} orders - Commandes à télécharger
 */
export function downloadOrdersCSV(orders) {
  const csv = exportOrdersToCSV(orders);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  link.href = URL.createObjectURL(blob);
  link.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  console.log("✅ Fichier CSV téléchargé");
}

/**
 * Groupe les commandes par fournisseur
 * @returns {Promise<Object>} Commandes groupées {supplierId: [orders]}
 */
export async function groupOrdersBySupplier() {
  const allOrders = await fetchOrders();
  const grouped = {};

  allOrders.forEach(order => {
    if (!grouped[order.supplierId]) {
      grouped[order.supplierId] = {
        supplier: order.supplier,
        orders: []
      };
    }
    grouped[order.supplierId].orders.push(order);
  });

  return grouped;
}



// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Retourne le label français d'un statut
 */
function getStatusLabel(status) {
  const labels = {
    'PENDING': 'En attente',
    'APPROVED': 'Approuvée',
    'REJECTER': 'Rejetée',
    'PREPARED': 'Préparée',
    'PICKEDUP': 'Récupérée'
  };
  return labels[status] || status;
}

/**
 * Retourne la couleur d'un statut
 */
export function getStatusColor(status) {
  const colors = {
    'PENDING': '#FFA500',
    'APPROVED': '#22C55E',
    'REJECTER': '#EF4444',
    'PREPARED': '#3B82F6',
    'PICKEDUP': '#8B5CF6'
  };
  return colors[status] || '#6B7280';
}

/**
 * Affiche une notification de succès
 */
function showSuccessNotification(message) {
  console.log(`✅ ${message}`);
  // À implémenter avec votre système de notifications
}

/**
 * Affiche une notification d'erreur
 */
function showErrorNotification(message) {
  console.error(`❌ ${message}`);
  // À implémenter avec votre système de notifications
}

export async function CommandePannel() {
    const orders = await fetchOrders();

    // Statistiques pour les onglets
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    const approvedCount = orders.filter(o => o.status === 'APPROVED').length;
    const rejectedCount = orders.filter(o => o.status === 'REJECTER').length;
    const preparedCount = orders.filter(o => o.status === 'PREPARED').length;
    const pickedupCount = orders.filter(o => o.status === 'PICKEDUP').length;

    // Générer les lignes du tableau
    const rowsHTML = orders.map(order => `
        <div class="row" data-order-id="${order.id}">
            <div class="order-id row-content">
                <span class="id">#${order.id}</span>
            </div>
            <div class="row-content">${order.supplier?.name || '-'}</div>
            <div class="row-content">${new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
            <div class="row-content">
                <span class="status-badge ${order.status.toLowerCase()}">${getStatusLabel(order.status)}</span>
            </div>
            <div class="stock-count row-content">${order.items?.length || 0}</div>
            <div class="row-content">
                <button class="action-btn view-order" data-id="${order.id}">👁️</button>
                <button class="action-btn edit-order" data-id="${order.id}">✏️</button>
            </div>
        </div>
    `).join('');

    return renderSection("order-management-container", `
        <div class="order-management-title">Gestion des Commandes</div>
        
        <!-- Barre de filtres / onglets -->
        <div class="categories-order">
            <div class="categories-choice" id="order-status-tabs">
                <div class="div-button active" data-status="ALL">Toutes</div>
                <div class="div-button" data-status="PENDING">En attente (${pendingCount})</div>
                <div class="div-button" data-status="APPROVED">Approuvées (${approvedCount})</div>
                <div class="div-button" data-status="REJECTER">Rejetées (${rejectedCount})</div>
                <div class="div-button" data-status="PREPARED">Préparées (${preparedCount})</div>
                <div class="div-button" data-status="PICKEDUP">Récupérées (${pickedupCount})</div>
                <div class="underline"></div>
            </div>
            <div class="historique-command-button" id="historique-btn">📆 Historique</div>
        </div>

        <!-- Tableau des commandes -->
        <div class="part">
            <div class="title-row">
                <div>ID</div>
                <div>Fournisseur</div>
                <div>Date</div>
                <div>Statut</div>
                <div>Articles</div>
                <div>Actions</div>
            </div>
            <div class="row-container">
                ${rowsHTML || '<div class="no-data">Aucune commande trouvée</div>'}
            </div>
        </div>

        <!-- Bouton pour nouvelle commande (flottant ou ailleurs) -->
        <button class="btn-primary" id="create-order-btn" style="margin-top: 20px;">+ Nouvelle commande</button>
    `);
}

export function attachOrderEvents() {
    // Gestion des onglets
    const tabs = document.querySelectorAll('.categories-choice .div-button');
    const underline = document.querySelector('.underline');
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Retirer la classe active de tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Déplacer la barre sous l'onglet actif
            const tabWidth = tab.offsetWidth;
            const tabLeft = tab.offsetLeft;
            underline.style.transform = `translateX(${tabLeft}px)`;
            underline.style.width = `${tabWidth}px`;

            // Filtrer les commandes par statut
            const status = tab.dataset.status;
            filterOrdersByStatusUI(status);
        });
    });

    // Boutons d'action sur chaque ligne
    document.querySelectorAll('.view-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.id;
            window.location.hash = `#/commande/${orderId}`; // à implémenter
        });
    });

    // Historique
    document.getElementById('historique-btn')?.addEventListener('click', () => {
        console.log('Afficher historique');
    });

    document.getElementById('create-order-btn')?.addEventListener('click', openCreateOrderModal);
}

/**
 * Ouvre un modal de création de commande
 */
function openCreateOrderModal() {
    // Créer l'overlay et le formulaire
    const modalHTML = `
        <div class="popup-container" id="create-order-modal">
            <div class="popup">
                <h3>➕ Nouvelle commande</h3>
                <div class="form-group">
                    <label>Fournisseur</label>
                    <select id="order-supplier" required>
                        <option value="">Sélectionner un fournisseur</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Produit</label>
                    <select id="order-product" required>
                        <option value="">Sélectionner un produit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantité</label>
                    <input type="number" id="order-quantity" min="1" value="1" required>
                </div>
                <div class="popup-buttons">
                    <button class="cancel" id="cancel-order">Annuler</button>
                    <button class="confirm" id="confirm-order">Créer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Charger dynamiquement les fournisseurs et produits
    loadSuppliersAndProducts();

    // Fermeture
    document.getElementById('cancel-order').addEventListener('click', () => {
        document.getElementById('create-order-modal').remove();
    });
    document.getElementById('confirm-order').addEventListener('click', async () => {
        const supplierId = document.getElementById('order-supplier').value;
        const productId = document.getElementById('order-product').value;
        const quantity = document.getElementById('order-quantity').value;
        if (!supplierId || !productId || !quantity) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        // Appel API pour créer la commande
        const result = await createOrder({
            supplierId,
            items: [{ id: productId, quantity }]
        });
        if (result) {
            document.getElementById('create-order-modal').remove();
            // Recharger la vue des commandes
            const main = document.getElementById('main');
            main.innerHTML = await CommandePannel();
            attachOrderEvents();
        }
    });
}

async function loadSuppliersAndProducts() {
    // Importer les fonctions nécessaires
    const { fournisseursCards } = await import('../../data/Fournisseurs.js');
    const { fetchProducts } = await import('../../data/product.js');
    
    const suppliers = await fournisseursCards();
    const products = await fetchProducts();

    const supplierSelect = document.getElementById('order-supplier');
    const productSelect = document.getElementById('order-product');

    suppliers.forEach(sup => {
        supplierSelect.innerHTML += `<option value="${sup.id}">${sup.name}</option>`;
    });
    products.forEach(prod => {
        productSelect.innerHTML += `<option value="${prod.id}">${prod.name} (Stock: ${prod.quantity})</option>`;
    });
}

// Fonction de filtrage (à compléter)
function filterOrdersByStatusUI(status) {
    const rows = document.querySelectorAll('.row');
    rows.forEach(row => {
        const orderStatus = row.querySelector('.status-badge').className.split(' ')[1]; // ex: "pending"
        if (status === 'ALL' || orderStatus.toUpperCase() === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
// Export par défaut
export default {
  fetchOrders,
  fetchOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  fetchOrderNotifications,
  filterOrdersByStatus,
  filterOrdersBySupplier,
  searchOrders,
  getOrderStats,
  exportOrdersToCSV,
  downloadOrdersCSV,
  groupOrdersBySupplier,
  getStatusColor,
  CommandePannel
};