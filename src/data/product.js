/**
 * ========================================
 * MODULE DE GESTION DES PRODUITS
 * ========================================
 * 
 * Ce fichier gère toutes les opérations liées aux produits :
 * - Récupération de la liste des produits
 * - Création, modification, suppression de produits
 * - Recherche et filtrage
 */

import { API_ENDPOINTS, apiFetch, isAuthenticated, getImageUrl } from './apiUrl.js';

/**
 * Récupère la liste complète des produits
 * @param {Object} filters - Filtres optionnels (category, search, status)
 * @returns {Promise<Array>} Liste des produits
 */
export async function fetchProducts(filters = {}) {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
        console.warn('⚠️ Utilisateur non authentifié');
        redirectToLogin();
        return [];
    }

    try {
        let products = await apiFetch(API_ENDPOINTS.products.base);

        // Filtres côté client car l'API ne les supporte pas tous
        if (filters.category) {
            products = products.filter(p => 
                p.category?.id === Number(filters.category) || 
                p.categoryId === Number(filters.category)
            );
        }

        if (filters.search) {
            const term = filters.search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term) ||
                p.category?.name?.toLowerCase().includes(term)
            );
        }

        if (filters.status) {
            products = products.filter(p => {
                const status = getProductStatus(p);
                return status === filters.status;
            });
        }

        console.log(`✅ ${products.length} produit(s) récupéré(s)`);
        return products;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des produits:', error);
        showErrorNotification('Impossible de charger les produits');
        return [];
    }
}

/**
 * Récupère un produit spécifique par son ID
 * @param {number|string} productId - ID du produit
 * @returns {Promise<Object|null>} Le produit ou null si non trouvé
 */
export async function fetchProductById(productId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const product = await apiFetch(API_ENDPOINTS.products.byId(productId));
        console.log(`✅ Produit #${productId} récupéré:`, product.name);
        return product;

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du produit #${productId}:`, error);
        return null;
    }
}

/**
 * Crée un nouveau produit avec image (FormData)
 * @param {FormData} formData - Données du produit avec champ imageUrl
 * @returns {Promise<Object|null>} Le produit créé ou null en cas d'erreur
 */
export async function createProduct(formData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const newProduct = await apiFetch(API_ENDPOINTS.products.create, {
            method: 'POST',
            body: formData
        });

        console.log(`✅ Produit créé: ${newProduct.name} (ID: ${newProduct.id})`);
        showSuccessNotification(`Produit "${newProduct.name}" créé avec succès`);
        return newProduct;

    } catch (error) {
        console.error('❌ Erreur lors de la création du produit:', error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Met à jour un produit existant avec image optionnelle
 * @param {number|string} productId - ID du produit à modifier
 * @param {FormData} formData - Nouvelles données du produit
 * @returns {Promise<Object|null>} Le produit mis à jour ou null en cas d'erreur
 */
export async function updateProduct(productId, formData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const updatedProduct = await apiFetch(API_ENDPOINTS.products.update(productId), {
            method: 'PUT',
            body: formData
        });

        console.log(`✅ Produit #${productId} mis à jour`);
        showSuccessNotification('Produit mis à jour avec succès');
        return updatedProduct;

    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour du produit #${productId}:`, error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Supprime un produit
 * @param {number|string} productId - ID du produit à supprimer
 * @returns {Promise<boolean>} True si suppression réussie, false sinon
 */
export async function deleteProduct(productId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    try {
        await apiFetch(API_ENDPOINTS.products.delete(productId), {
            method: 'DELETE'
        });

        console.log(`✅ Produit #${productId} supprimé`);
        showSuccessNotification('Produit supprimé avec succès');
        return true;

    } catch (error) {
        console.error(`❌ Erreur lors de la suppression du produit #${productId}:`, error);
        showErrorNotification(error.message);
        return false;
    }
}

/**
 * Supprime plusieurs produits en une fois
 * @param {Array<number|string>} productIds - Liste des IDs des produits à supprimer
 * @returns {Promise<Object>} Résultat de la suppression (succès et échecs)
 */
export async function deleteMultipleProducts(productIds) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return { success: [], failed: [] };
    }

    const results = {
        success: [],
        failed: []
    };

    console.log(`🗑️ Suppression de ${productIds.length} produit(s)...`);

    for (const productId of productIds) {
        const deleted = await deleteProduct(productId);
        if (deleted) {
            results.success.push(productId);
        } else {
            results.failed.push(productId);
        }
    }

    console.log(`✅ ${results.success.length} produit(s) supprimé(s)`);
    if (results.failed.length > 0) {
        console.warn(`⚠️ ${results.failed.length} échec(s)`);
    }

    return results;
}

/**
 * Recherche des produits par nom
 * @param {string} searchTerm - Terme de recherche
 * @returns {Promise<Array>} Liste des produits correspondants
 */
export async function searchProducts(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return fetchProducts();
    }

    return fetchProducts({ search: searchTerm });
}

/**
 * Filtre les produits par catégorie
 * @param {number|string} categoryId - ID de la catégorie
 * @returns {Promise<Array>} Liste des produits de cette catégorie
 */
export async function filterProductsByCategory(categoryId) {
    if (!categoryId) {
        return fetchProducts();
    }

    return fetchProducts({ category: categoryId });
}

/**
 * Filtre les produits par statut de stock
 * @param {string} status - Statut ('low', 'out', 'available')
 * @returns {Promise<Array>} Liste des produits avec ce statut
 */
export async function filterProductsByStatus(status) {
    if (!status) {
        return fetchProducts();
    }

    return fetchProducts({ status });
}

/**
 * Détermine le statut d'un produit
 * @param {Object} product 
 * @returns {string} 'out', 'low', 'available'
 */
function getProductStatus(product) {
    const qty = product.quantity || 0;
    const alert = product.alertLevel || 10;
    if (qty === 0) return 'out';
    if (qty <= alert) return 'low';
    return 'available';
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Redirige vers la page de connexion
 */
function redirectToLogin() {
    localStorage.clear();
    window.location.href = '/login.html';
}

/**
 * Affiche une notification de succès
 * @param {string} message - Message à afficher
 */
function showSuccessNotification(message) {
    // À implémenter selon votre système de notifications
    console.log(`✅ ${message}`);
}

/**
 * Affiche une notification d'erreur
 * @param {string} message - Message à afficher
 */
function showErrorNotification(message) {
    // À implémenter selon votre système de notifications
    console.error(`❌ ${message}`);
}

// Export par défaut pour compatibilité
export default {
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteMultipleProducts,
    searchProducts,
    filterProductsByCategory,
    filterProductsByStatus
};