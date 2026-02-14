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

import { API_URL, getAuthHeaders, isAuthenticated } from '../config/apiUrl.js';

/**
 * Récupère la liste complète des produits
 * @param {Object} filters - Filtres optionnels (catégorie, recherche, etc.)
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
        // Construire l'URL avec les filtres
        let url = `${API_URL}/products`;
        const queryParams = new URLSearchParams();

        if (filters.category) {
            queryParams.append('category', filters.category);
        }
        if (filters.search) {
            queryParams.append('search', filters.search);
        }
        if (filters.status) {
            queryParams.append('status', filters.status);
        }

        if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
        }

        // Effectuer la requête
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        // Gérer les erreurs HTTP
        if (!response.ok) {
            if (response.status === 401) {
                console.error('🔒 Session expirée');
                redirectToLogin();
                return [];
            }
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ ${data.length} produit(s) récupéré(s)`);
        return data;

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
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`⚠️ Produit #${productId} non trouvé`);
                return null;
            }
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const product = await response.json();
        console.log(`✅ Produit #${productId} récupéré:`, product.name);
        return product;

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du produit #${productId}:`, error);
        return null;
    }
}

/**
 * Crée un nouveau produit
 * @param {Object} productData - Données du produit à créer
 * @returns {Promise<Object|null>} Le produit créé ou null en cas d'erreur
 */
export async function createProduct(productData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        // Validation des données obligatoires
        const requiredFields = ['name', 'category', 'prixUnitaire', 'quantite'];
        const missingFields = requiredFields.filter(field => !productData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
        }

        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création');
        }

        const newProduct = await response.json();
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
 * Met à jour un produit existant
 * @param {number|string} productId - ID du produit à modifier
 * @param {Object} updatedData - Nouvelles données du produit
 * @returns {Promise<Object|null>} Le produit mis à jour ou null en cas d'erreur
 */
export async function updateProduct(productId, updatedData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la mise à jour');
        }

        const updatedProduct = await response.json();
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
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

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
 * @param {string} status - Statut ('low', 'medium', 'high')
 * @returns {Promise<Array>} Liste des produits avec ce statut
 */
export async function filterProductsByStatus(status) {
    if (!status) {
        return fetchProducts();
    }

    return fetchProducts({ status });
}

/**
 * Upload d'une image pour un produit
 * @param {File} imageFile - Fichier image à uploader
 * @param {number|string} productId - ID du produit
 * @returns {Promise<string|null>} URL de l'image ou null en cas d'erreur
 */
export async function uploadProductImage(imageFile, productId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${API_URL}/products/${productId}/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                // Ne pas définir Content-Type, le navigateur le fera automatiquement avec boundary
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'upload de l\'image');
        }

        const data = await response.json();
        console.log('✅ Image uploadée avec succès');
        return data.imageUrl;

    } catch (error) {
        console.error('❌ Erreur lors de l\'upload de l\'image:', error);
        showErrorNotification('Impossible d\'uploader l\'image');
        return null;
    }
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
    filterProductsByStatus,
    uploadProductImage
};