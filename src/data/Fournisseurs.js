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

import { API_URL, getAuthHeaders, isAuthenticated } from '../config/apiUrl.js';

/**
 * Récupère la liste complète des fournisseurs
 * @param {Object} filters - Filtres optionnels
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
        // Construire l'URL avec les filtres
        let url = `${API_URL}/supplier`;
        const queryParams = new URLSearchParams();

        if (filters.search) {
            queryParams.append('search', filters.search);
        }
        if (filters.type) {
            queryParams.append('type', filters.type);
        }

        if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
        }

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
        console.log(`✅ ${data.length} fournisseur(s) récupéré(s)`);
        return data;

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
        const response = await fetch(`${API_URL}/supplier/${supplierId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`⚠️ Fournisseur #${supplierId} non trouvé`);
                return null;
            }
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const supplier = await response.json();
        console.log(`✅ Fournisseur #${supplierId} récupéré:`, supplier.name);
        return supplier;

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du fournisseur #${supplierId}:`, error);
        return null;
    }
}

/**
 * Crée un nouveau fournisseur
 * @param {Object} supplierData - Données du fournisseur à créer
 * @param {string} supplierData.name - Nom du fournisseur
 * @param {string} [supplierData.type] - Type de fourniture
 * @param {string} [supplierData.contact] - Numéro de contact
 * @param {string} [supplierData.email] - Email
 * @param {string} [supplierData.address] - Adresse
 * @returns {Promise<Object|null>} Le fournisseur créé ou null en cas d'erreur
 */
export async function createSupplier(supplierData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        // Validation des données obligatoires
        if (!supplierData.name || supplierData.name.trim().length === 0) {
            throw new Error('Le nom du fournisseur est obligatoire');
        }

        // Validation de l'email si fourni
        if (supplierData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(supplierData.email)) {
                throw new Error('Format d\'email invalide');
            }
        }

        // Validation du numéro de téléphone si fourni
        if (supplierData.contact) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(supplierData.contact)) {
                throw new Error('Format de numéro de téléphone invalide');
            }
        }

        const response = await fetch(`${API_URL}/supplier`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(supplierData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création');
        }

        const newSupplier = await response.json();
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
 * Met à jour un fournisseur existant
 * @param {number|string} supplierId - ID du fournisseur à modifier
 * @param {Object} updatedData - Nouvelles données du fournisseur
 * @returns {Promise<Object|null>} Le fournisseur mis à jour ou null en cas d'erreur
 */
export async function updateSupplier(supplierId, updatedData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        // Validation de l'email si fourni
        if (updatedData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updatedData.email)) {
                throw new Error('Format d\'email invalide');
            }
        }

        // Validation du numéro de téléphone si fourni
        if (updatedData.contact) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(updatedData.contact)) {
                throw new Error('Format de numéro de téléphone invalide');
            }
        }

        const response = await fetch(`${API_URL}/supplier/${supplierId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la mise à jour');
        }

        const updatedSupplier = await response.json();
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
        const response = await fetch(`${API_URL}/supplier/${supplierId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

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
        const response = await fetch(`${API_URL}/supplier/${supplierId}/products`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const products = await response.json();
        console.log(`✅ ${products.length} produit(s) trouvé(s) pour ce fournisseur`);
        return products;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des produits du fournisseur:', error);
        return [];
    }
}

/**
 * Upload d'un logo pour un fournisseur
 * @param {File} logoFile - Fichier logo à uploader
 * @param {number|string} supplierId - ID du fournisseur
 * @returns {Promise<string|null>} URL du logo ou null en cas d'erreur
 */
export async function uploadSupplierLogo(logoFile, supplierId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const formData = new FormData();
        formData.append('logo', logoFile);

        const response = await fetch(`${API_URL}/supplier/${supplierId}/logo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                // Ne pas définir Content-Type pour FormData
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'upload du logo');
        }

        const data = await response.json();
        console.log('✅ Logo uploadé avec succès');
        showSuccessNotification('Logo mis à jour');
        return data.logoUrl;

    } catch (error) {
        console.error('❌ Erreur lors de l\'upload du logo:', error);
        showErrorNotification('Impossible d\'uploader le logo');
        return null;
    }
}

/**
 * Récupère les statistiques d'un fournisseur
 * @param {number|string} supplierId - ID du fournisseur
 * @returns {Promise<Object|null>} Statistiques ou null
 */
export async function getSupplierStats(supplierId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const [supplier, products] = await Promise.all([
            fetchSupplierById(supplierId),
            fetchProductsBySupplier(supplierId)
        ]);

        if (!supplier) {
            return null;
        }

        const stats = {
            id: supplier.id,
            name: supplier.name,
            totalProducts: products.length,
            activeProducts: products.filter(p => p.quantite > 0).length,
            lowStockProducts: products.filter(p => p.status === 'low').length
        };

        console.log('📊 Statistiques du fournisseur:', stats);
        return stats;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
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
    fournisseursCards,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers,
    filterSuppliersByType,
    fetchProductsBySupplier,
    uploadSupplierLogo,
    getSupplierStats
};