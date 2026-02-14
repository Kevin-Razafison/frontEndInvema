/**
 * ========================================
 * MODULE DE GESTION DES REQUÊTES/DEMANDES
 * ========================================
 * 
 * Ce fichier gère toutes les opérations liées aux demandes de produits :
 * - Récupération de la liste des requêtes
 * - Création, modification, suppression de requêtes
 * - Approbation et rejet de requêtes
 */

import { API_URL, getAuthHeaders, isAuthenticated } from './apiUrl.js';

/**
 * Récupère la liste complète des requêtes/demandes
 * @param {Object} filters - Filtres optionnels (status, userId, etc.)
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
        // Construire l'URL avec les filtres
        let url = `${API_URL}/requests`;
        const queryParams = new URLSearchParams();

        if (filters.status) {
            queryParams.append('status', filters.status);
        }
        if (filters.userId) {
            queryParams.append('userId', filters.userId);
        }
        if (filters.productId) {
            queryParams.append('productId', filters.productId);
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
        console.log(`✅ ${data.length} requête(s) récupérée(s)`);
        return data;

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
        const response = await fetch(`${API_URL}/requests/${requestId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`⚠️ Requête #${requestId} non trouvée`);
                return null;
            }
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const request = await response.json();
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
            const token = localStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                requestData.userId = payload.id;
            }
        }

        const response = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création');
        }

        const newRequest = await response.json();
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
 * Met à jour une requête existante
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
        const response = await fetch(`${API_URL}/requests/${requestId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la mise à jour');
        }

        const updatedRequest = await response.json();
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
        const response = await fetch(`${API_URL}/requests/${requestId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

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
 * Approuve une requête
 * @param {number|string} requestId - ID de la requête à approuver
 * @param {string} [comment] - Commentaire optionnel
 * @returns {Promise<Object|null>} La requête approuvée ou null en cas d'erreur
 */
export async function approveRequest(requestId, comment = '') {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/requests/${requestId}/approve`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ comment })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de l\'approbation');
        }

        const approvedRequest = await response.json();
        console.log(`✅ Requête #${requestId} approuvée`);
        showSuccessNotification('Demande approuvée avec succès');
        return approvedRequest;

    } catch (error) {
        console.error(`❌ Erreur lors de l'approbation de la requête #${requestId}:`, error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Rejette une requête
 * @param {number|string} requestId - ID de la requête à rejeter
 * @param {string} reason - Raison du rejet (obligatoire)
 * @returns {Promise<Object|null>} La requête rejetée ou null en cas d'erreur
 */
export async function rejectRequest(requestId, reason) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    if (!reason || reason.trim().length === 0) {
        showErrorNotification('Vous devez fournir une raison pour le rejet');
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/requests/${requestId}/reject`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors du rejet');
        }

        const rejectedRequest = await response.json();
        console.log(`✅ Requête #${requestId} rejetée`);
        showSuccessNotification('Demande rejetée');
        return rejectedRequest;

    } catch (error) {
        console.error(`❌ Erreur lors du rejet de la requête #${requestId}:`, error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Filtre les requêtes par statut
 * @param {string} status - Statut ('pending', 'approved', 'rejected')
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
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        return [];
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;
        return fetchRequestsByUser(userId);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des requêtes:', error);
        return [];
    }
}

/**
 * Compte les requêtes par statut
 * @returns {Promise<Object>} Objet avec les comptages {pending: x, approved: y, rejected: z}
 */
export async function countRequestsByStatus() {
    const allRequests = await fetchRequests();
    
    const counts = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: allRequests.length
    };

    allRequests.forEach(request => {
        if (request.status in counts) {
            counts[request.status]++;
        }
    });

    console.log('📊 Comptage des requêtes:', counts);
    return counts;
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
    approveRequest,
    rejectRequest,
    filterRequestsByStatus,
    fetchRequestsByUser,
    fetchRequestsByProduct,
    fetchMyRequests,
    countRequestsByStatus
};