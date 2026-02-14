/**
 * ========================================
 * MODULE DE GESTION DES UTILISATEURS
 * ========================================
 * 
 * Ce fichier gère toutes les opérations liées aux utilisateurs :
 * - Récupération de la liste des utilisateurs
 * - Création, modification, suppression d'utilisateurs
 * - Gestion des permissions
 */

import { API_URL, getAuthHeaders, isAuthenticated } from '../config/apiUrl.js';

/**
 * Récupère la liste complète des utilisateurs
 * @param {Object} filters - Filtres optionnels (role, status, etc.)
 * @returns {Promise<Array>} Liste des utilisateurs
 */
export async function Users(filters = {}) {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
        console.warn('⚠️ Aucun token trouvé, utilisateur non connecté');
        redirectToLogin();
        return [];
    }

    try {
        // Construire l'URL avec les filtres
        let url = `${API_URL}/users`;
        const queryParams = new URLSearchParams();

        if (filters.role) {
            queryParams.append('role', filters.role);
        }
        if (filters.status) {
            queryParams.append('status', filters.status);
        }
        if (filters.search) {
            queryParams.append('search', filters.search);
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
            if (response.status === 403) {
                console.error('🚫 Accès interdit - Permissions insuffisantes');
                showErrorNotification('Vous n\'avez pas les permissions nécessaires');
                return [];
            }
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ ${data.length} utilisateur(s) récupéré(s)`);
        return data;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        showErrorNotification('Impossible de charger les utilisateurs');
        return [];
    }
}

/**
 * Récupère un utilisateur spécifique par son ID
 * @param {number|string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} L'utilisateur ou null si non trouvé
 */
export async function fetchUserById(userId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`⚠️ Utilisateur #${userId} non trouvé`);
                return null;
            }
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const user = await response.json();
        console.log(`✅ Utilisateur #${userId} récupéré:`, user.name);
        return user;

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération de l'utilisateur #${userId}:`, error);
        return null;
    }
}

/**
 * Récupère les informations de l'utilisateur actuellement connecté
 * @returns {Promise<Object|null>} L'utilisateur connecté ou null
 */
export async function fetchCurrentUser() {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const user = await response.json();
        console.log('✅ Utilisateur actuel récupéré:', user.name);
        
        // Stocker les infos utilisateur dans localStorage
        localStorage.setItem('userId', user.id);
        localStorage.setItem('role', user.role);
        
        return user;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur actuel:', error);
        return null;
    }
}

/**
 * Crée un nouvel utilisateur
 * @param {Object} userData - Données de l'utilisateur à créer
 * @returns {Promise<Object|null>} L'utilisateur créé ou null en cas d'erreur
 */
export async function createUser(userData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        // Validation des données obligatoires
        const requiredFields = ['name', 'email', 'password', 'role'];
        const missingFields = requiredFields.filter(field => !userData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Champs obligatoires manquants: ${missingFields.join(', ')}`);
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Format d\'email invalide');
        }

        // Validation du mot de passe
        if (userData.password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }

        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création');
        }

        const newUser = await response.json();
        console.log(`✅ Utilisateur créé: ${newUser.name} (ID: ${newUser.id})`);
        showSuccessNotification(`Utilisateur "${newUser.name}" créé avec succès`);
        return newUser;

    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Met à jour un utilisateur existant
 * @param {number|string} userId - ID de l'utilisateur à modifier
 * @param {Object} updatedData - Nouvelles données de l'utilisateur
 * @returns {Promise<Object|null>} L'utilisateur mis à jour ou null en cas d'erreur
 */
export async function updateUser(userId, updatedData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la mise à jour');
        }

        const updatedUser = await response.json();
        console.log(`✅ Utilisateur #${userId} mis à jour`);
        showSuccessNotification('Utilisateur mis à jour avec succès');
        return updatedUser;

    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de l'utilisateur #${userId}:`, error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Supprime un utilisateur
 * @param {number|string} userId - ID de l'utilisateur à supprimer
 * @returns {Promise<boolean>} True si suppression réussie, false sinon
 */
export async function deleteUser(userId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    // Empêcher la suppression de soi-même
    const currentUserId = localStorage.getItem('userId');
    if (userId.toString() === currentUserId) {
        showErrorNotification('Vous ne pouvez pas supprimer votre propre compte');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        console.log(`✅ Utilisateur #${userId} supprimé`);
        showSuccessNotification('Utilisateur supprimé avec succès');
        return true;

    } catch (error) {
        console.error(`❌ Erreur lors de la suppression de l'utilisateur #${userId}:`, error);
        showErrorNotification(error.message);
        return false;
    }
}

/**
 * Change le rôle d'un utilisateur
 * @param {number|string} userId - ID de l'utilisateur
 * @param {string} newRole - Nouveau rôle ('ADMIN', 'USER', etc.)
 * @returns {Promise<Object|null>} L'utilisateur mis à jour ou null
 */
export async function changeUserRole(userId, newRole) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    const validRoles = ['ADMIN', 'USER', 'GUEST'];
    if (!validRoles.includes(newRole)) {
        showErrorNotification(`Rôle invalide. Valeurs autorisées: ${validRoles.join(', ')}`);
        return null;
    }

    // Empêcher de modifier son propre rôle
    const currentUserId = localStorage.getItem('userId');
    if (userId.toString() === currentUserId) {
        showErrorNotification('Vous ne pouvez pas modifier votre propre rôle');
        return null;
    }

    return updateUser(userId, { role: newRole });
}

/**
 * Change le statut d'un utilisateur (actif/inactif)
 * @param {number|string} userId - ID de l'utilisateur
 * @param {boolean} isActive - Nouveau statut
 * @returns {Promise<Object|null>} L'utilisateur mis à jour ou null
 */
export async function changeUserStatus(userId, isActive) {
    return updateUser(userId, { isActive });
}

/**
 * Réinitialise le mot de passe d'un utilisateur
 * @param {number|string} userId - ID de l'utilisateur
 * @param {string} newPassword - Nouveau mot de passe
 * @returns {Promise<boolean>} True si réussi, false sinon
 */
export async function resetUserPassword(userId, newPassword) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    if (newPassword.length < 6) {
        showErrorNotification('Le mot de passe doit contenir au moins 6 caractères');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}/reset-password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ newPassword })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la réinitialisation');
        }

        console.log(`✅ Mot de passe de l'utilisateur #${userId} réinitialisé`);
        showSuccessNotification('Mot de passe réinitialisé avec succès');
        return true;

    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
        showErrorNotification(error.message);
        return false;
    }
}

/**
 * Filtre les utilisateurs par rôle
 * @param {string} role - Rôle à filtrer ('ADMIN', 'USER', etc.)
 * @returns {Promise<Array>} Liste des utilisateurs avec ce rôle
 */
export async function filterUsersByRole(role) {
    return Users({ role });
}

/**
 * Recherche des utilisateurs par nom ou email
 * @param {string} searchTerm - Terme de recherche
 * @returns {Promise<Array>} Liste des utilisateurs correspondants
 */
export async function searchUsers(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return Users();
    }

    return Users({ search: searchTerm });
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
    Users,
    fetchUserById,
    fetchCurrentUser,
    createUser,
    updateUser,
    deleteUser,
    changeUserRole,
    changeUserStatus,
    resetUserPassword,
    filterUsersByRole,
    searchUsers
};