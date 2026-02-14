import { API_ENDPOINTS, apiFetch, isAuthenticated, getUserId } from './apiUrl.js';

/**
 * Récupère la liste complète des requêtes/demandes
 * @param {Object} filters - Filtres optionnels (status, userId, productId)
 * @returns {Promise<Array>} Liste des requêtes
 */
export async function fetchRequests(filters = {}) {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
        console.warn('⚠️ Aucun token trouvé, utilisateur non connecté');
        redirectToLogin();
        return [];
    }

    try {
        let requests = await apiFetch(API_ENDPOINTS.requests.base);

        // Filtres côté client
        if (filters.status) {
            requests = requests.filter(r => r.status === filters.status);
        }
        if (filters.userId) {
            requests = requests.filter(r => r.userId === Number(filters.userId));
        }
        if (filters.productId) {
            requests = requests.filter(r => r.productId === Number(filters.productId));
        }

        console.log(`✅ ${requests.length} requête(s) récupérée(s)`);
        return requests;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des requêtes:', error);
        showErrorNotification('Impossible de charger les requêtes');
        return [];
    }
}

/**
 * Récupère une requête spécifique par son ID
 * @param {number|string} requestId - ID de la requête
 * @returns {Promise<Object|null>} La requête ou null si non trouvée
 */
export async function fetchRequestById(requestId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const request = await apiFetch(API_ENDPOINTS.requests.byId(requestId));
        console.log(`✅ Requête #${requestId} récupérée`);
        return request;

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération de la requête #${requestId}:`, error);
        return null;
    }
}

/**
 * Crée une nouvelle requête/demande
 * @param {Object} requestData - Données de la requête à créer
 * @param {number} requestData.productId - ID du produit demandé
 * @param {number} requestData.quantity - Quantité demandée
 * @param {string} requestData.reason - Raison de la demande
 * @param {number} [requestData.userId] - ID de l'utilisateur (optionnel, déduit du token)
 * @returns {Promise<Object|null>} La requête créée ou null en cas d'erreur
 */
export async function createRequest(requestData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        // Validation des données obligatoires
        const requiredFields = ['productId', 'quantity', 'reason'];
        const missingFields = requiredFields.filter(field => !requestData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
        }

        // Validation de la quantité
        if (requestData.quantity <= 0) {
            throw new Error('La quantité doit être supérieure à 0');
        }

        // Si userId n'est pas fourni, le récupérer du token
        if (!requestData.userId) {
            requestData.userId = getUserId();
        }

        const newRequest = await apiFetch(API_ENDPOINTS.requests.create, {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        console.log(`✅ Requête créée (ID: ${newRequest.id})`);
        showSuccessNotification('Demande créée avec succès');
        return newRequest;

    } catch (error) {
        console.error('❌ Erreur lors de la création de la requête:', error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Met à jour une requête existante (quantité, raison)
 * @param {number|string} requestId - ID de la requête à modifier
 * @param {Object} updatedData - Nouvelles données de la requête
 * @returns {Promise<Object|null>} La requête mise à jour ou null en cas d'erreur
 */
export async function updateRequest(requestId, updatedData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const updatedRequest = await apiFetch(API_ENDPOINTS.requests.update(requestId), {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

        console.log(`✅ Requête #${requestId} mise à jour`);
        showSuccessNotification('Demande mise à jour avec succès');
        return updatedRequest;

    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de la requête #${requestId}:`, error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Supprime une requête
 * @param {number|string} requestId - ID de la requête à supprimer
 * @returns {Promise<boolean>} True si suppression réussie, false sinon
 */
export async function deleteRequest(requestId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    try {
        await apiFetch(API_ENDPOINTS.requests.delete(requestId), {
            method: 'DELETE'
        });

        console.log(`✅ Requête #${requestId} supprimée`);
        showSuccessNotification('Demande supprimée avec succès');
        return true;

    } catch (error) {
        console.error(`❌ Erreur lors de la suppression de la requête #${requestId}:`, error);
        showErrorNotification(error.message);
        return false;
    }
}

/**
 * Met à jour le statut d'une requête (APPROVED, REJECTED, etc.)
 * @param {number|string} requestId - ID de la requête
 * @param {string} status - Nouveau statut
 * @returns {Promise<Object|null>} La requête mise à jour ou null
 */
export async function updateRequestStatus(requestId, status) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const validStatuses = ["PENDING", "APPROVED", "REJECTER", "PREPARED", "PICKEDUP"];
        if (!validStatuses.includes(status)) {
            throw new Error(`Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}`);
        }

        const updated = await apiFetch(`${API_ENDPOINTS.requests.base}/${requestId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        console.log(`✅ Requête #${requestId} mise à jour: ${status}`);
        showSuccessNotification(`Statut mis à jour: ${status}`);
        return updated;

    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour du statut #${requestId}:`, error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Récupère les statistiques des requêtes
 * @returns {Promise<Object>} Statistiques
 */
export async function getRequestStats() {
    if (!isAuthenticated()) {
        redirectToLogin();
        return {};
    }

    try {
        const stats = await apiFetch(API_ENDPOINTS.requests.stats);
        console.log("📊 Statistiques des requêtes:", stats);
        return stats;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        return {};
    }
}

/**
 * Filtre les requêtes par statut
 * @param {string} status - Statut ('PENDING', 'APPROVED', etc.)
 * @returns {Promise<Array>} Liste des requêtes avec ce statut
 */
export async function filterRequestsByStatus(status) {
    return fetchRequests({ status });
}

/**
 * Récupère les requêtes d'un utilisateur spécifique
 * @param {number|string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des requêtes de cet utilisateur
 */
export async function fetchRequestsByUser(userId) {
    return fetchRequests({ userId });
}

/**
 * Récupère les requêtes pour un produit spécifique
 * @param {number|string} productId - ID du produit
 * @returns {Promise<Array>} Liste des requêtes pour ce produit
 */
export async function fetchRequestsByProduct(productId) {
    return fetchRequests({ productId });
}

/**
 * Récupère les requêtes de l'utilisateur connecté
 * @returns {Promise<Array>} Liste des requêtes de l'utilisateur
 */
export async function fetchMyRequests() {
    const userId = getUserId();
    if (!userId) {
        redirectToLogin();
        return [];
    }
    return fetchRequestsByUser(userId);
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
    fetchRequests,
    fetchRequestById,
    createRequest,
    updateRequest,
    deleteRequest,
    updateRequestStatus,
    getRequestStats,
    filterRequestsByStatus,
    fetchRequestsByUser,
    fetchRequestsByProduct,
    fetchMyRequests
};