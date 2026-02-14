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

import { API_ENDPOINTS, apiFetch, isAuthenticated, getUserId } from './apiUrl.js';

/**
 * Récupère la liste complète des utilisateurs
 * @param {Object} filters - Filtres optionnels (role, search)
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
        let users = await apiFetch(API_ENDPOINTS.users.base);

        // Filtres côté client
        if (filters.role) {
            users = users.filter(u => u.role === filters.role);
        }
        if (filters.search) {
            const term = filters.search.toLowerCase();
            users = users.filter(u => 
                u.name.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term)
            );
        }

        console.log(`✅ ${users.length} utilisateur(s) récupéré(s)`);
        return users;

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
        const user = await apiFetch(API_ENDPOINTS.users.byId(userId));
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
        const user = await apiFetch(API_ENDPOINTS.auth.me);
        console.log('✅ Utilisateur actuel récupéré:', user.name);
        
        // Stocker les infos utilisateur dans localStorage
        localStorage.setItem('userId', user.id);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userName', user.name);
        
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
        if (userData.password.length < 8) {
            throw new Error('Le mot de passe doit contenir au moins 8 caractères');
        }

        const newUser = await apiFetch(API_ENDPOINTS.users.create, {
            method: 'POST',
            body: JSON.stringify(userData)
        });

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
        const updatedUser = await apiFetch(API_ENDPOINTS.users.update(userId), {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

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
    const currentUserId = getUserId();
    if (userId.toString() === currentUserId?.toString()) {
        showErrorNotification('Vous ne pouvez pas supprimer votre propre compte');
        return false;
    }

    try {
        await apiFetch(API_ENDPOINTS.users.delete(userId), {
            method: 'DELETE'
        });

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
 * @param {string} newRole - Nouveau rôle ('ADMIN', 'MAGASINIER', 'EMPLOYE')
 * @returns {Promise<Object|null>} L'utilisateur mis à jour ou null
 */
export async function changeUserRole(userId, newRole) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    const validRoles = ['ADMIN', 'MAGASINIER', 'EMPLOYE'];
    if (!validRoles.includes(newRole)) {
        showErrorNotification(`Rôle invalide. Valeurs autorisées: ${validRoles.join(', ')}`);
        return null;
    }

    // Empêcher de modifier son propre rôle
    const currentUserId = getUserId();
    if (userId.toString() === currentUserId?.toString()) {
        showErrorNotification('Vous ne pouvez pas modifier votre propre rôle');
        return null;
    }

    return updateUser(userId, { role: newRole });
}

/**
 * Filtre les utilisateurs par rôle
 * @param {string} role - Rôle à filtrer ('ADMIN', 'MAGASINIER', 'EMPLOYE')
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
    filterUsersByRole,
    searchUsers
};