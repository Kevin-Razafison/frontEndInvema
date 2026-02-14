/**
 * ========================================
 * MODULE DE GESTION DES FOURNISSEURS
 * ========================================
 * 
 * Ce fichier gère toutes les opérations liées aux fournisseurs :
 * - Récupération de la liste des fournisseurs
 * - Création, modification, suppression de fournisseurs
 * - Gestion des informations de contact
 */

import { API_ENDPOINTS, apiFetch, isAuthenticated, getImageUrl } from './apiUrl.js';

/**
 * Récupère la liste complète des fournisseurs
 * @param {Object} filters - Filtres optionnels (search, type)
 * @returns {Promise<Array>} Liste des fournisseurs
 */
export async function fournisseursCards(filters = {}) {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
        console.warn('⚠️ Aucun token trouvé, utilisateur non connecté');
        redirectToLogin();
        return [];
    }

    try {
        // Note: l'API ne supporte pas les filtres de recherche, on filtre côté client
        let suppliers = await apiFetch(API_ENDPOINTS.suppliers.base);

        if (filters.search) {
            const term = filters.search.toLowerCase();
            suppliers = suppliers.filter(s => 
                s.name.toLowerCase().includes(term) ||
                s.email?.toLowerCase().includes(term) ||
                s.category?.toLowerCase().includes(term)
            );
        }

        if (filters.type) {
            suppliers = suppliers.filter(s => s.category === filters.type);
        }

        console.log(`✅ ${suppliers.length} fournisseur(s) récupéré(s)`);
        return suppliers;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des fournisseurs:', error);
        showErrorNotification('Impossible de charger les fournisseurs');
        return [];
    }
}

/**
 * Récupère un fournisseur spécifique par son ID
 * @param {number|string} supplierId - ID du fournisseur
 * @returns {Promise<Object|null>} Le fournisseur ou null si non trouvé
 */
export async function fetchSupplierById(supplierId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const supplier = await apiFetch(API_ENDPOINTS.suppliers.byId(supplierId));
        console.log(`✅ Fournisseur #${supplierId} récupéré:`, supplier.name);
        return supplier;

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du fournisseur #${supplierId}:`, error);
        return null;
    }
}

/**
 * Crée un nouveau fournisseur avec image (FormData)
 * @param {FormData} formData - Données du fournisseur avec champ image
 * @returns {Promise<Object|null>} Le fournisseur créé ou null en cas d'erreur
 */
export async function createSupplier(formData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const newSupplier = await apiFetch(API_ENDPOINTS.suppliers.create, {
            method: 'POST',
            body: formData // FormData, donc pas de Content-Type
        });

        console.log(`✅ Fournisseur créé: ${newSupplier.name} (ID: ${newSupplier.id})`);
        showSuccessNotification(`Fournisseur "${newSupplier.name}" créé avec succès`);
        return newSupplier;

    } catch (error) {
        console.error('❌ Erreur lors de la création du fournisseur:', error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Met à jour un fournisseur existant avec image optionnelle
 * @param {number|string} supplierId - ID du fournisseur
 * @param {FormData} formData - Données mises à jour
 * @returns {Promise<Object|null>} Le fournisseur mis à jour ou null
 */
export async function updateSupplier(supplierId, formData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const updatedSupplier = await apiFetch(API_ENDPOINTS.suppliers.update(supplierId), {
            method: 'PUT',
            body: formData
        });

        console.log(`✅ Fournisseur #${supplierId} mis à jour`);
        showSuccessNotification('Fournisseur mis à jour avec succès');
        return updatedSupplier;

    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour du fournisseur #${supplierId}:`, error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Supprime un fournisseur
 * @param {number|string} supplierId - ID du fournisseur à supprimer
 * @returns {Promise<boolean>} True si suppression réussie, false sinon
 */
export async function deleteSupplier(supplierId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    try {
        await apiFetch(API_ENDPOINTS.suppliers.delete(supplierId), {
            method: 'DELETE'
        });

        console.log(`✅ Fournisseur #${supplierId} supprimé`);
        showSuccessNotification('Fournisseur supprimé avec succès');
        return true;

    } catch (error) {
        console.error(`❌ Erreur lors de la suppression du fournisseur #${supplierId}:`, error);
        showErrorNotification(error.message);
        return false;
    }
}

/**
 * Recherche des fournisseurs par nom
 * @param {string} searchTerm - Terme de recherche
 * @returns {Promise<Array>} Liste des fournisseurs correspondants
 */
export async function searchSuppliers(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return fournisseursCards();
    }

    return fournisseursCards({ search: searchTerm });
}

/**
 * Filtre les fournisseurs par type
 * @param {string} type - Type de fourniture
 * @returns {Promise<Array>} Liste des fournisseurs de ce type
 */
export async function filterSuppliersByType(type) {
    if (!type) {
        return fournisseursCards();
    }

    return fournisseursCards({ type });
}

/**
 * Récupère les produits fournis par un fournisseur spécifique
 * @param {number|string} supplierId - ID du fournisseur
 * @returns {Promise<Array>} Liste des produits
 */
export async function fetchProductsBySupplier(supplierId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return [];
    }

    try {
        // L'API ne fournit pas d'endpoint dédié, on récupère tous les produits et on filtre
        const products = await apiFetch(API_ENDPOINTS.products.base);
        return products.filter(p => p.supplierId === Number(supplierId));

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des produits du fournisseur:', error);
        return [];
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
    fournisseursCards,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers,
    filterSuppliersByType,
    fetchProductsBySupplier
};